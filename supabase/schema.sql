-- ============================================================
-- FINANZAS APP — Schema completo con RLS
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── CATEGORÍAS ───────────────────────────────────────────────
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  scope      text not null default 'variable' check (scope in ('fixed', 'variable')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "users see own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── PRESUPUESTO MENSUAL ──────────────────────────────────────
create table if not exists monthly_budgets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  month          int not null check (month between 1 and 12),
  year           int not null check (year >= 2024),
  monthly_income numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  unique (user_id, month, year)
);

alter table monthly_budgets enable row level security;

create policy "users see own budgets"
  on monthly_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── TEMPLATES DE GASTOS FIJOS ─────────────────────────────────
-- Definen QUÉ gastos fijos tiene el usuario (no el monto)
create table if not exists fixed_expense_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  category_id uuid references categories(id) on delete set null,
  due_day     int not null default 1 check (due_day between 1 and 31),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table fixed_expense_templates enable row level security;

create policy "users see own templates"
  on fixed_expense_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── GASTOS FIJOS DEL MES (fuente de verdad) ──────────────────
-- Se generan al crear el mes, copiando los templates activos.
-- El monto es editable por mes.
create table if not exists monthly_fixed_expenses (
  id                  uuid primary key default gen_random_uuid(),
  monthly_budget_id   uuid references monthly_budgets(id) on delete cascade not null,
  user_id             uuid references auth.users(id) on delete cascade not null,
  fixed_template_id   uuid references fixed_expense_templates(id) on delete set null,
  name                text not null,
  amount              numeric(12,2) not null default 0,
  category_id         uuid references categories(id) on delete set null,
  due_day             int not null default 1,
  is_paid             boolean not null default false,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table monthly_fixed_expenses enable row level security;

create policy "users see own fixed expenses"
  on monthly_fixed_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── GASTOS VARIABLES ─────────────────────────────────────────
create table if not exists variable_expenses (
  id                uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid references monthly_budgets(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  amount            numeric(12,2) not null check (amount > 0),
  description       text not null default '',
  expense_type      text not null check (expense_type in ('necessary', 'non_essential')),
  category_id       uuid references categories(id) on delete set null,
  payment_method    text not null default 'cash' check (payment_method in ('cash', 'card')),
  expense_date      date not null default current_date,
  created_at        timestamptz not null default now()
);

alter table variable_expenses enable row level security;

create policy "users see own variable expenses"
  on variable_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── ÍNDICES ───────────────────────────────────────────────────
create index if not exists idx_monthly_budgets_user_month
  on monthly_budgets(user_id, year, month);

create index if not exists idx_monthly_fixed_user_budget
  on monthly_fixed_expenses(user_id, monthly_budget_id);

create index if not exists idx_variable_user_budget_date
  on variable_expenses(user_id, monthly_budget_id, expense_date desc);

create index if not exists idx_templates_user_active
  on fixed_expense_templates(user_id, is_active);

-- ── FUNCIÓN: obtener último monto conocido de un template ─────
-- Busca el monto más reciente del mismo template en meses anteriores
create or replace function get_last_template_amount(
  p_user_id uuid,
  p_template_id uuid,
  p_year int,
  p_month int
)
returns numeric as $$
  select mfe.amount
  from monthly_fixed_expenses mfe
  join monthly_budgets mb on mb.id = mfe.monthly_budget_id
  where mfe.user_id       = p_user_id
    and mfe.fixed_template_id = p_template_id
    and (mb.year < p_year or (mb.year = p_year and mb.month < p_month))
  order by mb.year desc, mb.month desc
  limit 1;
$$ language sql stable;
