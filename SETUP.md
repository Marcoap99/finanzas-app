# Setup — Mis Finanzas App

## 1. Instalar Node.js

Descarga e instala desde: https://nodejs.org (versión LTS)
Verifica: `node --version` (debe decir v18 o mayor)

---

## 2. Instalar dependencias del proyecto

```bash
cd "C:\Users\Marcoantonio\Desktop\App finanzas\finanzas-app"
npm install
```

---

## 3. Crear proyecto en Supabase

1. Ve a https://supabase.com → Sign up con Google
2. **New project** → nombre: `finanzas-app` → región: South America
3. Espera ~2 minutos a que se cree

### Ejecutar el schema SQL:
- Ve a **SQL Editor** → **New query**
- Pega todo el contenido de `supabase/schema.sql`
- Click **Run**

### Activar Google OAuth:
- Ve a **Authentication** → **Providers** → **Google**
- Activa **Enable Google provider**
- Necesitas **Client ID** y **Client Secret** de Google Cloud Console:
  1. Ve a https://console.cloud.google.com
  2. Crea un proyecto nuevo
  3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
  4. Application type: **Web application**
  5. Authorized redirect URIs: agrega `https://xxxx.supabase.co/auth/v1/callback`
     (reemplaza xxxx con tu proyecto ID de Supabase)
  6. Copia Client ID y Secret → pégalos en Supabase

### Obtener credenciales:
- Ve a **Settings** → **API**
- Copia **Project URL** y **anon/public key**

---

## 4. Configurar variables de entorno

```bash
# Copia el ejemplo
cp .env.local.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Correr en local

```bash
npm run dev
```

Abre http://localhost:3000 → te va a pedir login con Google.

---

## 6. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit - Finanzas MVP"
```

Crea un repo en https://github.com/new (privado, sin README)
```bash
git remote add origin https://github.com/TU_USUARIO/finanzas-app.git
git branch -M main
git push -u origin main
```

---

## 7. Deploy en Vercel

1. Ve a https://vercel.com → Sign up con GitHub
2. **Add New Project** → importa tu repo `finanzas-app`
3. Framework: **Next.js** (lo detecta solo)
4. **Environment Variables** → agrega las mismas variables de `.env.local`
5. Click **Deploy**

Vercel te da una URL tipo `https://finanzas-app.vercel.app`

### Actualizar URL en Supabase:
- Supabase → Authentication → URL Configuration
- Site URL: `https://finanzas-app.vercel.app`
- Redirect URLs: agrega `https://finanzas-app.vercel.app/**`

### Actualizar Google OAuth:
- Google Cloud Console → Authorized redirect URIs → agrega:
  `https://xxxx.supabase.co/auth/v1/callback` (ya debería estar)

---

## 8. Invitar a tu tía / mamá

Solo comparte el link de Vercel.
Cada una entra con su Google → sesión propia → datos separados.
No necesitan hacer nada más.

---

## Estructura del proyecto

```
finanzas-app/
├── src/
│   ├── app/
│   │   ├── dashboard/        ← página principal
│   │   ├── fixed-expenses/   ← gastos fijos
│   │   ├── variable-expenses/← gastos variables
│   │   ├── settings/         ← configuración + historial
│   │   ├── login/            ← pantalla de login
│   │   └── auth/callback/    ← manejador OAuth
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── FAB.tsx
│   │   └── AddExpenseModal.tsx
│   └── lib/
│       ├── supabase/         ← clientes server/browser
│       ├── types.ts          ← tipos TypeScript
│       ├── format.ts         ← helpers de formato
│       └── monthly.ts        ← lógica de mes automático
├── supabase/
│   └── schema.sql            ← tablas + RLS
└── middleware.ts             ← protección de rutas
```
