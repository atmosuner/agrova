/* eslint-disable lingui/no-unlocalized-strings -- query keys, PostgREST */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { supabase } from '@/lib/supabase'
import { notifyDebug } from '@/lib/notify-debug'

export const notificationsInboxKey = (recipientId: string | undefined) => ['notifications-inbox', recipientId] as const

export type InboxRow = {
  id: string
  read_at: string | null
  created_at: string
  activity_log: {
    id: string
    action: string
    subject_type: string
    subject_id: string
    created_at: string
    actor: { full_name: string } | null
  } | null
}

export function useNotificationsInbox() {
  const qc = useQueryClient()
  const { data: me, isSuccess: haveMe } = useMyPersonQuery()
  const recipientId = me?.id

  const list = useQuery({
    queryKey: notificationsInboxKey(recipientId),
    enabled: Boolean(recipientId) && haveMe,
    queryFn: async () => {
      if (!recipientId) {
        throw new Error('no recipient')
      }
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, read_at, created_at, activity_log ( id, action, subject_type, subject_id, created_at, actor:people!activity_log_actor_id_fkey ( full_name ) )',
        )
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        notifyDebug('notifications inbox query error', { message: error.message, code: error.code })
        throw error
      }
      notifyDebug('notifications inbox query ok', { count: (data ?? []).length, recipientId })
      return (data ?? []) as InboxRow[]
    },
  })

  useEffect(() => {
    if (!recipientId) {
      return
    }
    const ch = supabase
      .channel(`inbox-notify-${recipientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${recipientId}` },
        (payload) => {
          notifyDebug('notifications INSERT realtime', { eventType: payload.eventType, recipientId })
          void qc.invalidateQueries({ queryKey: notificationsInboxKey(recipientId) })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${recipientId}` },
        (payload) => {
          notifyDebug('notifications UPDATE realtime', { eventType: payload.eventType, recipientId })
          void qc.invalidateQueries({ queryKey: notificationsInboxKey(recipientId) })
        },
      )
      .subscribe((status, err) => {
        notifyDebug('notifications channel subscribe', { status, err: err?.message, recipientId })
      })
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [recipientId, qc])

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!recipientId) {
        return
      }
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient_id', recipientId)
        .is('read_at', null)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      if (recipientId) {
        void qc.invalidateQueries({ queryKey: notificationsInboxKey(recipientId) })
      }
    },
  })

  const unread = (list.data ?? []).filter((r) => !r.read_at).length

  return { ...list, unread, markAllRead, recipientId }
}
