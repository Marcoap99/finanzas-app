export interface Category {
  id: string
  user_id: string
  name: string
  scope: 'fixed' | 'variable'
  is_active: boolean
  created_at: string
}

export interface MonthlyBudget {
  id: string
  user_id: string
  month: number
  year: number
  monthly_income: number
  created_at: string
}

export interface FixedExpenseTemplate {
  id: string
  user_id: string
  name: string
  category_id: string | null
  due_day: number
  is_active: boolean
  created_at: string
  // joined
  category?: Category | null
}

export interface MonthlyFixedExpense {
  id: string
  monthly_budget_id: string
  user_id: string
  fixed_template_id: string | null
  name: string
  amount: number
  category_id: string | null
  due_day: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  // joined
  category?: Category | null
}

export interface VariableExpense {
  id: string
  monthly_budget_id: string
  user_id: string
  amount: number
  description: string
  expense_type: 'necessary' | 'non_essential'
  category_id: string | null
  payment_method: 'cash' | 'card'
  expense_date: string
  created_at: string
  // joined
  category?: Category | null
}

// Para los formularios
export interface NewVariableExpense {
  amount: number
  description: string
  expense_type: 'necessary' | 'non_essential'
  category_id: string | null
  payment_method: 'cash' | 'card'
  expense_date: string
}

export interface UserProfile {
  user_id: string
  payday: number
  created_at: string
}

// Para el dashboard
export interface DashboardData {
  budget: MonthlyBudget
  fixedExpenses: MonthlyFixedExpense[]
  variableExpenses: VariableExpense[]
  categories: Category[]
}
