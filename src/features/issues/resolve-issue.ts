/* eslint-disable lingui/no-unlocalized-strings -- PostgREST column names */
import { supabase } from '@/lib/supabase'

export async function resolveIssue(input: { issueId: string; resolverPersonId: string }): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('issues')
    .update({
      resolved_at: now,
      resolved_by: input.resolverPersonId,
    })
    .eq('id', input.issueId)
  if (error) {
    throw error
  }
}
