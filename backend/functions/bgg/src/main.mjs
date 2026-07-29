import { Client, Databases, Query, ID, Permission, Role } from 'node-appwrite'
import { XMLParser } from 'fast-xml-parser'

const DB_ID        = process.env.DB_ID ?? 'tentaculos'
const COL_PERFILES = 'bgg_perfiles'
const COL_PARTIDAS = 'bgg_partidas'
const BGG_API      = 'https://boardgamegeek.com/xmlapi2'

const MAX_PAGINAS_SYNC = 10 // 100 partidas por página → hasta 1000 partidas

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

function buildClient() {
  return new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
}

const toArray = x => (x == null ? [] : Array.isArray(x) ? x : [x])

/** GET a la API XML de BGG con reintentos (BGG responde 202/429 cuando encola o limita). */
async function fetchBgg(path, log) {
  // Desde 2025 la XML API exige registrar la app y enviar un token:
  // https://boardgamegeek.com/using_the_xml_api
  const token = process.env.BGG_TOKEN
  if (!token) {
    throw new Error('BGG_TOKEN no configurado: registra la app en boardgamegeek.com/using_the_xml_api y añade el token como variable de la función')
  }
  const url = `${BGG_API}${path}`
  for (let intento = 1; intento <= 4; intento++) {
    log(`[bgg] GET ${url} (intento ${intento})`)
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/xml',
        Authorization: `Bearer ${token}`,
      },
    })
    if (resp.status === 200) {
      return parser.parse(await resp.text())
    }
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('BGG rechazó el token (401/403): revisa la variable BGG_TOKEN de la función')
    }
    if (![202, 429, 503].includes(resp.status)) {
      throw new Error(`BGG respondió ${resp.status}`)
    }
    await new Promise(r => setTimeout(r, 1500 * intento))
  }
  throw new Error('BGG no respondió tras varios intentos')
}

/** Permisos de fila: el dueño siempre lee; los socios solo si publica. */
function permisos(userId, publicar) {
  const p = [Permission.read(Role.user(userId))]
  if (publicar) p.push(Permission.read(Role.label('socio')))
  return p
}

async function buscarSocio(db, userId) {
  const r = await db.listDocuments(DB_ID, 'socios', [
    Query.equal('user_id', userId),
    Query.limit(1),
  ])
  return r.documents[0] ?? null
}

async function getPerfil(db, userId) {
  const r = await db.listDocuments(DB_ID, COL_PERFILES, [
    Query.equal('user_id', userId),
    Query.limit(1),
  ])
  return r.documents[0] ?? null
}

async function listarPartidasUsuario(db, userId) {
  const docs = []
  let cursor = null
  for (;;) {
    const q = [Query.equal('user_id', userId), Query.limit(500)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const r = await db.listDocuments(DB_ID, COL_PARTIDAS, q)
    docs.push(...r.documents)
    if (r.documents.length < 500) return docs
    cursor = r.documents[r.documents.length - 1].$id
  }
}

// --- Acciones ---

async function accionBuscar(q, log) {
  const data = await fetchBgg(
    `/search?query=${encodeURIComponent(q)}&type=boardgame,boardgameexpansion`,
    log,
  )
  const items = toArray(data?.items?.item).slice(0, 12)
  if (items.length === 0) return []

  // El search no trae imágenes: pedimos las fichas en una sola llamada
  const ids = items.map(i => i['@_id']).join(',')
  let fichas = {}
  try {
    const detalle = await fetchBgg(`/thing?id=${ids}`, log)
    for (const it of toArray(detalle?.items?.item)) {
      fichas[it['@_id']] = it.thumbnail ?? null
    }
  } catch (err) {
    log(`[bgg] sin thumbnails: ${err.message}`)
  }

  return items.map(i => {
    const nombres = toArray(i.name)
    const primario = nombres.find(n => n['@_type'] === 'primary') ?? nombres[0]
    return {
      bgg_id: Number(i['@_id']),
      nombre: primario?.['@_value'] ?? '(sin nombre)',
      anio: i.yearpublished?.['@_value'] ? Number(i.yearpublished['@_value']) : null,
      thumbnail: fichas[i['@_id']] ?? null,
    }
  })
}

async function accionJuego(id, log) {
  const data = await fetchBgg(`/thing?id=${encodeURIComponent(id)}&stats=1`, log)
  const item = toArray(data?.items?.item)[0]
  if (!item) return null
  const nombres = toArray(item.name)
  const primario = nombres.find(n => n['@_type'] === 'primary') ?? nombres[0]
  return {
    bgg_id: Number(item['@_id']),
    nombre: primario?.['@_value'] ?? '(sin nombre)',
    anio: item.yearpublished?.['@_value'] ? Number(item.yearpublished['@_value']) : null,
    thumbnail: item.thumbnail ?? null,
    imagen: item.image ?? null,
    min_jugadores: item.minplayers?.['@_value'] ? Number(item.minplayers['@_value']) : null,
    max_jugadores: item.maxplayers?.['@_value'] ? Number(item.maxplayers['@_value']) : null,
    duracion_min: item.playingtime?.['@_value'] ? Number(item.playingtime['@_value']) : null,
    rating: item.statistics?.ratings?.average?.['@_value']
      ? Number(item.statistics.ratings.average['@_value'])
      : null,
  }
}

async function accionVincular(db, userId, bggUsername, log) {
  // Comprobar que el usuario existe en BGG (devuelve 200 con id vacío si no)
  const data = await fetchBgg(`/user?name=${encodeURIComponent(bggUsername)}`, log)
  if (!data?.user?.['@_id']) {
    return { error: `El usuario "${bggUsername}" no existe en BGG`, status: 404 }
  }

  const socio = await buscarSocio(db, userId)
  const existente = await getPerfil(db, userId)
  const datos = {
    user_id: userId,
    socio_id: socio?.$id ?? null,
    nombre_display: socio ? `${socio.nombre} ${socio.apellidos}`.trim() : null,
    bgg_username: data.user['@_name'] ?? bggUsername,
  }

  if (existente) {
    const perfil = await db.updateDocument(DB_ID, COL_PERFILES, existente.$id, datos)
    return { perfil }
  }
  const perfil = await db.createDocument(
    DB_ID, COL_PERFILES, ID.unique(),
    { ...datos, publicar_stats: false },
    permisos(userId, false),
  )
  return { perfil }
}

async function accionSync(db, userId, log) {
  const perfil = await getPerfil(db, userId)
  if (!perfil) return { error: 'No tienes una cuenta BGG vinculada', status: 404 }

  const existentes = new Map(
    (await listarPartidasUsuario(db, userId)).map(d => [d.bgg_play_id, d]),
  )
  const perms = permisos(userId, perfil.publicar_stats)

  let total = 0
  let creadas = 0
  let actualizadas = 0

  for (let pagina = 1; pagina <= MAX_PAGINAS_SYNC; pagina++) {
    const data = await fetchBgg(
      `/plays?username=${encodeURIComponent(perfil.bgg_username)}&page=${pagina}`,
      log,
    )
    total = Number(data?.plays?.['@_total'] ?? 0)
    const plays = toArray(data?.plays?.play)
    if (plays.length === 0) break

    for (const play of plays) {
      const item = toArray(play.item).find(i => i['@_objecttype'] === 'thing')
      const fecha = new Date(play['@_date'])
      if (!item || isNaN(fecha.getTime())) continue

      const datos = {
        user_id: userId,
        socio_id: perfil.socio_id ?? null,
        nombre_display: perfil.nombre_display ?? null,
        bgg_play_id: String(play['@_id']),
        bgg_game_id: Number(item['@_objectid']),
        juego_nombre: String(item['@_name'] ?? '(sin nombre)').slice(0, 250),
        fecha: fecha.toISOString(),
        cantidad: Number(play['@_quantity'] ?? 1) || 1,
        duracion_min: Number(play['@_length'] ?? 0) || null,
        comentarios: play.comments ? String(play.comments).slice(0, 1000) : null,
      }

      const previa = existentes.get(datos.bgg_play_id)
      if (previa) {
        const cambia = ['bgg_game_id', 'juego_nombre', 'fecha', 'cantidad', 'duracion_min', 'comentarios']
          .some(k => (previa[k] ?? null) !== (datos[k] ?? null))
        if (cambia) {
          await db.updateDocument(DB_ID, COL_PARTIDAS, previa.$id, datos)
          actualizadas++
        }
      } else {
        await db.createDocument(DB_ID, COL_PARTIDAS, ID.unique(), datos, perms)
        creadas++
      }
    }

    if (pagina * 100 >= total) break
  }

  const actualizado = await db.updateDocument(DB_ID, COL_PERFILES, perfil.$id, {
    fecha_ultima_sync: new Date().toISOString(),
    partidas_count: total,
  })

  log(`[sync] ${perfil.bgg_username}: total=${total} creadas=${creadas} actualizadas=${actualizadas}`)
  return { perfil: actualizado, total, creadas, actualizadas }
}

async function accionPrivacidad(db, userId, publicar, log) {
  const perfil = await getPerfil(db, userId)
  if (!perfil) return { error: 'No tienes una cuenta BGG vinculada', status: 404 }

  const perms = permisos(userId, publicar)
  const actualizado = await db.updateDocument(
    DB_ID, COL_PERFILES, perfil.$id,
    { publicar_stats: publicar },
    perms,
  )

  const partidas = await listarPartidasUsuario(db, userId)
  for (const p of partidas) {
    await db.updateDocument(DB_ID, COL_PARTIDAS, p.$id, {}, perms)
  }

  log(`[privacidad] user=${userId} publicar=${publicar} partidas=${partidas.length}`)
  return { perfil: actualizado, partidas: partidas.length }
}

async function accionDesvincular(db, userId, log) {
  const perfil = await getPerfil(db, userId)
  if (!perfil) return { error: 'No tienes una cuenta BGG vinculada', status: 404 }

  const partidas = await listarPartidasUsuario(db, userId)
  for (const p of partidas) {
    await db.deleteDocument(DB_ID, COL_PARTIDAS, p.$id)
  }
  await db.deleteDocument(DB_ID, COL_PERFILES, perfil.$id)

  log(`[desvincular] user=${userId} partidas eliminadas=${partidas.length}`)
  return { ok: true, partidas: partidas.length }
}

export default async ({ req, res, log, error }) => {
  const userId = req.headers['x-appwrite-user-id']
  if (!userId) return res.json({ error: 'No autenticado' }, 401)

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  } catch {
    return res.json({ error: 'Body inválido' }, 400)
  }

  const { accion } = body
  log(`[init] userId=${userId} accion=${accion}`)

  const db = new Databases(buildClient())

  try {
    switch (accion) {
      case 'buscar': {
        const q = (body.q ?? '').trim()
        if (q.length < 2) return res.json({ error: 'Consulta demasiado corta' }, 400)
        return res.json({ resultados: await accionBuscar(q, log) })
      }
      case 'juego': {
        if (!body.bgg_id) return res.json({ error: 'Falta bgg_id' }, 400)
        const juego = await accionJuego(body.bgg_id, log)
        if (!juego) return res.json({ error: 'Juego no encontrado' }, 404)
        return res.json({ juego })
      }
      case 'vincular': {
        const username = (body.bgg_username ?? '').trim()
        if (!username) return res.json({ error: 'Falta bgg_username' }, 400)
        const r = await accionVincular(db, userId, username, log)
        return r.error ? res.json({ error: r.error }, r.status) : res.json(r)
      }
      case 'sync': {
        const r = await accionSync(db, userId, log)
        return r.error ? res.json({ error: r.error }, r.status) : res.json(r)
      }
      case 'privacidad': {
        if (typeof body.publicar !== 'boolean') return res.json({ error: 'Falta publicar (boolean)' }, 400)
        const r = await accionPrivacidad(db, userId, body.publicar, log)
        return r.error ? res.json({ error: r.error }, r.status) : res.json(r)
      }
      case 'desvincular': {
        const r = await accionDesvincular(db, userId, log)
        return r.error ? res.json({ error: r.error }, r.status) : res.json(r)
      }
      default:
        return res.json({ error: `Acción desconocida: ${accion}` }, 400)
    }
  } catch (err) {
    error(`[error] accion=${accion}: ${err?.message ?? err}`)
    return res.json({ error: 'Error interno', detail: err?.message }, 500)
  }
}
