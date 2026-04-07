'use client'
import { useEffect, useState } from 'react'

export default function InstallButton() {
  const [prompt, setPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as Event & { prompt: () => void })
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed || !prompt) return null

  return (
    <button
      onClick={() => { prompt.prompt(); setPrompt(null) }}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm mb-4 active:scale-95 transition-transform"
    >
      📲 Instalar app en este celular
    </button>
  )
}
