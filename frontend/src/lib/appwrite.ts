import { Client, Account, Databases, Functions, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export const DB_ID = 'tentaculos'

export const COLLECTIONS = {
  SOCIOS: 'socios',
  MATERIALES_SOCIO: 'materiales_socio',
  MATERIALES_ASOCIACION: 'materiales_asociacion',
  LUGARES: 'lugares',
  EVENTOS: 'eventos',
  PARTICIPACIONES: 'participaciones',
  PUBLICACIONES: 'publicaciones',
} as const

export const FUNCTIONS = {
  INSCRIPCION_EVENTO: import.meta.env.VITE_FUNCTION_INSCRIPCION_EVENTO_ID as string,
} as const
