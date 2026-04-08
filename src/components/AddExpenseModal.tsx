'use client'

import { useState, useRef, useEffect } from 'react'
import { catEmoji } from '@/lib/format'
import type { Category, NewVariableExpense } from '@/lib/types'

interface Props {
  categories: Category[]
  onClose: () => void
  onSave: (data: NewVariableExpense) => Promise<void>
}

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function AddExpenseModal({ categories, onClose, onSave }: Props) {
  const [amount, setAmount]     = useState('')
  const [desc, setDesc]         = useState('')
  const [type, setType]         = useState<'necessary' | 'non_essential'>('necessary')
  const [catId, setCatId]       = useState<string | null>(categories[0]?.id ?? null)
  const [payment, setPayment]   = useState<'cash' | 'card'>('cash')
  const [date, setDate]         = useState(localToday)
  const [saving, setSaving]     = useState(false)
  const [showCats, setShowCats] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const activeCats = categories.filter(c => c.is_active && c.scope === 'variable')
  const selectedCat = activeCats.find(c => c.id === catId)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    setTimeout(() => inputRef.current?.focus(), 120)
    return () => { document.body.style.overflow = '' }
  }, [])

  const buildExpense = () => ({
    amount: parseFloat(amount),
    description: desc.trim() || 'Sin descripción',
    expense_type: type,
    category_id: catId,
    payment_method: payment,
    expense_date: date,
  })

  const handleSave = async () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    await onSave(buildExpense())
    setSaving(false)
    onClose()
  }

  const handleSaveAndAnother = async () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    await onSave(buildExpense())
    setSaving(false)
    setAmount('')
    setDesc('')
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed bg-black/50 z-50 flex items-end justify-center"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full bg-white rounded-t-3xl max-h-[94vh] overflow-y-auto overflow-x-hidden animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 pt-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Registrar gasto</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Monto */}
          <div className="flex items-center rounded-2xl px-4 bg-indigo-50 border-2 border-indigo-200 focus-within:border-indigo-500">
            <span className="text-xl font-bold text-indigo-400 mr-1 select-none">S/</span>
            <input ref={inputRef} type="number" placeholder="0.00" value={amount}
              onChange={e => setAmount(e.target.value)} inputMode="decimal"
              className="flex-1 text-4xl font-bold text-gray-900 bg-transparent focus:outline-none py-3" />
          </div>

          {/* Descripción */}
          <input type="text" placeholder="¿En qué? Ej: supermercado, taxi..."
            value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-300 bg-gray-50" />

          {/* Tipo */}
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {([['necessary', '✅ Necesario'], ['non_essential', '🎯 No esencial']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setType(val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === val ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Categoría — dropdown */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
            <button onClick={() => setShowCats(!showCats)}
              className="w-full mt-2 flex items-center justify-between px-4 py-3 border-2 border-gray-100 rounded-2xl bg-gray-50">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-lg">{catEmoji(selectedCat?.name)}</span>
                {selectedCat?.name ?? 'Seleccionar'}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"
                className={`transition-transform flex-shrink-0 ${showCats ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showCats && (
              <div className="mt-1 border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
                {activeCats.map(c => (
                  <button key={c.id} onClick={() => { setCatId(c.id); setShowCats(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold border-b border-gray-50 last:border-0 text-left ${catId === c.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}>
                    <span className="text-base">{catEmoji(c.name)}</span>
                    {c.name}
                    {catId === c.id && <span className="ml-auto text-indigo-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Medio de pago */}
          <div className="flex gap-3">
            {([['cash', '💵', 'Efectivo'], ['card', '💳', 'Tarjeta']] as const).map(([val, emoji, label]) => (
              <button key={val} onClick={() => setPayment(val)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 flex items-center justify-center gap-2 transition-all ${payment === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 bg-white'}`}>
                <span className="text-lg">{emoji}</span>{label}
              </button>
            ))}
          </div>

          {/* Fecha */}
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-300 bg-gray-50" />

          <div className="flex gap-2">
            <button onClick={handleSaveAndAnother} disabled={!amount || parseFloat(amount) <= 0 || saving}
              className="flex-1 bg-indigo-100 text-indigo-700 py-4 rounded-2xl font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform">
              {saving ? '...' : '+ Otro'}
            </button>
            <button onClick={handleSave} disabled={!amount || parseFloat(amount) <= 0 || saving}
              className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 active:scale-95 transition-transform shadow-lg shadow-indigo-200">
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
