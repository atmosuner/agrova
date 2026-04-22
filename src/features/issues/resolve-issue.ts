/* eslint-disable lingui/no-unlocalized-strings -- PostgREST column names */
import { invokeWebPushFanout } from '@/lib/invoke-web-push-fanout'
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
  const { data: al } = await supabase
    .from('activity_log')
    .select('id')
    .eq('subject_id', input.issueId)
    .eq('subject_type', 'issue')
    .eq('action', 'issue.resolved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (al?.id) {
    void invokeWebPushFanout(supabase, al.id)
  }
}
