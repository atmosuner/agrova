import { Button } from '@/components/ui/button'

export function App() {
  return (
    <main className="px-5 py-8 md:px-8">
      <h1 className="text-2xl font-semibold leading-tight tracking-tight text-orchard-500">
        Agrova
      </h1>
      <p className="mt-4 text-lg text-fg">M0-04 — shadcn/ui (Radix Nova) + Agrova token mapping.</p>
      <p className="mt-2 text-fg-secondary">
        Türkçe: Çiftlik · ş ç ğ ı İ ö ü ·{' '}
        <span className="tabular-nums text-fg">12.847</span>
      </p>
      <p className="mt-2 font-mono text-sm text-fg-muted">mono: 9f2b4c1d-0000-4000-8000-000000000000</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button">Primary (owner)</Button>
        <Button type="button" variant="outline">
          Secondary
        </Button>
      </div>
    </main>
  )
}
