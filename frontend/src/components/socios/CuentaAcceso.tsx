import { useState } from 'react'
import { ID } from 'appwrite'
import { Link, UserCheck, UserX, Send, Unlink } from 'lucide-react'
import { account } from '@/lib/appwrite'
import { useUpdateSocio } from '@/hooks/useSocios'
import { useToast } from '@/contexts/ToastContext'
import { Dialog } from '@/components/ui/Dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { Socio } from '@/types'

interface Props {
  socio: Socio
}

export function CuentaAcceso({ socio }: Props) {
  const toast = useToast()
  const updateMutation = useUpdateSocio()

  const [showAsociar, setShowAsociar] = useState(false)
  const [showDesasociar, setShowDesasociar] = useState(false)
  const [userId, setUserId] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  const hasAccount = !!socio.user_id

  async function handleInvitar() {
    if (!socio.email) {
      toast.error('El socio no tiene email registrado')
      return
    }
    setSendingInvite(true)
    try {
      const newUserId = ID.unique()
      const base = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')
      const redirectUrl = `${window.location.origin}${base}/#/`

      await account.createMagicURLToken(newUserId, socio.email, redirectUrl)
      await updateMutation.mutateAsync({ id: socio.$id, data: { user_id: newUserId } })
      toast.success(`Invitación enviada a ${socio.email}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(`Error al enviar invitación: ${msg}`)
    } finally {
      setSendingInvite(false)
    }
  }

  function handleAsociar() {
    if (!userId.trim()) return
    updateMutation.mutate(
      { id: socio.$id, data: { user_id: userId.trim() } },
      {
        onSuccess: () => { setShowAsociar(false); setUserId('') },
      },
    )
  }

  function handleDesasociar() {
    updateMutation.mutate(
      { id: socio.$id, data: { user_id: null } },
      { onSuccess: () => setShowDesasociar(false) },
    )
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
              disabled={!userId.trim() || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Guardando…' : 'Asociar'}
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
        loading={updateMutation.isPending}
      />
    </div>
  )
}
