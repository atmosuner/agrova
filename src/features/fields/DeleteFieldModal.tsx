import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  fieldName: string
  saving: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteFieldModal({ open, fieldName, saving, onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      setTyped('')
      el.showModal()
      inputRef.current?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  const matches = typed.trim() === fieldName.trim()

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-w-[400px] rounded-2xl border border-border bg-surface-0 p-6 backdrop:bg-[rgba(12,18,16,0.55)]"
      onClose={onClose}
      aria-labelledby="delete-field-heading"
      aria-modal="true"
    >
      <div className="flex items-start justify-between">
        <h2 id="delete-field-heading" className="text-[16px] font-semibold text-fg">
          {t`Tarlayı sil`}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-1 hover:text-fg"
          aria-label={t`Kapat`}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-status-blocked/20 bg-status-blocked/5 p-3">
        <p className="text-[13px] text-fg">
          <span className="font-semibold">{fieldName}</span>{' '}
          {t`tarlası kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-[12px] font-medium text-fg-muted" id="delete-confirm-label">
          {t`Onaylamak için tarla adını yazın:`}
        </label>
        <code className="mt-1 block rounded bg-surface-1 px-2 py-1 text-[13px] font-medium text-fg">
          {fieldName}
        </code>
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-2 h-9 w-full rounded-lg border border-border bg-surface-0 px-3 text-[13px] text-fg outline-none transition focus:border-orchard-500 focus:ring-2 focus:ring-orchard-500/20"
          autoComplete="off"
          aria-describedby="delete-confirm-label"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-[34px] rounded-[7px] border border-border bg-surface-0 px-4 text-[13px] font-medium text-fg transition-colors hover:bg-surface-1"
        >
          {t`İptal`}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!matches || saving}
          aria-disabled={!matches}
          className="h-[34px] rounded-[7px] bg-status-blocked px-4 text-[13px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? t`Siliniyor…` : t`Sil`}
        </button>
      </div>
    </dialog>
  )
}
