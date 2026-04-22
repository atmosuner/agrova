/* eslint-disable lingui/no-unlocalized-strings -- type-only relation name, not UI */
import { supabase } from './supabase'

/**
 * Compile-time check: do not add `people` to `AppDatabase` before migrations + M0-16
 * — this import must keep reporting a type error.
 */
// @ts-expect-error — Table "people" is not in the empty stub schema; remove this file in M0-16
void supabase.from('people')
