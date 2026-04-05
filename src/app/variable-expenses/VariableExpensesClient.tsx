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

export default function VariableExpensesClient({ budget, variableExpenses, categories, payday }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const total = variableExpenses.reduce((s, e) => s + Number(e.amount), 0)

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

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">Gastos Variables</h1>
        {total > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Total mes</p>
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
                  <p className="text-sm text-red-600 font-semibold">¿Eliminar este gasto?</p>
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
                  <button onClick={() => setDeletingId(exp.id)} className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
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
    </div>
  )
}
