'use client'

interface FABProps {
  onClick: () => void
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Registrar gasto"
      className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-300 flex items-center justify-center active:scale-90 transition-transform"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  )
}
