import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget } from '@/lib/monthly'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const budget = await getOrCreateMonthlyBudget(supabase, user.id, month, year)

  const [{ data: categories }, { data: templates }, { data: pastBudgets }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    supabase.from('fixed_expense_templates').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('monthly_budgets')
      .select('*')
      .eq('user_id', user.id)
      .neq('id', budget.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12),
  ])

  // Para cada mes pasado, cargar totales
  const historyWithTotals = await Promise.all(
    (pastBudgets ?? []).map(async (b) => {
      const [{ data: fixed }, { data: variable }] = await Promise.all([
        supabase.from('monthly_fixed_expenses').select('amount').eq('monthly_budget_id', b.id),
        supabase.from('variable_expenses').select('amount, description, expense_type, expense_date, category_id').eq('monthly_budget_id', b.id),
      ])
      const totalFixed    = (fixed ?? []).reduce((s, e) => s + Number(e.amount), 0)
      const totalVariable = (variable ?? []).reduce((s, e) => s + Number(e.amount), 0)
      return { ...b, totalFixed, totalVariable, expenses: variable ?? [] }
    })
  )

  // Datos del mes actual para exportar
  const [{ data: currentFixed }, { data: currentVariable }] = await Promise.all([
    supabase.from('monthly_fixed_expenses').select('amount').eq('monthly_budget_id', budget.id),
    supabase.from('variable_expenses')
      .select('amount, description, expense_type, expense_date, category:categories(name), payment_method')
      .eq('monthly_budget_id', budget.id),
  ])

  return (
    <SettingsClient
      budget={budget}
      categories={categories ?? []}
      templates={templates ?? []}
      history={historyWithTotals}
      currentFixed={(currentFixed ?? []).reduce((s, e) => s + Number(e.amount), 0)}
      currentVariable={(currentVariable ?? []).reduce((s, e) => s + Number(e.amount), 0)}
      currentExpenses={currentVariable ?? []}
      userEmail={user.email ?? ''}
    />
  )
}
