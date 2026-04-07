'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddExpenseModal from '@/components/AddExpenseModal'
import FAB from '@/components/FAB'
import InstallButton from '@/components/InstallButton'
import ProgressBar from '@/components/ProgressBar'
import { fmt, periodLabel, relativeDate, catEmoji } from '@/lib/format'
import type { MonthlyBudget, MonthlyFixedExpense, VariableExpense, Category, NewVariableExpense } from '@/lib/types'

interface Props {
  budget: MonthlyBudget
  fixedExpenses: MonthlyFixedExpense[]
  variableExpenses: VariableExpense[]
  categories: Category[]
  userName: string
  payday: number
}

export default function DashboardClient({ budget, fixedExpenses, variableExpenses, categories, userName, payday }: Props) {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalFixed    = fixedExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalVariable = variableExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const income        = Number(budget.monthly_income)
  const balance       = income - totalFixed - totalVariable

  // Calcular período según payday
  // Si payday=1 → período = mes calendario. Si payday>1 → período empieza el día payday del mes anterior.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const periodEnd   = payday === 1
    ? new Date(budget.year, budget.month, 1)           // 1° del mes siguiente
    : new Date(budget.year, budget.month - 1, payday)  // día payday del mes actual

  const periodStart = payday === 1
    ? new Date(budget.year, budget.month - 1, 1)       // 1° del mes actual
    : new Date(budget.year, budget.month - 2, payday)  // día payday del mes anterior (JS maneja meses negativos)

  const totalDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000)
  const daysLeft  = Math.max(0, Math.round((periodEnd.getTime() - today.getTime()) / 86400000))
  const pctPeriod = totalDays > 0 ? Math.round(((totalDays - daysLeft) / totalDays) * 100) : 0
  const pctSpent  = income > 0 ? Math.round(((totalFixed + totalVariable) / income) * 100) : 0
  const dailyBudget  = balance > 0 && daysLeft > 0 ? Math.floor(balance / daysLeft) : 0
  const todayStr     = today.toISOString().split('T')[0]
  const todaySpent   = variableExpenses.filter(e => e.expense_date === todayStr).reduce((s, e) => s + Number(e.amount), 0)
  const todayOver    = dailyBudget > 0 && todaySpent > dailyBudget

  // Top categorías
  const catMap: Record<string, number> = {}
  variableExpenses.forEach(e => {
    const name = e.category?.name ?? 'Otros'
    catMap[name] = (catMap[name] ?? 0) + Number(e.amount)
  })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const recentExpenses = variableExpenses.slice(0, 3)
  const firstName = userName.split(' ')[0]

  const handleSaveExpense = async (data: NewVariableExpense) => {
    await supabase.from('variable_expenses').insert({
      ...data,
      monthly_budget_id: budget.id,
      user_id: budget.user_id,
    })
    router.refresh()
  }

  return (
    <div className="px-4 pt-5 space-y-4">
      <InstallButton />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Hola, {firstName} 👋</p>
          <h1 className="text-xl font-bold text-gray-900">{periodLabel(budget.month, budget.year, payday)}</h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-700 font-bold text-sm">{firstName.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      {/* Saldo + breakdown */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className={`px-5 pt-5 pb-4 ${balance < 0 ? 'bg-red-50' : ''}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo disponible</p>
          <p className={`text-4xl font-bold mt-1 tracking-tight ${balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {fmt(balance)}
          </p>
          {income === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Configura tu ingreso en <span className="text-indigo-600 font-semibold">Configuración →</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <div className="px-3 py-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </div>
              <span className="text-xs text-gray-400 font-medium">Ingreso</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">{fmt(income)}</span>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
              <span className="text-xs text-gray-400 font-medium">Fijos</span>
            </div>
            <span className="text-sm font-bold text-red-500">{fmt(totalFixed)}</span>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
              <span className="text-xs text-gray-400 font-medium">Variables</span>
            </div>
            <span className="text-sm font-bold text-orange-500">{fmt(totalVariable)}</span>
          </div>
        </div>
      </div>

      {/* Días, gasto diario y tracker de hoy */}
      {income > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Días restantes</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{daysLeft}</p>
              <p className="text-xs text-gray-400">del período</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Gasto diario OK</p>
              <p className={`text-2xl font-bold mt-1 ${dailyBudget > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                {dailyBudget > 0 ? fmt(dailyBudget) : 'S/ 0'}
              </p>
              <p className="text-xs text-gray-400">por día</p>
            </div>
          </div>
          {/* Tracker del día */}
          <div className={`rounded-2xl p-4 shadow-sm ${todayOver ? 'bg-red-50' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-700">Hoy</p>
              {todayOver
                ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">⚠ Pasado</span>
                : <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">✓ En control</span>
              }
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400">Gastado hoy</p>
                <p className={`text-2xl font-bold ${todayOver ? 'text-red-600' : 'text-gray-800'}`}>{fmt(todaySpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Presupuesto</p>
                <p className="text-lg font-bold text-indigo-500">{fmt(dailyBudget)}</p>
              </div>
            </div>
            {todayOver && (
              <p className="text-xs text-red-500 font-semibold mt-2">
                Te pasaste {fmt(todaySpent - dailyBudget)} del presupuesto de hoy
              </p>
            )}
            {!todayOver && todaySpent > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mt-2">
                Te quedan {fmt(dailyBudget - todaySpent)} para hoy
              </p>
            )}
          </div>
        </>
      )}

      {/* Ritmo */}
      {income > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-gray-700">Ritmo de gasto</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${pctSpent > pctPeriod ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
              {pctSpent > pctPeriod ? '⚠ Por encima' : '✓ En ritmo'}
            </span>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Período transcurrido</span><span className="font-bold">{pctPeriod}%</span>
              </div>
              <ProgressBar value={pctPeriod} max={100} color="#CBD5E1" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Presupuesto usado</span><span className="font-bold">{pctSpent}%</span>
              </div>
              <ProgressBar value={pctSpent} max={100} color={pctSpent > pctPeriod ? '#EF4444' : '#4F46E5'} />
            </div>
          </div>
        </div>
      )}

      {/* Top categorías */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-3">Top categorías</p>
          <div className="space-y-3">
            {topCats.map(([cat, amt], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{catEmoji(cat)} {cat}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-400 text-xs">{Math.round((amt/totalVariable)*100)}%</span>
                    <span className="font-bold text-gray-800">{fmt(amt)}</span>
                  </div>
                </div>
                <ProgressBar value={amt} max={totalVariable} color={['#4F46E5','#7C3AED','#EC4899'][i]} height={6} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      {recentExpenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-3">Últimos movimientos</p>
          <div className="space-y-3">
            {recentExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{catEmoji(exp.category?.name)}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{exp.description}</p>
                    <p className="text-xs text-gray-400">{relativeDate(exp.expense_date)}</p>
                  </div>
                </div>
                <p className="font-bold text-gray-800">{fmt(Number(exp.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {income === 0 && variableExpenses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-5xl mb-3">🚀</p>
          <p className="font-semibold text-gray-700">¡Bienvenido!</p>
          <p className="text-sm text-gray-400 mt-1">1. Configura tu ingreso mensual</p>
          <p className="text-sm text-gray-400">2. Revisa tus gastos fijos</p>
          <p className="text-sm text-gray-400">3. Registra gastos con el + de abajo</p>
        </div>
      )}

      <FAB onClick={() => setShowModal(true)} />

      {showModal && (
        <AddExpenseModal
          categories={categories.filter(c => c.scope === 'variable')}
          onClose={() => setShowModal(false)}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  )
}
