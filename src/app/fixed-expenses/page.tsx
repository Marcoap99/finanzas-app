import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyBudget } from '@/lib/monthly'
import FixedExpensesClient from './FixedExpensesClient'

export default async function FixedExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const budget = await getOrCreateMonthlyBudget(supabase, user.id, now.getMonth() + 1, now.getFullYear())

  const { data: fixedExpenses } = await supabase
    .from('monthly_fixed_expenses')
    .select('*, category:categories(id,name)')
    .eq('monthly_budget_id', budget.id)
    .order('due_day')

  return <FixedExpensesClient budget={budget} fixedExpenses={fixedExpenses ?? []} />
}
