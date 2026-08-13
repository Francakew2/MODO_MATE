# Modo Mate — contexto del proyecto

E-commerce de mates, termos, yerbas, hierbas y accesorios (San Cristóbal, Santa Fe, Argentina). Negocio real, en camino a lanzamiento público.

## Arquitectura

- **Frontend**: React + Vite, un solo archivo `src/App.jsx` gigante maneja "páginas" (`currentPage`: home/productos/contacto) y "tabs" (`currentTab`: shop/admin/my-orders) por **estado de React, no por rutas reales**. No hay react-router. Todo vive en `/` — no hay URLs individuales por producto ni por sección.
- **Backend**: Express en `server/`, un solo servicio.
- **Base de datos**: Supabase (proyecto `ldoktrojrlecpxcumqap`, plan Pro). Tablas: `products`, `orders`, `profiles` (con `role`: customer/admin), `favorites`. Ver `database.sql` para el esquema y políticas RLS.
- **Pagos**: Mercado Pago (`server/routes/payments.js`), más "Venta en Local" manual desde el admin (no pasa por Mercado Pago).
- **Auth**: Supabase Auth con Google OAuth. El rol de admin se determina por `profiles.role`.

## Dónde vive cada cosa

| Servicio | Cuenta | Notas |
|---|---|---|
| GitHub | `Francakew2` (único colaborador) | repo `Francakew2/MODO_MATE`, rama `main` con auto-deploy |
| Backend (Render) | `franciscochaulet011@gmail.com` | servicio `modo-mate-api`, plan Starter. **Cuenta migrada** — había una cuenta de Render anterior (ligada a `modomate1.com.ar`, dominio registrado por "Diego Omar Fernandez" según WHOIS de NIC.ar) a la que nunca se encontró acceso. Se creó un servicio nuevo desde cero con las mismas variables de entorno. |
| Frontend (Cloudflare Workers) | — | `wrangler.jsonc`, deploy automático vía "Workers Builds" en cada push a `main`. Dominio: `modomate1.com.ar` (registrado en NIC.ar, nameservers de Cloudflare). |
| Supabase | `franciscochaulet011@gmail.com` (confirmado con acceso) | Proyecto `ldoktrojrlecpxcumqap`, plan Pro. |
| Google Cloud (OAuth) | `franciscochaulet011@gmail.com` | Proyecto `modo-mate-504702`. Cliente OAuth propio ("Modo Mate"), publicado en producción. |

Las credenciales reales (Supabase service key, Mercado Pago token, etc.) están en `server/.env`, que **no está en git**. Si hace falta reconfigurar el backend en otro lado, están ahí.

## Limitaciones conocidas (a propósito, no son bugs)

- **Sin rutas reales**: como no hay react-router, Google nunca puede indexar productos individuales — todo el SEO orgánico entra por la home. Si en algún momento se prioriza SEO/Ads, hay que migrar a rutas reales.
- **Pantalla de login de Google**: sigue mostrando `ldoktrojrlecpxcumqap.supabase.co` en vez de "Modo Mate" en la pantalla de permisos ("Acceder con Google"). Tiene un cliente OAuth propio y consent screen con marca, pero esa línea específica de Google usa el dominio del *redirect_uri* (el callback de Supabase), no el nombre de marca. Para sacarlo del todo hace falta el add-on pago de **Custom Domains** de Supabase — decisión pendiente, no urgente.
- **Plan Free de Render** duerme el servicio tras 15 min de inactividad — ya se resolvió pasando a Starter ($7/mes), pero si alguna vez se crea un servicio nuevo, recordar este detalle.

## Seguridad (auditado 2026-08, ver también HARDENING_PROFESIONAL.md)

Se hizo una auditoría a fondo probando ataques reales con usuarios descartables (crear, atacar con la anon key, verificar con la service key, borrar). Se encontraron y cerraron 3 agujeros reales — el modelo de seguridad actual depende de esto, **no revertir sin entender por qué**:

- `profiles` **no tiene política de SELECT pública** (antes `USING (true)` exponía email/teléfono/dirección/rol de todos los usuarios a cualquiera con la anon key, sin login). Ahora cada uno ve solo su propia fila.
- `profiles` tiene `REVOKE UPDATE ... FROM authenticated` + `GRANT UPDATE` solo sobre columnas no sensibles (nombre, teléfono, dirección, etc.) — la columna `role` quedó **fuera** de lo que un usuario puede tocar desde el cliente. Antes cualquier cliente podía `update({role:'admin'})` sobre su propia fila y volverse admin real (el backend confía en esa misma columna). Esto funciona porque el admin **nunca** escribe en `products`/`orders`/`profiles` con su propio JWT — siempre pasa por el backend con `service_role`. Si algún día se agrega una escritura admin directa desde el cliente, este `REVOKE/GRANT` la va a bloquear también (ver el caso de Club Ferro Dho en HARDENING_PROFESIONAL.md, donde el admin sí escribe con su propio JWT y hubo que usar un trigger en vez de esto).
- `orders` **no tiene política de INSERT para el cliente** (se borró). Antes se podía insertar un pedido directo con precios inventados, saltando el backend, y pagarlo por Mercado Pago a un precio manipulado. Los pedidos se crean exclusivamente vía `POST /api/orders` (backend, `service_role`).
- `server/routes/payments.js` → `/create-preference` **revalida los precios contra `products` en el momento exacto de generar el cobro** (no confía en `order.items[].price`, aunque ese pedido se haya creado bien por el flujo normal). Si el total recalculado no coincide con `order.total`, rechaza con 400.
- `server/routes/products.js` valida precio (>0) y stock (≥0) en el backend, tanto en `POST` como en `PUT` (antes el `PUT` no validaba nada).
- `public.handle_new_user()` (trigger que crea la fila en `profiles` al registrarse un usuario, `SECURITY DEFINER`) tenía `search_path` mutable y `EXECUTE` otorgado a `PUBLIC` (por default de Postgres al crear la función), lo que la dejaba invocable directo vía `/rest/v1/rpc/handle_new_user` por cualquiera, logueado o no. Detectado el 2026-08-13 con el advisor de seguridad de Supabase (`get_advisors`). No era explotable en la práctica — es función de trigger (usa `NEW`, que solo existe en contexto de trigger; Postgres tira error si se la llama directo) — pero se cerró igual como hardening: `ALTER FUNCTION ... SET search_path = public, pg_temp` + `REVOKE EXECUTE ... FROM PUBLIC`. El trigger sigue andando porque Postgres invoca las funciones de trigger internamente, sin chequear el `EXECUTE` del rol que dispara el INSERT.

## Deploys — verificar SIEMPRE después de pushear

**No asumir que un push llegó a producción.** El 2026-08-05 se rompió el deploy de Cloudflare (`public/_redirects` con una URL absoluta de otro host — Cloudflare Workers solo acepta rutas relativas ahí) y **8 días de commits fallaron en silencio**: el sitio siguió andando con la última versión buena, así que nadie lo notó hasta que se revisó el historial de builds a propósito.

- Después de cada push a `main`, chequear el check de "Workers Builds: modo-mate" en `github.com/Francakew2/MODO_MATE/commits/main` (o el historial de compilaciones en el dashboard de Cloudflare). Si dice "0/1", el frontend NO se actualizó aunque el push haya funcionado.
- El redirect `www.modomate1.com.ar` → `modomate1.com.ar` **NO va en `public/_redirects`** (ese archivo solo sirve para rutas relativas dentro del mismo host). Está resuelto con una **Redirect Rule a nivel de zona** en el dashboard de Cloudflare (Reglas → Reglas de redireccionamiento → plantilla "Redirigir de WWW a raíz"). `www` está enrutado como Worker route/custom domain (no un DNS A/CNAME normal), por eso al crearla Cloudflare avisa "es posible que no aplique" — igual funciona, se verificó con `curl -I` (301 real).
- Para el backend (Render), el equivalente es chequear `https://modo-mate-api.onrender.com/health` y, si hace falta más detalle, el log de deploy en el dashboard de Render.
- Render es un pipeline de deploy **independiente** de Cloudflare (auto-deploy propio en cada push a `main` que toque `server/`) — el incidente del `_redirects` roto arriba **no** lo afectó. Verificado a mano el 2026-08-13 contra el dashboard de Render: los 3 commits de seguridad (`8e3341c`, `41bd49d`, etc.) quedaron "Live" en Render entre 12 y 28 segundos después de cada push, sin ningún gap. Igual, no asumir esto para siempre — confirmar en el dashboard si hay dudas.

## MCP de Supabase en Claude Code

Hay un servidor MCP de Supabase agregado a nivel de proyecto (`.mcp.json`, scope `project`) apuntando al proyecto real `ldoktrojrlecpxcumqap` (agregado el 2026-08-13, todavía sin autenticar al momento de escribir esto). Para autenticarlo: `claude /mcp` en una terminal normal (no funciona en una sesión no interactiva) → elegir `supabase` → Authenticate.

**Gotcha:** Fran tiene otras cuentas/organizaciones de Supabase conectadas en el mismo navegador (proyectos de otros clientes, ej. `adriana-jabones`, `club-ferro-dho-test`). Si el flujo OAuth tira "Organization unavailable — Your account is not a member of the pre-selected organization", es porque el navegador tiene activa la sesión de la cuenta/org equivocada. Solución: loguearse en supabase.com con `franciscochaulet011@gmail.com` (la cuenta dueña de `ldoktrojrlecpxcumqap`) antes de autenticar, o usar una ventana de incógnito.

Además, los servidores MCP se cargan al arrancar la sesión de Claude Code — si se agrega/autentica un servidor a mitad de una conversación ya abierta, esa conversación no lo va a ver. Hace falta abrir una sesión nueva.

## Convenciones del código

- El rate limiter de `server/index.js` requiere `app.set('trust proxy', 1)` porque Render está detrás de un proxy inverso — sin esto, todo el tráfico del sitio (todos los visitantes) cuenta como una sola IP.
- Las lecturas públicas (`GET`) están excluidas del rate limiter; solo escrituras (POST/PUT/DELETE) cuentan.
- En el panel de admin, `handleSubmitProduct` y los handlers de `App.jsx` (crear/editar producto) **esperan la respuesta real del servidor** antes de mostrar "éxito" — antes había un bug donde el mensaje de éxito aparecía sin importar el resultado real.
- Categorías: Mates, Termos, Yerbas, Hierbas, Accesorios, **Bombillas y Bombillones**. "Mates" tiene subcategorías propias (Imperiales, Torpedo, Camioneros, Criollos, Algarrobo, Otros) y **no** se ordena alfabéticamente. El resto sí se ordena A-Z para el cliente. Los nombres de categoría están hardcodeados en 3 lugares que hay que mantener sincronizados: la grilla de categorías en `App.jsx`, el `<select>` del formulario de producto en `AdminPanel.jsx`, y la lista del footer en `Footer.jsx`.
- En modo admin (`userRole === 'admin'`), la navbar oculta Inicio/Productos/Contacto/carrito — esa vista es solo el panel de admin, no hay "otra página" a la que navegar.

## Notas de contexto humano

- Fran (el usuario) es el único desarrollador. Los dueños del negocio (incluye a "Diego") no tocan código ni infraestructura técnica.
- El negocio ya tiene actividad real (270+ productos al momento de escribir esto), pero **aún no se divulgó públicamente** — está en fase de pulido antes del lanzamiento (ya circuló un "muy pronto" en el Instagram del negocio).
- Hay ~68 productos placeholder cargados por Fran (nombre "1", "2", "q", precio $1, sin descripción) **a propósito** — el dueño del negocio los va a completar con datos reales. No son basura de testing, no borrar sin confirmar primero.
