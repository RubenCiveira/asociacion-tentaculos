import { useState } from 'react'
import { ID, Permission, Role } from 'appwrite'
import { Link, UserCheck, UserX, Send, Unlink } from 'lucide-react'
import { account, databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/contexts/ToastContext'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { Socio } from '@/types'

interface Props {
  socio: Socio
}

// Permisos de colección que siempre se mantienen en documentos de socios
const SOCIOS_DOC_PERMS = (linkedUserId?: string | null) => [
  Permission.read(Role.label('admin')),
  Permission.read(Role.label('gestorMaterial')),
  ...(linkedUserId ? [Permission.read(Role.user(linkedUserId))] : []),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
]

export function CuentaAcceso({ socio }: Props) {
  const toast = useToast()
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)

  const [showAsociar, setShowAsociar] = useState(false)
  const [showDesasociar, setShowDesasociar] = useState(false)
  const [userId, setUserId] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  async function updateSocio(data: Record<string, unknown>, perms: string[]) {
    setSaving(true)
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.SOCIOS, socio.$id, data, perms)
      qc.invalidateQueries({ queryKey: ['socios'] })
    } finally {
      setSaving(false)
    }
  }

  const hasAccount = !!socio.user_id

  async function handleInvitar() {
    if (!socio.email) { toast.error('El socio no tiene email registrado'); return }
    setSendingInvite(true)
    try {
      const newUserId = ID.unique()
      const base = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')
      await account.createMagicURLToken(newUserId, socio.email, `${window.location.origin}${base}/#/`)
      await updateSocio({ user_id: newUserId }, SOCIOS_DOC_PERMS(newUserId))
      toast.success(`Invitación enviada a ${socio.email}`)
    } catch (e: unknown) {
      toast.error(`Error al enviar invitación: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleAsociar() {
    if (!userId.trim()) return
    try {
      await updateSocio({ user_id: userId.trim() }, SOCIOS_DOC_PERMS(userId.trim()))
      toast.success('Cuenta asociada correctamente')
      setShowAsociar(false); setUserId('')
    } catch {
      toast.error('Error al asociar la cuenta')
    }
  }

  async function handleDesasociar() {
    try {
      await updateSocio({ user_id: null }, SOCIOS_DOC_PERMS(null))
      toast.success('Cuenta desasociada')
      setShowDesasociar(false)
    } catch {
      toast.error('Error al desasociar la cuenta')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Link size={14} />
        Cuenta de acceso
      </h3>

      {hasAccount ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <UserCheck size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Cuenta vinculada
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 font-mono truncate">
                {socio.user_id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setUserId(socio.user_id ?? ''); setShowAsociar(true) }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              Cambiar cuenta
            </button>
            <button
              onClick={() => setShowDesasociar(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Unlink size={12} />
              Desasociar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UserX size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sin cuenta de acceso vinculada
            </p>
          </div>
          <div className="flex gap-2">
            {socio.email && (
              <button
                onClick={handleInvitar}
                disabled={sendingInvite}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white transition-colors flex items-center gap-1.5"
              >
                <Send size={12} />
                {sendingInvite ? 'Enviando…' : 'Enviar invitación'}
              </button>
            )}
            <button
              onClick={() => { setUserId(''); setShowAsociar(true) }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              Asociar cuenta existente
            </button>
          </div>
          {!socio.email && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Añade un email al socio para poder enviarle una invitación.
            </p>
          )}
        </div>
      )}

      {/* Modal asociar manualmente */}
      <Dialog
        open={showAsociar}
        onClose={() => setShowAsociar(false)}
        title={hasAccount ? 'Cambiar cuenta vinculada' : 'Asociar cuenta existente'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Introduce el ID del usuario de Appwrite. Puedes encontrarlo en{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Appwrite Console → Auth → Users
            </span>.
          </p>
          <FormField label="User ID de Appwrite" htmlFor="uid" required>
            <Input
              id="uid"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAsociar(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAsociar}
              disabled={!userId.trim() || saving}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Asociar'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Confirmar desasociar */}
      <ConfirmDialog
        open={showDesasociar}
        onClose={() => setShowDesasociar(false)}
        onConfirm={handleDesasociar}
        title="Desasociar cuenta"
        message="¿Seguro que quieres desvincular la cuenta de acceso de este socio? El usuario de Appwrite no se elimina."
        confirmLabel="Desasociar"
        danger
        loading={saving}
      />
    </div>
  )
}
