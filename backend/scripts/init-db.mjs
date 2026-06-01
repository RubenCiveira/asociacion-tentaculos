/**
 * Script de inicialización de la base de datos Tentáculos en Appwrite.
 * Crea la DB, colecciones, atributos, índices y permisos desde cero.
 *
 * Uso:
 *   cp .env.example .env   # y rellena APPWRITE_API_KEY
 *   npm run init-db
 *
 * Es seguro volver a ejecutar: comprueba si cada recurso existe antes de crearlo.
 */

import { Client, Databases, Permission, Role } from 'node-appwrite'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// --- Config ---
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env')
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=')
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim()
  })
} catch { /* .env opcional si las vars ya están en el entorno */ }

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

const db = new Databases(client)

const DB_ID = 'tentaculos'
const PERMISSIONS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
]

// --- Helpers ---
async function ensure(label, fn) {
  try {
    await fn()
    console.log(`  ✓ ${label}`)
  } catch (e) {
    if (e.code === 409) {
      console.log(`  · ${label} (ya existe)`)
    } else {
      console.error(`  ✗ ${label}: ${e.message}`)
      throw e
    }
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Appwrite requiere un pequeño delay entre creación de atributos
async function attr(fn) { await fn(); await sleep(300) }

// --- Crear base de datos ---
async function createDatabase() {
  await ensure(`DB: ${DB_ID}`, () => db.create(DB_ID, 'Tentáculos'))
}

// --- Colección: socios ---
async function createSocios() {
  const COL = 'socios'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Socios', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'nombre', 100, true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'apellidos', 150, true))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_nacimiento', true))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_alta', true))
  await attr(() => db.createBooleanAttribute(DB_ID, COL, 'activo', true, true))
  await attr(() => db.createEmailAttribute(DB_ID, COL, 'email', false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'telefono', 20, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 1000, false))

  await sleep(1000) // esperar a que los atributos se propaguen

  await ensure(`Índice socios.activo`, () =>
    db.createIndex(DB_ID, COL, 'idx_activo', 'key', ['activo']))
  await ensure(`Índice socios.apellidos`, () =>
    db.createIndex(DB_ID, COL, 'idx_apellidos', 'key', ['apellidos']))
  await ensure(`FTS socios.nombre`, () =>
    db.createIndex(DB_ID, COL, 'idx_nombre_fts', 'fulltext', ['nombre']))
}

// --- Colección: materiales_socio ---
async function createMaterialesSocio() {
  const COL = 'materiales_socio'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Materiales de socios', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'socio_id', 36, true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'nombre', 200, true))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'tipo', ['juego_mesa','rol','wargame','accesorio','otro'], true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'descripcion', 500, false))
  await attr(() => db.createBooleanAttribute(DB_ID, COL, 'prestado_asociacion', true, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 500, false))

  await sleep(1000)
  await ensure(`Índice materiales_socio.socio_id`, () =>
    db.createIndex(DB_ID, COL, 'idx_socio_id', 'key', ['socio_id']))
}

// --- Colección: materiales_asociacion ---
async function createMaterialesAsociacion() {
  const COL = 'materiales_asociacion'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Materiales de la asociación', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'nombre', 200, true))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'tipo', ['juego_mesa','rol','wargame','accesorio','otro'], true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'descripcion', 500, false))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'estado', ['bueno','deteriorado','perdido'], true, 'bueno'))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'ubicacion', 200, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'donado_por', 36, false))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_adquisicion', false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 500, false))

  await sleep(1000)
  await ensure(`Índice materiales_asociacion.estado`, () =>
    db.createIndex(DB_ID, COL, 'idx_estado', 'key', ['estado']))
}

// --- Colección: lugares ---
async function createLugares() {
  const COL = 'lugares'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Lugares', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'nombre', 150, true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'direccion', 300, false))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'tipo', ['local_propio','bar','biblioteca','casa','otro'], true))
  await attr(() => db.createIntegerAttribute(DB_ID, COL, 'capacidad', false))
  await attr(() => db.createBooleanAttribute(DB_ID, COL, 'activo', true, true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 500, false))

  await sleep(1000)
  await ensure(`Índice lugares.activo`, () =>
    db.createIndex(DB_ID, COL, 'idx_activo', 'key', ['activo']))
}

// --- Colección: eventos ---
async function createEventos() {
  const COL = 'eventos'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Eventos', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'titulo', 200, true))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'tipo_juego', ['rol','wargame','eurogame','party','otro'], true))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_inicio', true))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_fin', false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'lugar_id', 36, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'descripcion', 1000, false))
  await attr(() => db.createIntegerAttribute(DB_ID, COL, 'max_jugadores', false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'asistentes', 36, false, null, true))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'estado', ['planificado','confirmado','cancelado','realizado'], true, 'planificado'))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 500, false))

  await sleep(1000)
  await ensure(`Índice eventos.fecha_inicio`, () =>
    db.createIndex(DB_ID, COL, 'idx_fecha', 'key', ['fecha_inicio'], ['DESC']))
  await ensure(`Índice eventos.estado`, () =>
    db.createIndex(DB_ID, COL, 'idx_estado', 'key', ['estado']))
}

// --- Colección: publicaciones ---
async function createPublicaciones() {
  const COL = 'publicaciones'
  await ensure(`Colección: ${COL}`, () =>
    db.createCollection(DB_ID, COL, 'Publicaciones', PERMISSIONS, false))

  await attr(() => db.createStringAttribute(DB_ID, COL, 'titulo', 200, true))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'contenido', 5000, true))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'estado', ['borrador','listo','publicado'], true, 'borrador'))
  await attr(() => db.createEnumAttribute(DB_ID, COL, 'redes', ['instagram','facebook','twitter','tiktok'], true, null, true))
  await attr(() => db.createDatetimeAttribute(DB_ID, COL, 'fecha_publicacion', false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'imagen_id', 36, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'evento_id', 36, false))
  await attr(() => db.createStringAttribute(DB_ID, COL, 'notas', 500, false))

  await sleep(1000)
  await ensure(`Índice publicaciones.estado`, () =>
    db.createIndex(DB_ID, COL, 'idx_estado', 'key', ['estado']))
  await ensure(`Índice publicaciones.fecha_publicacion`, () =>
    db.createIndex(DB_ID, COL, 'idx_fecha', 'key', ['fecha_publicacion'], ['DESC']))
}

// --- Storage bucket ---
async function createStorage() {
  const { Storage } = await import('node-appwrite')
  const storage = new Storage(client)
  await ensure('Bucket: imagenes_publicaciones', () =>
    storage.createBucket(
      'imagenes_publicaciones',
      'Imágenes de publicaciones',
      [Permission.read(Role.users()), Permission.create(Role.users()), Permission.delete(Role.users())],
      false, false, 5_000_000, ['jpg','jpeg','png','gif','webp'],
    ))
}

// --- Main ---
async function main() {
  console.log('🐙 Inicializando base de datos Tentáculos...\n')

  await createDatabase()
  console.log('\nColecciones:')
  await createSocios()
  await createMaterialesSocio()
  await createMaterialesAsociacion()
  await createLugares()
  await createEventos()
  await createPublicaciones()
  console.log('\nStorage:')
  await createStorage()

  console.log('\n✅ Base de datos lista.')
}

main().catch(e => { console.error(e); process.exit(1) })
