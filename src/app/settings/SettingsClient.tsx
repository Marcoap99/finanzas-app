'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fmt, monthLabel, periodLabel, MONTHS } from '@/lib/format'
import type { MonthlyBudget, Category, FixedExpenseTemplate } from '@/lib/types'

interface HistoryMonth extends MonthlyBudget {
  totalFixed: number
  totalVariable: number
  expenses: { amount: unknown; description: string; expense_type: string; expense_date: string }[]
}

interface Props {
  budget: MonthlyBudget
  categories: Category[]
  templates: FixedExpenseTemplate[]
  history: HistoryMonth[]
  currentFixed: number
  currentVariable: number
  currentExpenses: unknown[]
  userEmail: string
  payday: number
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function exportCSV(
  label: string,
  income: number,
  fixed: number,
  variable: number,
  expenses: { amount: unknown; description: string; expense_type: string; expense_date: string }[]
) {
  const rows = [
    ['RESUMEN', ''],
    ['Ingreso', income],
    ['Gastos Fijos', fixed],
    ['Gastos Variables', variable],
    ['Saldo Final', income - fixed - variable],
    [''],
    ['DETALLE VARIABLES'],
    ['Fecha', 'Descripción', 'Tipo', 'Monto'],
    ...expenses.map(e => [
      e.expense_date,
      e.description,
      e.expense_type === 'necessary' ? 'Necesario' : 'No esencial',
      e.amount,
    ]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `finanzas_${label.replace(' ', '_')}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function HistoryCard({ month }: { month: HistoryMonth }) {
  const [open, setOpen] = useState(false)
  const income  = Number(month.monthly_income)
  const balance = income - month.totalFixed - month.totalVariable
  const savPct  = income > 0 ? Math.round((balance / income) * 100) : 0
  const isGood  = balance >= 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full px-4 py-4 flex items-center justify-between" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGood ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span className="text-xl">{isGood ? '💚' : '🔴'}</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">{monthLabel(month.month, month.year)}</p>
            <p className={`text-xs font-semibold mt-0.5 ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
              {isGood ? `Ahorrado: ${fmt(balance)}` : `Déficit: ${fmt(Math.abs(balance))}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {savPct > 0 ? '+' : ''}{savPct}%
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="grid grid-cols-3 gap-2 py-3 text-center">
            {[['Ingreso', fmt(income)], ['Fijos', fmt(month.totalFixed)], ['Variables', fmt(month.totalVariable)]].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-bold text-gray-700 text-sm">{val}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => exportCSV(monthLabel(month.month, month.year), income, month.totalFixed, month.totalVariable, month.expenses)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm border border-indigo-100 active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar {MONTHS[month.month - 1]} (.csv)
          </button>
        </div>
      )}
    </div>
  )
}

export default function SettingsClient({ budget, categories, templates, history, currentFixed, currentVariable, currentExpenses, userEmail, payday }: Props) {
  const [incomeVal, setIncomeVal]   = useState(String(budget.monthly_income || ''))
  const [paydayVal, setPaydayVal]   = useState(String(payday))
  const [newCat, setNewCat]         = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const savePayday = async () => {
    const val = parseInt(paydayVal)
    if (!isNaN(val) && val >= 1 && val <= 28) {
      await supabase.from('user_profiles').upsert({ user_id: budget.user_id, payday: val })
      router.refresh()
    }
  }

  const saveIncome = async () => {
    const val = parseFloat(incomeVal)
    if (!isNaN(val) && val >= 0) {
      await supabase.from('monthly_budgets').update({ monthly_income: val }).eq('id', budget.id)
      router.refresh()
    }
  }

  const toggleCategory = async (id: string, current: boolean) => {
    await supabase.from('categories').update({ is_active: !current }).eq('id', id)
    router.refresh()
  }

  const toggleTemplate = async (id: string, current: boolean) => {
    await supabase.from('fixed_expense_templates').update({ is_active: !current }).eq('id', id)
    router.refresh()
  }

  const addCategory = async () => {
    if (!newCat.trim()) return
    await supabase.from('categories').insert({ name: newCat.trim(), scope: 'variable', user_id: budget.user_id })
    setNewCat(''); setShowNewCat(false)
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const balance = Number(budget.monthly_income) - currentFixed - currentVariable

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <span>{icon}</span>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  )

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Configuración</h1>

      {/* Ingreso mensual */}
      <Section title={`Período actual — ${periodLabel(budget.month, budget.year, payday)}`} icon="📅">
        <div className="px-4 pb-4 space-y-4">
          <div>
            <label className="text-sm text-gray-500">Ingreso mensual</label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 flex items-center border-2 border-gray-200 rounded-xl px-3 focus-within:border-indigo-400 bg-gray-50">
                <span className="text-gray-400 text-sm font-bold mr-1">S/</span>
                <input type="text" inputMode="decimal" value={incomeVal}
                  onChange={e => setIncomeVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  onFocus={e => e.target.select()}
                  onBlur={saveIncome}
                  onKeyDown={e => e.key === 'Enter' && saveIncome()}
                  placeholder="0"
                  className="flex-1 py-3 px-1 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
              </div>
              <button onClick={saveIncome} className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">
                Guardar
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Día de pago</label>
            <p className="text-xs text-gray-400 mb-2">El período empieza este día cada mes (ej: 25 si te pagan el 25)</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border-2 border-gray-200 rounded-xl px-3 focus-within:border-indigo-400 bg-gray-50">
                <input type="text" inputMode="numeric" value={paydayVal}
                  onChange={e => setPaydayVal(e.target.value.replace(/[^0-9]/g, ''))}
                  onFocus={e => e.target.select()}
                  onBlur={savePayday}
                  onKeyDown={e => e.key === 'Enter' && savePayday()}
                  placeholder="1"
                  className="flex-1 py-3 px-1 text-gray-800 font-bold text-lg focus:outline-none bg-transparent" />
                <span className="text-gray-400 text-sm">de cada mes</span>
              </div>
              <button onClick={savePayday} className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Exportar mes actual */}
      {Number(budget.monthly_income) > 0 && (
        <button
          onClick={() => exportCSV(periodLabel(budget.month, budget.year, payday), Number(budget.monthly_income), currentFixed, currentVariable, currentExpenses as never)}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-100 mb-4 active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar {periodLabel(budget.month, budget.year, payday)} (.csv)
        </button>
      )}

      {/* Historial */}
      <Section title="Historial de meses" icon="📊">
        {history.length === 0 ? (
          <div className="px-4 pb-5 text-center">
            <p className="text-3xl mb-2 mt-1">🗓️</p>
            <p className="text-sm font-semibold text-gray-600">{periodLabel(budget.month, budget.year, payday)} es el primer período</p>
            <p className="text-xs text-gray-400 mt-1">Los meses siguientes aparecerán aquí con resumen y exportación.</p>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {history.map(m => <HistoryCard key={m.id} month={m} />)}
          </div>
        )}
      </Section>

      {/* Categorías */}
      <Section title="Categorías (variables)" icon="🏷">
        <div className="divide-y divide-gray-50">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <span className={`text-sm font-semibold ${cat.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{cat.name}</span>
              <Toggle checked={cat.is_active} onChange={() => toggleCategory(cat.id, cat.is_active)} />
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          {showNewCat ? (
            <div className="flex gap-2">
              <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="Nueva categoría..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              <button onClick={addCategory} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold">+</button>
              <button onClick={() => setShowNewCat(false)} className="px-3 text-gray-400 text-sm">✕</button>
            </div>
          ) : (
            <button onClick={() => setShowNewCat(true)}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-indigo-600 font-bold">
              + Agregar categoría
            </button>
          )}
        </div>
      </Section>

      {/* Templates */}
      <Section title="Gastos fijos recurrentes" icon="🔁">
        <div className="divide-y divide-gray-50">
          {templates.map(tpl => (
            <div key={tpl.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className={`text-sm font-semibold ${tpl.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{tpl.name}</span>
                <span className="text-xs text-gray-400 ml-2">día {tpl.due_day}</span>
              </div>
              <Toggle checked={tpl.is_active} onChange={() => toggleTemplate(tpl.id, tpl.is_active)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Cuenta */}
      <Section title="Cuenta" icon="👤">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 font-bold">{userEmail.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">{userEmail}</p>
        </div>
        <div className="px-4 pb-4">
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-400 rounded-xl text-sm font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </Section>
    </div>
  )
}
