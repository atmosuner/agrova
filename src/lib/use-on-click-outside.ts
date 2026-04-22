/* eslint-disable lingui/no-unlocalized-strings -- DOM event type names */
import { useEffect, useRef, type RefObject } from 'react'

export function useOnClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void): void {
  const cb = useRef(onOutside)
  useEffect(() => {
    cb.current = onOutside
  }, [onOutside])
  useEffect(() => {
    function handler(ev: MouseEvent) {
      const el = ref.current
      if (!el) {
        return
      }
      if (el.contains(ev.target as Node)) {
        return
      }
      cb.current()
    }
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [ref])
}
