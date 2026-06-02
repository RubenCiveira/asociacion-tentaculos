import type { Models } from 'appwrite'

type User = Models.User<Models.Preferences>

const has = (user: User | null, label: string) =>
  user?.labels?.includes(label) ?? false

export const isAdmin          = (u: User | null) => has(u, 'admin')
export const isSocio          = (u: User | null) => has(u, 'socio') || isAdmin(u)
export const isGestorMaterial = (u: User | null) => has(u, 'gestorMaterial') || isAdmin(u)

/** Cuenta con al menos un rol reconocido (no pendiente de validación). */
export const isValidated = (u: User | null) => isSocio(u) || isAdmin(u)

/** Puede leer el listado de socios y gestionar materiales. */
export const canManageMateriales = (u: User | null) => isAdmin(u) || isGestorMaterial(u)

/** Puede leer eventos y publicaciones. */
export const canReadContent = (u: User | null) => isValidated(u) || isGestorMaterial(u)
