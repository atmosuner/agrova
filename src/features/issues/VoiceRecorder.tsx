/* eslint-disable lingui/no-unlocalized-strings -- Web Media API literals and CVA variant tokens; user copy uses t */
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const MAX_MS = 60_000

export type VoiceAttachment = { blob: Blob; mime: string }

type Props = {
  value: VoiceAttachment | null
  onChange: (v: VoiceAttachment | null) => void
}

export function VoiceRecorder({ value, onChange }: Props) {
  const [supported] = useState(() => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [micErr, setMicErr] = useState<string | null>(null)
  const playbackUrl = useMemo(() => (value ? URL.createObjectURL(value.blob) : null), [value])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(0)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (playbackUrl) {
        URL.revokeObjectURL(playbackUrl)
      }
    }
  }, [playbackUrl])

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
      }
      stopTracks()
    }
  }, [stopTracks])

  if (!supported) {
    return <p className="text-sm text-fg-secondary">{t`Ses kaydı bu tarayıcıda desteklenmiyor.`}</p>
  }

  async function startRecording() {
    setMicErr(null)
    onChange(null)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = rec
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunksRef.current.push(ev.data)
        }
      }
      rec.onstop = () => {
        stopTracks()
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime })
        if (blob.size > 0) {
          onChange({ blob, mime: rec.mimeType || mime })
        }
        chunksRef.current = []
        mediaRecorderRef.current = null
        setRecording(false)
        if (tickRef.current) {
          clearInterval(tickRef.current)
          tickRef.current = null
        }
        setElapsedMs(0)
      }
      startRef.current = Date.now()
      setElapsedMs(0)
      setRecording(true)
      rec.start(200)
      tickRef.current = setInterval(() => {
        const e = Date.now() - startRef.current
        setElapsedMs(e)
        if (e >= MAX_MS) {
          rec.stop()
        }
      }, 250)
    } catch {
      setMicErr(t`Mikrofon izni gerekli. Ayarlardan izin verebilirsiniz.`)
      setRecording(false)
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function clearVoice() {
    onChange(null)
  }

  const sec = Math.min(60, Math.floor(elapsedMs / 1000))

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-3">
      <p className="text-sm font-medium text-fg">{t`Sesli not`}</p>
      <p className="mt-0.5 text-xs text-fg-muted">{t`En fazla 60 saniye.`}</p>
      {micErr ? <p className="mt-2 text-sm text-harvest-600">{micErr}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!recording ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => void startRecording()}>
            {t`Kayda başla`}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
            {t`Durdur`} ({sec}s)
          </Button>
        )}
        {value && !recording ? (
          <Button type="button" size="sm" variant="ghost" onClick={clearVoice}>
            {t`Sesi sil`}
          </Button>
        ) : null}
      </div>
      {playbackUrl ? (
        <audio src={playbackUrl} controls className="mt-3 w-full" />
      ) : null}
    </div>
  )
}
