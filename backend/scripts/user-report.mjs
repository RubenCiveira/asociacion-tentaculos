/**
 * Reporte de accesos — cruza usuarios de Appwrite con registros de socios.
 *
 * Muestra:
 *   1. Usuarios sin label "socio" ni "admin" (pendientes de validación)
 *   2. Usuarios con label "socio" pero sin registro en la colección socios
 *   3. Socios activos sin user_id vinculado
 *
 * Uso:
 *   node backend/scripts/user-report.mjs
 */

import { Client, Users, Databases, Query } from 'node-appwrite'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env')
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=')
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim()
  })
} catch { /* .env opcional */ }

const ENDPOINT   = process.env.APPWRITE_ENDPOINT   ?? 'https://appwrite.civeira.net/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID  ?? '6a1c8e6400066368d20b'
const API_KEY    = process.env.APPWRITE_API_KEY

if (!API_KEY) {
  console.error('ERROR: Define APPWRITE_API_KEY en backend/.env')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const users = new Users(client)
const db    = new Databases(client)

const DB_ID = 'tentaculos'
const CYAN  = '\x1b[36m'; const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'; const RED = '\x1b[31m'; const NC = '\x1b[0m'

async function fetchAllUsers() {
  const all = []
  let cursor = null
  while (true) {
    const q = [Query.limit(100)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const { users: batch } = await users.list(q)
    all.push(...batch)
    if (batch.length < 100) break
    cursor = batch[batch.length - 1].$id
  }
  return all
}

async function fetchAllSocios() {
  const all = []
  let cursor = null
  while (true) {
    const q = [Query.limit(100)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const { documents } = await db.listDocuments(DB_ID, 'socios', q)
    all.push(...documents)
    if (documents.length < 100) break
    cursor = documents[documents.length - 1].$id
  }
  return all
}

async function main() {
  console.log(`\n${CYAN}🐙 Reporte de accesos — Tentáculos${NC}\n`)

  const [allUsers, allSocios] = await Promise.all([fetchAllUsers(), fetchAllSocios()])

  const sociosByUserId = new Map(
    allSocios.filter(s => s.user_id).map(s => [s.user_id, s]),
  )

  // ─── 1. Usuarios sin label socio ni admin ───────────────────────────────
  const pendientes = allUsers.filter(u =>
    !u.labels.includes('socio') && !u.labels.includes('admin'),
  )

  console.log(`${YELLOW}▶ Usuarios pendientes de validación (sin label socio ni admin)${NC}`)
  console.log(`  Total: ${pendientes.length}\n`)
  if (pendientes.length) {
    for (const u of pendientes) {
      const labels = u.labels.length ? u.labels.join(', ') : '(sin labels)'
      console.log(`  · ${u.name || '(sin nombre)'} — ${u.email}`)
      console.log(`    ID: ${u.$id}  |  Labels: ${labels}`)
    }
  } else {
    console.log(`  ${GREEN}✓ Ninguno${NC}`)
  }

  // ─── 2. Usuarios con label socio sin registro asociado ──────────────────
  console.log(`\n${YELLOW}▶ Usuarios con label "socio" sin registro en socios${NC}`)
  const sociosSinRegistro = allUsers.filter(u =>
    u.labels.includes('socio') && !sociosByUserId.has(u.$id),
  )
  console.log(`  Total: ${sociosSinRegistro.length}\n`)
  if (sociosSinRegistro.length) {
    for (const u of sociosSinRegistro) {
      console.log(`  · ${u.name || '(sin nombre)'} — ${u.email}`)
      console.log(`    ID: ${u.$id}`)
    }
  } else {
    console.log(`  ${GREEN}✓ Ninguno${NC}`)
  }

  // ─── 3. Socios activos sin user_id ──────────────────────────────────────
  const sociosSinCuenta = allSocios.filter(s => s.activo && !s.user_id)
  console.log(`\n${YELLOW}▶ Socios activos sin cuenta de acceso vinculada${NC}`)
  console.log(`  Total: ${sociosSinCuenta.length}\n`)
  if (sociosSinCuenta.length) {
    for (const s of sociosSinCuenta) {
      console.log(`  · ${s.apellidos}, ${s.nombre}${s.email ? ` — ${s.email}` : ' (sin email)'}`)
      console.log(`    Socio ID: ${s.$id}`)
    }
  } else {
    console.log(`  ${GREEN}✓ Ninguno${NC}`)
  }

  // ─── Resumen ─────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Usuarios totales: ${allUsers.length}  |  Socios totales: ${allSocios.length}`)
  const alertas = pendientes.length + sociosSinRegistro.length + sociosSinCuenta.length
  if (alertas > 0) {
    console.log(`${RED}⚠  ${alertas} elemento${alertas > 1 ? 's' : ''} require${alertas > 1 ? 'n' : ''} atención${NC}\n`)
  } else {
    console.log(`${GREEN}✅ Todo en orden${NC}\n`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
