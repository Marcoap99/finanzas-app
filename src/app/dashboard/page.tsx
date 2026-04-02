import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget, seedUserDefaults } from '@/lib/monthly'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Sembrar defaults si es usuario nuevo
  await seedUserDefaults(supabase, user.id)

  // Obtener o crear presupuesto del mes
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
    />
  )
}
