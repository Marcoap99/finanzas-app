'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fmt, periodLabel } from '@/lib/format'
import type { MonthlyBudget, MonthlyFixedExpense } from '@/lib/types'

interface Props {
  budget: MonthlyBudget
  fixedExpenses: MonthlyFixedExpense[]
  payday: number
}

interface EditState { id: string; name: string; amount: string; due_day: string }
interface NewState  { name: string; amount: string; due_day: string }

export default function FixedExpensesClient({ budget, fixedExpenses, payday }: Props) {
  const [editing, setEditing]     = useState<EditState | null>(null)
  const [showNew, setShowNew]     = useState(false)
  const [newExp, setNewExp]       = useState<NewState>({ name: '', amount: '', due_day: '1' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const totalFixed = fixedExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const paid       = fixedExpenses.filter(e => e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const pending    = totalFixed - paid

  const togglePaid = async (exp: MonthlyFixedExpense) => {
    const isPaid = !exp.is_paid
    await supabase.from('monthly_fixed_expenses')
      .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
      .eq('id', exp.id)
    router.refresh()
  }

  const saveEdit = async () => {
    if (!editing) return
    const amt = parseFloat(editing.amount)
    const day = parseInt(editing.due_day)
    if (isNaN(amt) || amt < 0) return
    await supabase.from('monthly_fixed_expenses')
      .update({ name: editing.name, amount: amt, due_day: isNaN(day) ? 1 : day })
      .eq('id', editing.id)
    setEditing(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('monthly_fixed_expenses').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const saveNew = async () => {
    if (!newExp.name.trim()) return
    const amt = parseFloat(newExp.amount)
    const day = parseInt(newExp.due_day) || 1
    await supabase.from('monthly_fixed_expenses').insert({
      monthly_budget_id: budget.id,
      user_id: budget.user_id,
      name: newExp.name.trim(),
      amount: isNaN(amt) ? 0 : amt,
      due_day: day,
      is_paid: false,
    })
    setNewExp({ name: '', amount: '', due_day: '1' })
    setShowNew(false)
    router.refresh()
  }

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Gastos Fijos</h1>
      <p className="text-sm text-gray-400 mb-4">{periodLabel(budget.month, budget.year, payday)}</p>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex justify-around">
          {[
            ['Total',      fmt(totalFixed), 'text-gray-800',    'bg-gray-100 text-gray-500'],
            ['Pagados',    fmt(paid),       'text-emerald-700', 'bg-emerald-50 text-emerald-600'],
            ['Pendientes', fmt(pending),    'text-amber-700',   'bg-amber-50 text-amber-600'],
          ].map(([label, val, valColor, tagColor]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tagColor}`}>{label}</span>
              <span className={`text-sm font-bold ${valColor}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {fixedExpenses.map(exp => (
          <div key={exp.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {deletingId === exp.id ? (
              <div className="flex items-center justify-between px-4 py-4 bg-red-50">
                <p className="text-sm text-red-600 font-semibold">¿Eliminar?</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeletingId(null)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold">Cancelar</button>
                  <button onClick={() => handleDelete(exp.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white font-semibold">Eliminar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button
                  onClick={() => togglePaid(exp)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${exp.is_paid ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                  {exp.is_paid && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm ${exp.is_paid ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{exp.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${exp.is_paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {exp.is_paid ? 'Pagado' : `Día ${exp.due_day}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`font-bold text-sm ${Number(exp.amount) === 0 ? 'text-gray-300' : 'text-gray-700'}`}>
                      {Number(exp.amount) === 0 ? 'S/ —' : fmt(Number(exp.amount))}
                    </p>
                    <button onClick={async () => {
                      const next = (exp.payment_method ?? 'cash') === 'cash' ? 'card' : 'cash'
                      await supabase.from('monthly_fixed_expenses').update({ payment_method: next }).eq('id', exp.id)
                      router.refresh()
                    }} className={`text-xs px-2 py-0.5 rounded-full border transition-all ${(exp.payment_method ?? 'cash') === 'card' ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                      {(exp.payment_method ?? 'cash') === 'card' ? '💳 Tarjeta' : '💵 Efectivo'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => setEditing({ id: exp.id, name: exp.name, amount: String(exp.amount), due_day: String(exp.due_day) })}
                    className="w-7 h-7 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => setDeletingId(exp.id)} className="w-7 h-7 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      <button onClick={() => setShowNew(true)}
        className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-indigo-600 font-bold">
        + Agregar gasto fijo
      </button>

      {/* Modal edición */}
      {editing && (
        <div className="fixed bg-black/50 z-50 flex items-end justify-center"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="w-full bg-white rounded-t-3xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Editar gasto fijo</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <input type="text" value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                placeholder="Nombre"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-300 bg-gray-50" />
              <div className="flex gap-3">
                <div className="flex-1 flex items-center border-2 border-gray-100 rounded-2xl px-3 bg-gray-50 focus-within:border-indigo-300">
                  <span className="text-gray-400 text-sm font-bold mr-1">S/</span>
                  <input autoFocus type="number" inputMode="decimal" value={editing.amount}
                    onChange={e => setEditing({ ...editing, amount: e.target.value })}
                    placeholder="0"
                    className="flex-1 py-3 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
                </div>
                <div className="flex items-center border-2 border-gray-100 rounded-2xl px-3 bg-gray-50 focus-within:border-indigo-300 w-28">
                  <span className="text-gray-400 text-xs mr-1">Día</span>
                  <input type="number" inputMode="numeric" value={editing.due_day}
                    onChange={e => setEditing({ ...editing, due_day: e.target.value })}
                    className="flex-1 py-3 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
                </div>
              </div>
              <button onClick={saveEdit}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform">
                Guardar cambios
              </button>
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo */}
      {showNew && (
        <div className="fixed bg-black/50 z-50 flex items-end justify-center"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="w-full bg-white rounded-t-3xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nuevo gasto fijo</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <input autoFocus type="text" value={newExp.name}
                onChange={e => setNewExp({ ...newExp, name: e.target.value })}
                placeholder="Nombre (ej: Gym, Netflix...)"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-300 bg-gray-50" />
              <div className="flex gap-3">
                <div className="flex-1 flex items-center border-2 border-gray-100 rounded-2xl px-3 bg-gray-50 focus-within:border-indigo-300">
                  <span className="text-gray-400 text-sm font-bold mr-1">S/</span>
                  <input type="number" inputMode="decimal" value={newExp.amount}
                    onChange={e => setNewExp({ ...newExp, amount: e.target.value })}
                    placeholder="0"
                    className="flex-1 py-3 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
                </div>
                <div className="flex items-center border-2 border-gray-100 rounded-2xl px-3 bg-gray-50 focus-within:border-indigo-300 w-28">
                  <span className="text-gray-400 text-xs mr-1">Día</span>
                  <input type="number" inputMode="numeric" value={newExp.due_day}
                    onChange={e => setNewExp({ ...newExp, due_day: e.target.value })}
                    className="flex-1 py-3 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
                </div>
              </div>
              <button onClick={saveNew} disabled={!newExp.name.trim()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 active:scale-95 transition-transform">
                Agregar
              </button>
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
