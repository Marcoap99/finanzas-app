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

export default function FixedExpensesClient({ budget, fixedExpenses, payday }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const totalFixed = fixedExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const paid       = fixedExpenses.filter(e => e.is_paid).reduce((s, e) => s + Number(e.amount), 0)
  const pending    = totalFixed - paid

  const togglePaid = async (expense: MonthlyFixedExpense) => {
    const isPaid = !expense.is_paid
    await supabase
      .from('monthly_fixed_expenses')
      .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
      .eq('id', expense.id)
    router.refresh()
  }

  const startEdit = (expense: MonthlyFixedExpense) => {
    setEditingId(expense.id)
    setEditValue(String(expense.amount))
  }

  const saveEdit = async (id: string) => {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val >= 0) {
      await supabase.from('monthly_fixed_expenses').update({ amount: val }).eq('id', id)
      router.refresh()
    }
    setEditingId(null)
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Gastos Fijos</h1>
      <p className="text-sm text-gray-400 mb-4">{periodLabel(budget.month, budget.year, payday)}</p>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex justify-around">
          {[
            ['Total',      fmt(totalFixed), 'text-gray-800', 'bg-gray-100 text-gray-500'],
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
      <div className="space-y-2 pb-6">
        {fixedExpenses.map(exp => (
          <div key={exp.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Toggle pagado */}
              <button
                onClick={() => togglePaid(exp)}
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${exp.is_paid ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}
              >
                {exp.is_paid && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-semibold text-sm ${exp.is_paid ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {exp.name}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${exp.is_paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {exp.is_paid ? 'Pagado' : `Día ${exp.due_day}`}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{exp.category?.name ?? '—'}</p>
              </div>

              {/* Monto editable */}
              <div className="flex-shrink-0 text-right">
                {editingId === exp.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-xs">S/</span>
                    <input
                      autoFocus
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(exp.id)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(exp.id)}
                      className="w-20 text-right font-bold text-gray-800 border-b-2 border-indigo-500 focus:outline-none text-sm bg-transparent"
                    />
                  </div>
                ) : (
                  <button onClick={() => startEdit(exp)}>
                    <p className={`font-bold text-sm ${Number(exp.amount) === 0 ? 'text-gray-300' : 'text-gray-800'}`}>
                      {Number(exp.amount) === 0 ? 'S/ —' : fmt(Number(exp.amount))}
                    </p>
                    <p className="text-xs text-indigo-400">editar</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
