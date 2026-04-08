import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget, seedUserDefaults, getOrCreateUserProfile, getCurrentPeriod } from '@/lib/monthly'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [, { payday }] = await Promise.all([
    seedUserDefaults(supabase, user.id),
    getOrCreateUserProfile(supabase, user.id),
  ])
  const { month, year } = getCurrentPeriod(payday)

  // Obtener o crear presupuesto del período
  const budget = await getOrCreateMonthlyBudget(supabase, user.id, month, year)

  // Cargar datos del mes
  const [{ data: fixedExpenses }, { data: variableExpenses }, { data: categories }] = await Promise.all([
    supabase
      .from('monthly_fixed_expenses')
      .select('*, category:categories(id,name)')
      .eq('monthly_budget_id', budget.id)
      .order('due_day'),
    supabase
      .from('variable_expenses')
      .select('*, category:categories(id,name)')
      .eq('monthly_budget_id', budget.id)
      .order('expense_date', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <DashboardClient
      budget={budget}
      fixedExpenses={fixedExpenses ?? []}
      variableExpenses={variableExpenses ?? []}
      categories={categories ?? []}
      userName={user.user_metadata?.name ?? user.email ?? ''}
      payday={payday}
    />
  )
}
