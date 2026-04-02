import type { SupabaseClient } from '@supabase/supabase-js'
import type { MonthlyBudget } from './types'

// Categorías por defecto para nuevos usuarios
const DEFAULT_CATEGORIES = [
  { name: 'Alimentación',    scope: 'variable' },
  { name: 'Transporte',      scope: 'variable' },
  { name: 'Entretenimiento', scope: 'variable' },
  { name: 'Vestimenta',      scope: 'variable' },
  { name: 'Suscripciones',   scope: 'variable' },
  { name: 'Salud',           scope: 'variable' },
  { name: 'Educación',       scope: 'variable' },
  { name: 'Mascotas',        scope: 'variable' },
  { name: 'Deudas',          scope: 'variable' },
  { name: 'Hogar',           scope: 'variable' },
  { name: 'Viajes',          scope: 'variable' },
  { name: 'Otros',           scope: 'variable' },
]

// Templates por defecto para nuevos usuarios (gastos fijos del spec)
const DEFAULT_TEMPLATES = [
  { name: 'Inglés',                    due_day: 1  },
  { name: 'Seguro tarjeta',            due_day: 1  },
  { name: 'Plan de celular',           due_day: 1  },
  { name: 'Clases Surf',               due_day: 1  },
  { name: 'Proteína en polvo',         due_day: 1  },
  { name: 'Suscripción Gym',           due_day: 1  },
  { name: 'Claude',                    due_day: 1  },
  { name: 'Mascotas (comida y arena)', due_day: 1  },
  { name: 'Seguro desgravamen',        due_day: 1  },
  { name: 'Mantenimiento (casa)',      due_day: 1  },
  { name: 'Arbitrios (casa)',          due_day: 1  },
  { name: 'Internet (casa)',           due_day: 1  },
  { name: 'Luz (casa)',               due_day: 1  },
  { name: 'Agua (casa)',              due_day: 1  },
]

/**
 * Siembra categorías y templates para usuarios nuevos.
 * Solo corre si el usuario no tiene ninguna categoría aún.
 */
export async function seedUserDefaults(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) > 0) return // ya tiene datos

  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }))
  )

  await supabase.from('fixed_expense_templates').insert(
    DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: userId }))
  )
}

/**
 * Obtiene o crea el presupuesto mensual del mes/año indicado.
 * Si lo crea, copia los templates activos como gastos fijos del mes,
 * usando el último monto conocido de cada template.
 */
export async function getOrCreateMonthlyBudget(
  supabase: SupabaseClient,
  userId: string,
  month: number,
  year: number
): Promise<MonthlyBudget> {

  // 1. Buscar si ya existe
  const { data: existing } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (existing) return existing as MonthlyBudget

  // 2. Crear el presupuesto del mes
  const { data: budget, error } = await supabase
    .from('monthly_budgets')
    .insert({ user_id: userId, month, year, monthly_income: 0 })
    .select()
    .single()

  if (error || !budget) throw new Error('No se pudo crear el presupuesto mensual')

  // 3. Copiar templates activos como gastos fijos del mes
  const { data: templates } = await supabase
    .from('fixed_expense_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (templates && templates.length > 0) {
    // Para cada template, buscar el último monto conocido
    const fixedRows = await Promise.all(
      templates.map(async (tpl) => {
        const { data: lastAmount } = await supabase
          .rpc('get_last_template_amount', {
            p_user_id: userId,
            p_template_id: tpl.id,
            p_year: year,
            p_month: month,
          })

        return {
          monthly_budget_id: budget.id,
          user_id: userId,
          fixed_template_id: tpl.id,
          name: tpl.name,
          amount: lastAmount ?? 0,
          category_id: tpl.category_id ?? null,
          due_day: tpl.due_day,
          is_paid: false,
        }
      })
    )

    await supabase.from('monthly_fixed_expenses').insert(fixedRows)
  }

  return budget as MonthlyBudget
}
