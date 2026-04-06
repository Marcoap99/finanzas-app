'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddExpenseModal from '@/components/AddExpenseModal'
import FAB from '@/components/FAB'
import { fmt, periodLabel, relativeDate, catEmoji } from '@/lib/format'
import type { MonthlyBudget, VariableExpense, Category, NewVariableExpense } from '@/lib/types'

interface Props {
  budget: MonthlyBudget
  variableExpenses: VariableExpense[]
  categories: Category[]
  payday: number
}

interface EditState {
  id: string
  amount: string
  description: string
  expense_type: 'necessary' | 'non_essential'
  category_id: string | null
  payment_method: 'cash' | 'card'
  expense_date: string
}

export default function VariableExpensesClient({ budget, variableExpenses, categories, payday }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editing, setEditing]       = useState<EditState | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const total = variableExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const activeCats = categories.filter(c => c.is_active && c.scope === 'variable')

  const handleSave = async (data: NewVariableExpense) => {
    await supabase.from('variable_expenses').insert({
      ...data,
      monthly_budget_id: budget.id,
      user_id: budget.user_id,
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('variable_expenses').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const startEdit = (exp: VariableExpense) => {
    setEditing({
      id: exp.id,
      amount: String(exp.amount),
      description: exp.description,
      expense_type: exp.expense_type,
      category_id: exp.category_id,
      payment_method: exp.payment_method,
      expense_date: exp.expense_date,
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    const amt = parseFloat(editing.amount)
    if (isNaN(amt) || amt <= 0) return
    await supabase.from('variable_expenses').update({
      amount: amt,
      description: editing.description,
      expense_type: editing.expense_type,
      category_id: editing.category_id,
      payment_method: editing.payment_method,
      expense_date: editing.expense_date,
    }).eq('id', editing.id)
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">Gastos Variables</h1>
        {total > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-bold text-orange-500">{fmt(total)}</p>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4">{periodLabel(budget.month, budget.year, payday)}</p>

      {variableExpenses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold text-gray-600">Sin gastos variables aún</p>
          <p className="text-sm text-gray-400 mt-1">Toca el + para registrar tu primer gasto</p>
        </div>
      ) : (
        <div className="space-y-2">
          {variableExpenses.map(exp => (
            <div key={exp.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {deletingId === exp.id ? (
                <div className="flex items-center justify-between px-4 py-4 bg-red-50">
                  <p className="text-sm text-red-600 font-semibold">¿Eliminar?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold">
                      Cancelar
                    </button>
                    <button onClick={() => handleDelete(exp.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white font-semibold">
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl ${exp.expense_type === 'necessary' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                    {catEmoji(exp.category?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{exp.description}</p>
                      <p className="font-bold text-gray-900 ml-2 flex-shrink-0">{fmt(Number(exp.amount))}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${exp.expense_type === 'necessary' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {exp.expense_type === 'necessary' ? 'Necesario' : 'No esencial'}
                      </span>
                      <span className="text-xs text-gray-400">{exp.category?.name ?? '—'}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs">{exp.payment_method === 'cash' ? '💵' : '💳'}</span>
                      <span className="text-xs text-gray-400 ml-auto">{relativeDate(exp.expense_date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(exp)} className="w-7 h-7 flex items-center justify-center">
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
      )}

      <FAB onClick={() => setShowModal(true)} />

      {showModal && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Modal edición */}
      {editing && (
        <div className="fixed bg-black/50 z-50 flex items-end justify-center"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="w-full bg-white rounded-t-3xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Editar gasto</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Monto */}
              <div className="flex items-center rounded-2xl px-4 bg-indigo-50 border-2 border-indigo-200 focus-within:border-indigo-500">
                <span className="text-xl font-bold text-indigo-400 mr-1">S/</span>
                <input autoFocus type="number" inputMode="decimal" value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: e.target.value })}
                  className="flex-1 text-3xl font-bold text-gray-900 bg-transparent focus:outline-none py-3" />
              </div>
              {/* Descripción */}
              <input type="text" value={editing.description}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-300 bg-gray-50" />
              {/* Tipo */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                {([['necessary', '✅ Necesario'], ['non_essential', '🎯 No esencial']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setEditing({ ...editing, expense_type: val })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${editing.expense_type === val ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Categoría */}
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {activeCats.map(c => (
                  <button key={c.id} onClick={() => setEditing({ ...editing, category_id: c.id })}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${editing.category_id === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
              {/* Pago + fecha */}
              <div className="flex gap-3">
                <div className="flex bg-gray-100 rounded-2xl p-1 flex-1">
                  {([['cash', '💵'], ['card', '💳']] as const).map(([val, emoji]) => (
                    <button key={val} onClick={() => setEditing({ ...editing, payment_method: val })}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${editing.payment_method === val ? 'bg-white shadow-sm' : 'text-gray-400'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <input type="date" value={editing.expense_date}
                  onChange={e => setEditing({ ...editing, expense_date: e.target.value })}
                  className="flex-1 border-2 border-gray-100 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-300 bg-gray-50" />
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
    </div>
  )
}
