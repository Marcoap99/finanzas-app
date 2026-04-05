import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget, getOrCreateUserProfile, getCurrentPeriod } from '@/lib/monthly'
import FixedExpensesClient from './FixedExpensesClient'

export default async function FixedExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { payday } = await getOrCreateUserProfile(supabase, user.id)
  const { month, year } = getCurrentPeriod(payday)
  const budget = await getOrCreateMonthlyBudget(supabase, user.id, month, year)

  const { data: fixedExpenses } = await supabase
    .from('monthly_fixed_expenses')
    .select('*, category:categories(id,name)')
    .eq('monthly_budget_id', budget.id)
    .order('due_day')

  return <FixedExpensesClient budget={budget} fixedExpenses={fixedExpenses ?? []} payday={payday} />
}
