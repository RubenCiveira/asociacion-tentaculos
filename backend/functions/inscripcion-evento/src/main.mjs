import { Client, Databases, Query, ID } from 'node-appwrite'

const DB_ID = process.env.DB_ID ?? 'tentaculos'
const COL   = 'participaciones'

function buildClient() {
  return new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
}

export default async ({ req, res, log, error }) => {
  const userId = req.headers['x-appwrite-user-id']
  log(`[init] userId=${userId ?? '(sin sesión)'}`)
  log(`[env] ENDPOINT=${process.env.APPWRITE_FUNCTION_API_ENDPOINT} PROJECT=${process.env.APPWRITE_FUNCTION_PROJECT_ID} DB_ID=${DB_ID} API_KEY=${process.env.APPWRITE_API_KEY ? '***configurada***' : '(no configurada)'}`)

  if (!userId) return res.json({ error: 'No autenticado' }, 401)

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  } catch {
    return res.json({ error: 'Body inválido' }, 400)
  }

  log(`[body] ${JSON.stringify(body)}`)

  const { accion, evento_id: eventoId } = body

  if (!accion || !eventoId) {
    return res.json({ error: 'Parámetros requeridos: accion, evento_id' }, 400)
  }
  if (!['inscribirse', 'retirarse'].includes(accion)) {
    return res.json({ error: "accion debe ser 'inscribirse' o 'retirarse'" }, 400)
  }

  const db = new Databases(buildClient())

  // --- Verificar que el evento existe y es inscribible ---
  let evento
  try {
    log(`[db] getDocument db=${DB_ID} col=eventos id=${eventoId}`)
    evento = await db.getDocument(DB_ID, 'eventos', eventoId)
    log(`[db] evento encontrado: ${evento.$id} estado=${evento.estado}`)
  } catch (err) {
    error(`[db] fallo getDocument: ${err?.message ?? err} code=${err?.code} type=${err?.type}`)
    return res.json({ error: 'Evento no encontrado', detail: err?.message }, 404)
  }

  if (accion === 'inscribirse') {
    if (['cancelado', 'realizado'].includes(evento.estado)) {
      return res.json({ error: 'No se puede inscribir en un evento cancelado o realizado' }, 409)
    }

    // Buscar participación existente (inscrito, retirado o rechazado)
    const existing = await db.listDocuments(DB_ID, COL, [
      Query.equal('evento_id', eventoId),
      Query.equal('user_id', userId),
      Query.limit(1),
    ])

    if (existing.documents.length > 0) {
      const doc = existing.documents[0]
      if (doc.estado === 'rechazado') {
        return res.json({ error: 'Tu inscripción fue rechazada por un administrador' }, 403)
      }
      if (doc.estado === 'inscrito') {
        return res.json({ error: 'Ya estás inscrito en este evento' }, 409)
      }
      // estado === 'retirado' → reactivar
      const updated = await db.updateDocument(DB_ID, COL, doc.$id, { estado: 'inscrito' })
      log(`Usuario ${userId} reactivó inscripción en evento ${eventoId}`)
      return res.json(updated)
    }

    // Buscar socio vinculado para denormalizar nombre
    const sociosResult = await db.listDocuments(DB_ID, 'socios', [
      Query.equal('user_id', userId),
      Query.limit(1),
    ])
    const socio = sociosResult.documents[0] ?? null

    const participacion = await db.createDocument(DB_ID, COL, ID.unique(), {
      evento_id:      eventoId,
      user_id:        userId,
      socio_id:       socio?.$id        ?? null,
      nombre_display: socio
        ? `${socio.nombre} ${socio.apellidos}`.trim()
        : null,
      estado: 'inscrito',
    })

    log(`Usuario ${userId} inscrito en evento ${eventoId} (socio: ${socio?.$id ?? 'ninguno'})`)
    return res.json(participacion)
  }

  // --- retirarse ---
  const existing = await db.listDocuments(DB_ID, COL, [
    Query.equal('evento_id', eventoId),
    Query.equal('user_id', userId),
    Query.limit(1),
  ])

  if (existing.documents.length === 0) {
    return res.json({ error: 'No estás inscrito en este evento' }, 404)
  }
  const doc = existing.documents[0]
  if (doc.estado === 'retirado') {
    return res.json({ error: 'Ya te has retirado de este evento' }, 409)
  }

  const updated = await db.updateDocument(DB_ID, COL, doc.$id, { estado: 'retirado' })
  log(`Usuario ${userId} se retiró del evento ${eventoId}`)
  return res.json(updated)
}
