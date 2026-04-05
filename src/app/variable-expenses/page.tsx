import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget, getOrCreateUserProfile, getCurrentPeriod } from '@/lib/monthly'
import VariableExpensesClient from './VariableExpensesClient'

export default async function VariableExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { payday } = await getOrCreateUserProfile(supabase, user.id)
  const { month, year } = getCurrentPeriod(payday)
  const budget = await getOrCreateMonthlyBudget(supabase, user.id, month, year)

  const [{ data: variableExpenses }, { data: categories }] = await Promise.all([
    supabase
      .from('variable_expenses')
      .select('*, category:categories(id,name)')
      .eq('monthly_budget_id', budget.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('scope', 'variable')
      .order('name'),
  ])

  return (
    <VariableExpensesClient
      budget={budget}
      variableExpenses={variableExpenses ?? []}
      categories={categories ?? []}
      payday={payday}
    />
  )
}
