import * as React from 'react'
import { Button } from '@/components/ui/button'
import { type ButtonVariantProps } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type Props = React.ComponentProps<typeof Button> & ButtonVariantProps

/** Primary bottom CTA: 72px, pill, haptic (10ms) on tap. */
export function WorkerButton({ onClick, className, size = 'worker', ...props }: Props) {
  return (
    <Button
      type="button"
      size={size}
      className={cn('focus-visible:ring-2 focus-visible:ring-orchard-500/40', className)}
      onClick={(e) => {
        if (typeof navigator.vibrate === 'function') {
          void navigator.vibrate(10)
        }
        onClick?.(e)
      }}
      {...props}
    />
  )
}
