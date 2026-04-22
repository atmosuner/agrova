import {
  Bug,
  CloudLightning,
  Droplets,
  Package,
  ShieldAlert,
  Siren,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { IssueCategory } from '@/features/issues/categories'
import { cn } from '@/lib/utils'

const ICONS: Record<IssueCategory, LucideIcon> = {
  PEST: Bug,
  EQUIPMENT: Wrench,
  INJURY: Siren,
  IRRIGATION: Droplets,
  WEATHER: CloudLightning,
  THEFT: ShieldAlert,
  SUPPLY: Package,
}

type Props = {
  category: IssueCategory
  className?: string
}

export function IssueCategoryIcon({ category, className }: Props) {
  const Icon = ICONS[category]
  return <Icon className={cn('shrink-0', className)} aria-hidden />
}
