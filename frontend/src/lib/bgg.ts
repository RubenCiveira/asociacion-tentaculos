import { ExecutionMethod } from 'appwrite'
import { functions, FUNCTIONS } from '@/lib/appwrite'
import type { BggJuegoRef, BggPerfil } from '@/types'

async function callBgg<T>(body: Record<string, unknown>): Promise<T> {
  if (!FUNCTIONS.BGG) {
    throw new Error('VITE_FUNCTION_BGG_ID no configurada en .env.local')
  }
  const execution = await functions.createExecution(
    FUNCTIONS.BGG,
    JSON.stringify(body),
    false,
    '/',
    ExecutionMethod.POST,
    { 'Content-Type': 'application/json' },
  )
  // Appwrite siempre resuelve con 200 aunque la función devuelva un error interno.
  if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
    let message = 'Error en la función BGG'
    try {
      const parsed = JSON.parse(execution.responseBody) as { error?: string }
      if (parsed.error) message = parsed.error
    } catch { /* noop */ }
    throw new Error(message)
  }
  return JSON.parse(execution.responseBody) as T
}

export interface BggResultadoBusqueda {
  bgg_id: number
  nombre: string
  anio: number | null
  thumbnail: string | null
}

export function buscarJuegosBgg(q: string) {
  return callBgg<{ resultados: BggResultadoBusqueda[] }>({ accion: 'buscar', q })
    .then(r => r.resultados)
}

export function ficharJuegoBgg(bggId: number) {
  return callBgg<{ juego: BggJuegoRef & { imagen?: string | null } }>({ accion: 'juego', bgg_id: bggId })
    .then(r => r.juego)
}

export function vincularBgg(bggUsername: string) {
  return callBgg<{ perfil: BggPerfil }>({ accion: 'vincular', bgg_username: bggUsername })
}

export function sincronizarBgg() {
  return callBgg<{ perfil: BggPerfil; total: number; creadas: number; actualizadas: number }>({ accion: 'sync' })
}

export function cambiarPrivacidadBgg(publicar: boolean) {
  return callBgg<{ perfil: BggPerfil; partidas: number }>({ accion: 'privacidad', publicar })
}

export function desvincularBgg() {
  return callBgg<{ ok: boolean; partidas: number }>({ accion: 'desvincular' })
}
