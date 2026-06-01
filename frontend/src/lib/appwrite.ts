import { Client, Account, Databases, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export const DB_ID = 'tentaculos'

export const COLLECTIONS = {
  SOCIOS: 'socios',
  MATERIALES_SOCIO: 'materiales_socio',
  MATERIALES_ASOCIACION: 'materiales_asociacion',
  LUGARES: 'lugares',
  EVENTOS: 'eventos',
  PUBLICACIONES: 'publicaciones',
} as const
