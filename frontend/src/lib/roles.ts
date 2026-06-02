import type { Models } from 'appwrite'

type User = Models.User<Models.Preferences>

const has = (user: User | null, label: string) =>
  user?.labels?.includes(label) ?? false

export const isAdmin          = (u: User | null) => has(u, 'admin')
export const isSocio          = (u: User | null) => has(u, 'socio') || isAdmin(u)
export const isGestorMaterial = (u: User | null) => has(u, 'gestorMaterial') || isAdmin(u)

/** Cuenta con al menos un rol reconocido (no pendiente de validación). */
export const isValidated = (u: User | null) => isSocio(u) || isAdmin(u)

export const isGestorEventos       = (u: User | null) => has(u, 'gestorEventos') || isAdmin(u)
export const isGestorPublicaciones = (u: User | null) => has(u, 'gestorPublicaciones') || isAdmin(u)

/** Puede leer el listado de socios y gestionar materiales. */
export const canManageMateriales = (u: User | null) => isAdmin(u) || isGestorMaterial(u)

/** Puede leer eventos y publicaciones. */
export const canReadContent = (u: User | null) => isValidated(u) || isGestorMaterial(u)

/** Puede crear/editar/eliminar eventos. */
export const canWriteEventos = (u: User | null) => isAdmin(u) || isGestorEventos(u)

/** Puede crear/editar/eliminar publicaciones. */
export const canWritePublicaciones = (u: User | null) => isAdmin(u) || isGestorPublicaciones(u)
