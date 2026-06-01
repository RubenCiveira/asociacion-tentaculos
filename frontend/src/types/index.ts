import { type Models } from 'appwrite'

export interface Socio extends Models.Document {
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  fecha_alta: string
  activo: boolean
  email?: string
  telefono?: string
  notas?: string
}

export type TipoMaterial = 'juego_mesa' | 'rol' | 'wargame' | 'accesorio' | 'otro'

export const TIPO_MATERIAL_LABELS: Record<TipoMaterial, string> = {
  juego_mesa: 'Juego de mesa',
  rol: 'Rol',
  wargame: 'Wargame',
  accesorio: 'Accesorio',
  otro: 'Otro',
}

export interface MaterialSocio extends Models.Document {
  socio_id: string
  nombre: string
  tipo: TipoMaterial
  descripcion?: string
  prestado_asociacion: boolean
  notas?: string
}

export type EstadoMaterial = 'bueno' | 'deteriorado' | 'perdido'

export const ESTADO_MATERIAL_LABELS: Record<EstadoMaterial, string> = {
  bueno: 'Bueno',
  deteriorado: 'Deteriorado',
  perdido: 'Perdido',
}

export interface MaterialAsociacion extends Models.Document {
  nombre: string
  tipo: TipoMaterial
  descripcion?: string
  estado: EstadoMaterial
  ubicacion?: string
  donado_por?: string
  fecha_adquisicion?: string
  notas?: string
}

export type TipoLugar = 'local_propio' | 'bar' | 'biblioteca' | 'casa' | 'otro'

export const TIPO_LUGAR_LABELS: Record<TipoLugar, string> = {
  local_propio: 'Local propio',
  bar: 'Bar / cafetería',
  biblioteca: 'Biblioteca',
  casa: 'Casa particular',
  otro: 'Otro',
}

export interface Lugar extends Models.Document {
  nombre: string
  direccion?: string
  tipo: TipoLugar
  capacidad?: number
  activo: boolean
  notas?: string
}

export type TipoJuego = 'rol' | 'wargame' | 'eurogame' | 'party' | 'otro'
export type EstadoEvento = 'planificado' | 'confirmado' | 'cancelado' | 'realizado'

export const TIPO_JUEGO_LABELS: Record<TipoJuego, string> = {
  rol: 'Rol',
  wargame: 'Wargame',
  eurogame: 'Eurogame',
  party: 'Party',
  otro: 'Otro',
}

export const ESTADO_EVENTO_LABELS: Record<EstadoEvento, string> = {
  planificado: 'Planificado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  realizado: 'Realizado',
}

export interface Evento extends Models.Document {
  titulo: string
  tipo_juego: TipoJuego
  fecha_inicio: string
  fecha_fin?: string
  lugar_id?: string
  descripcion?: string
  max_jugadores?: number
  asistentes: string[]
  estado: EstadoEvento
  notas?: string
}

export type RedSocial = 'instagram' | 'facebook' | 'twitter' | 'tiktok'
export type EstadoPublicacion = 'borrador' | 'listo' | 'publicado'

export const RED_SOCIAL_LABELS: Record<RedSocial, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  tiktok: 'TikTok',
}

export const ESTADO_PUBLICACION_LABELS: Record<EstadoPublicacion, string> = {
  borrador: 'Borrador',
  listo: 'Listo para publicar',
  publicado: 'Publicado',
}

export interface Publicacion extends Models.Document {
  titulo: string
  contenido: string
  estado: EstadoPublicacion
  redes: RedSocial[]
  fecha_publicacion?: string
  imagen_id?: string
  evento_id?: string
  notas?: string
}
