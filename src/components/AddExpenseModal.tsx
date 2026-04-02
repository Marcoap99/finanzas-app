'use client'

import { useState, useRef, useEffect } from 'react'
import type { Category, NewVariableExpense } from '@/lib/types'

interface Props {
  categories: Category[]
  onClose: () => void
  onSave: (data: NewVariableExpense) => Promise<void>
}

export default function AddExpenseModal({ categories, onClose, onSave }: Props) {
  const [amount, setAmount]   = useState('')
  const [desc, setDesc]       = useState('')
  const [type, setType]       = useState<'necessary' | 'non_essential'>('necessary')
  const [catId, setCatId]     = useState<string | null>(categories[0]?.id ?? null)
  const [payment, setPayment] = useState<'cash' | 'card'>('cash')
  const [date, setDate]       = useState(() => new Date().toISOString().split('T')[0])
  const [saving, setSaving]   = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120) }, [])

  const activeCats = categories.filter(c => c.is_active && c.scope === 'variable')

  const handleSave = async () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    await onSave({
      amount: num,
      description: desc.trim() || 'Sin descripción',
      expense_type: type,
      category_id: catId,
      payment_method: payment,
      expense_date: date,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full bg-white rounded-t-3xl max-h-[94vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Registrar gasto</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Monto */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monto</label>
            <div className="flex items-center mt-2 rounded-2xl px-4 bg-indigo-50 border-2 border-indigo-200 focus-within:border-indigo-500">
              <span className="text-xl font-bold text-indigo-400 mr-1 select-none">S/</span>
              <input
                ref={inputRef}
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                inputMode="decimal"
                className="flex-1 text-4xl font-bold text-gray-900 bg-transparent focus:outline-none py-3"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿En qué?</label>
            <input
              type="text"
              placeholder="Ej: supermercado, taxi, café..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full mt-2 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-300 bg-gray-50"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</label>
            <div className="flex mt-2 bg-gray-100 rounded-2xl p-1">
              {([['necessary', '✅ Necesario'], ['non_essential', '🎯 No esencial']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setType(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === val ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
            <div className="flex gap-2 overflow-x-auto pb-1 mt-2" style={{ scrollbarWidth: 'none' }}>
              {activeCats.map(c => (
                <button key={c.id} onClick={() => setCatId(c.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${catId === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Medio de pago */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Medio de pago</label>
            <div className="flex gap-3 mt-2">
              {([['cash', '💵', 'Efectivo'], ['card', '💳', 'Tarjeta']] as const).map(([val, emoji, label]) => (
                <button key={val} onClick={() => setPayment(val)}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 flex flex-col items-center gap-1 transition-all ${payment === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 bg-white'}`}>
                  <span className="text-xl">{emoji}</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-2 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-300 bg-gray-50" />
          </div>

          <button onClick={handleSave} disabled={!amount || parseFloat(amount) <= 0 || saving}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 active:scale-95 transition-transform shadow-lg shadow-indigo-200">
            {saving ? 'Guardando...' : 'Guardar gasto'}
          </button>
          {/* Espacio para que el botón no quede tapado por la nav bar */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
