/**
 * Public schema type until `src/types/db.ts` is generated (M0-16).
 * Empty `Tables` / `Views` / … makes `supabase.from('…')` a type error for unknown
 * relations — keeps queries honest before generated types land.
 */
export type AppDatabase = {
  public: {
    Tables: Record<never, never>
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
