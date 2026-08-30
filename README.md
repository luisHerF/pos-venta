# POS Multi-rubro

Sistema de punto de venta con inventario, escaneo de código de barras, roles de usuario (admin/vendedor), métricas de venta y cortes de caja (diario, semanal, mensual). Diseñado para adaptarse a distintos tipos de negocio (retail, boutique, restaurante, farmacia, u otro personalizado).

## Stack
- React + Vite + TypeScript + Tailwind CSS
- Supabase (base de datos Postgres, autenticación, RLS por negocio)
- ZXing para escaneo de código de barras por cámara + soporte nativo para lectores físicos USB/Bluetooth
- Recharts para las gráficas

## Base de datos (Supabase)
Ya está creada y lista para usarse:
- Proyecto: `pos-multirubro` (ref `jljodgpjjocdjvrgemhe`)
- Tablas: `businesses`, `profiles`, `categories`, `products`, `inventory_movements`, `sales`, `sale_items`, `cash_closures`
- Vistas de métricas: `v_sales_daily`, `v_sales_weekly`, `v_sales_monthly`, `v_top_products`, `v_low_stock`
- RLS activado: cada usuario solo ve datos de su propio negocio (`business_id`)

## Roles de usuario
- **Super administrador**: crea tiendas nuevas y genera el código de invitación de administrador para cada una. No opera ventas ni inventario directamente.
- **Administrador** (por tienda): controla ventas, inventario, categorías, reportes/cortes, usuarios y configuración de su tienda.
- **Vendedor**: solo Punto de venta y Panel.
- **Inventarista**: solo Inventario, Categorías y Panel.

### Cómo se une la gente a una tienda
Cada tienda tiene 3 códigos de invitación (formato `idDeTienda:rol`), visibles para el admin de esa tienda en "Usuarios", y para el super admin en su panel. La persona nueva los pega en el campo "Código de invitación" al registrarse.

### Cómo se crea el primer super administrador
No existe un botón para esto (por seguridad). El primer super admin se activa manualmente:
1. Regístrate normalmente en la app, sin código de invitación (tu cuenta quedará "pendiente de asignación").
2. Pide que te promuevan a super administrador actualizando tu perfil en la base de datos (`update profiles set role = 'super_admin' where id = 'tu-user-id'`).

## Desplegarlo en Cloudflare Pages (para conectarlo a tu dominio)
1. Sube este proyecto a GitHub (ver sección anterior).
2. Entra a dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
3. Elige tu repositorio.
4. Framework preset: **Vite**. Build command: `npm run build`. Build output directory: `dist`.
5. En "Environment variables" agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (están en `.env.example`).
6. Guarda y despliega. Cloudflare Pages queda corriendo en automático: cada vez que subas cambios a GitHub, se vuelve a construir y publicar solo.
7. Para usar tu propio dominio: dentro del proyecto de Pages, pestaña "Custom domains" → "Set up a custom domain" → escribe tu dominio (debe estar ya en tu cuenta de Cloudflare) → Cloudflare configura el DNS automáticamente.

## Cómo correrlo localmente
```bash
npm install
npm run dev
```
Las variables de Supabase ya están en `.env` (URL y llave pública "anon", segura para exponer en el frontend).

## Cómo subirlo a GitHub
Este chat no tiene un conector directo para crear/subir repos de GitHub (esa integración vive en Claude Code). Para subirlo tú mismo:

```bash
cd pos-app
git init
git add .
git commit -m "POS multi-rubro inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si prefieres que Claude lo suba por ti automáticamente, puedes hacerlo con **Claude Code** (`claude_code_desktop` o terminal), donde sí existe integración nativa con GitHub.

## Cómo desplegarlo (hosting)
Cualquier hosting de sitios estáticos sirve: Vercel, Netlify, Cloudflare Pages, o GitHub Pages.
1. Sube el repo a GitHub (paso anterior).
2. Conecta el repo en Vercel/Netlify.
3. Configura las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (están en `.env.example`).
4. Build command: `npm run build` — Output dir: `dist`.

## Primeros pasos dentro de la app
1. Crea tu cuenta (te conviertes en admin automáticamente).
2. Elige el rubro de tu negocio (puedes cambiarlo luego en Configuración).
3. Da de alta productos: manualmente o escaneando código de barras (botón "Alta rápida por escaneo" en Inventario).
4. Comparte el "Código de invitación" (en Usuarios) con tus empleados para que se unan como vendedores.
5. Usa Punto de venta para cobrar — el stock se descuenta automáticamente.
6. Revisa Panel y Reportes para tus métricas y genera cortes de caja diarios/semanales/mensuales.

## Extender a otro rubro
Edita `src/lib/rubros.ts` — cada rubro define su propia etiqueta de producto, atributos extra (ej. talla/color para boutique, lote/caducidad para farmacia) y color de marca. Agregar un rubro nuevo no requiere tocar el resto del código.
