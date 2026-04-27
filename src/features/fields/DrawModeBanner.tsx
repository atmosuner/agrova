import { t } from '@lingui/macro'

type Props = {
  visible: boolean
  onCancel: () => void
}

export function DrawModeBanner({ visible, onCancel }: Props) {
  if (!visible) return null

  return (
    <div
      className="flex items-center justify-between bg-orchard-500 px-4 py-2 text-[13px] font-medium text-white"
      role="status"
      aria-live="polite"
    >
      <span>{t`Haritada tarla sınırını çizin. Son noktaya tıklayarak kapatın.`}</span>
      <button
        type="button"
        onClick={onCancel}
        className="ml-4 shrink-0 rounded-[7px] border border-white/30 px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-white/10"
      >
        {t`İptal`}
      </button>
    </div>
  )
}
