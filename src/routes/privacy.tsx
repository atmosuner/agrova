import { t } from '@lingui/macro'
import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-prose p-6 text-sm text-fg">
      <h1 className="text-2xl font-semibold text-fg">{t`Privacy & data`}</h1>
      <p className="mt-3 text-fg-secondary">
        {t`This page describes how Agrova processes personal and operational data. It is informational and does not replace legal advice (KVKK / GDPR).`}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-fg-secondary">
        <li>{t`Data is stored in Supabase (region: project settings, e.g. Seoul) — Postgres, Auth, and Storage.`}</li>
        <li>{t`Task, field, people, and issue data belong to your operation; access is enforced with Row Level Security.`}</li>
        <li>{t`You can export field-level chemical logs as CSV; a full data export is planned in settings.`}</li>
      </ul>
      <p className="mt-6">
        <Link to="/login" search={{ redirect: undefined }} className="text-orchard-600 underline">
          {t`Back to login`}
        </Link>
      </p>
    </div>
  )
}
