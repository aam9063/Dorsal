# Checklist de lanzamiento (H-12)

Cada línea es un comando que se puede volver a correr o un número observado con la fecha del commit al que pertenece. Nada aquí es una promesa.

## 1. Código y checks

- [ ] `pnpm check` en verde (prettier, typecheck, lint, 262 tests unitarios, `arch`, `check:no-real-exports`, `check:brand`).
- [ ] `pnpm test:e2e` en verde: **157 pasan, 2 skipped** (los skipped son el share móvil, que se salta en desktop por diseño).
- [ ] `pnpm test:e2e --grep @privacy` en verde: **15 pasan** (5 casos × 3 proyectos).

## 2. Seguridad

- [ ] La CSP real llega al navegador. Contra el deploy preview o producción:
      `curl -sI https://<host>/ | grep -i -E 'content-security-policy|strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'`
- [ ] Las cabeceras coinciden con `netlify.toml`, y cada directiva relajada tiene su medición escrita ahí mismo:
  - `script-src 'self'` — el build no inyecta scripts inline; la única violación es la sonda `Function('')` de Zod, que se bloquea y cae a su validador interpretado.
  - `style-src 'unsafe-inline'` — la capa de animación inyecta siete `<style>` en las transiciones; medido, no supuesto.
  - `worker-src 'self'` — Vite emite el worker como asset, sin `blob:`.
  - `connect-src 'self'` — ninguna petición sale del origen, probado por `e2e/privacy.spec.ts`.
- [ ] Sin violaciones de CSP en la consola del recorrido completo, salvo la sonda de Zod ya documentada.

## 3. Accesibilidad

- [ ] Lighthouse accesibilidad **100** en móvil y escritorio (comando en §4).
- [ ] Los tres specs de axe en e2e siguen verdes (subida, temporada, historias).
- [ ] Teclado: flechas dentro del toggle Dorsal/Carnet del story 08, flechas del player, `Escape` cierra.

## 4. Rendimiento

Medido sobre el build de producción (`pnpm build`, `pnpm preview`), Lighthouse 12:

```
CHROME_PATH=<chrome> npx --yes lighthouse@12 http://localhost:4173/ \
  --quiet --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=/tmp/lh.json --only-categories=performance,accessibility
```

| Métrica       | Móvil   | Escritorio (`--preset=desktop`) |
| ------------- | ------- | ------------------------------- |
| Rendimiento   | **94**  | **100**                         |
| Accesibilidad | **100** | **100**                         |
| FCP           | 1,8 s   | 0,4 s                           |
| LCP           | 2,9 s   | 0,6 s                           |
| TBT           | 47 ms   | 0 ms                            |
| CLS           | 0       | 0                               |

- [ ] El entry bundle no vuelve a crecer sin motivo: `ls -la dist/assets/*.js | sort -k5 -rn | head` → entrada **408 kB** (era 709 kB antes de partir el bundle por rutas), `wrapped` 202 kB, `upload` 100 kB, worker 38 kB.
- [ ] `dist/index.html` declara los preloads de las fuentes que la primera pantalla pinta, con los nombres hasheados del build.

## 5. Metadatos y compartir

- [ ] `index.html` lleva `og:*`, `twitter:card`, `canonical` y `apple-touch-icon`; `og:image` mide 1200×630 y pesa 56.833 bytes.
- [ ] Vista previa social revisada a mano en un validador (p. ej. opengraph.xyz) contra el deploy preview: título, descripción e imagen.
- [ ] `public/og-image.png` y los iconos se regeneran con `pnpm og:image` y `pnpm icons`; son idempotentes.
- [ ] `public/robots.txt` y `public/sitemap.xml` responden 200 en el deploy.

## 6. Privacidad (la promesa del producto)

- [ ] `e2e/privacy.spec.ts` prueba, sobre la app corriendo: todas las peticiones del recorrido completo son al mismo origen y `GET`; el worker y los websockets quedan en el origen; `localStorage`, `sessionStorage`, `cookie` e `indexedDB` quedan vacíos salvo la clave del tema; y el contenido del archivo nunca viaja de vuelta en una petición.
- [ ] La única excepción del spec es un websocket de loopback sin ruta inyectado por Console Ninja (extensión de VS Code), identificado con CDP y `netstat`; no existe en CI ni en producción. Si cambia la herramienta del editor, revisar `editorInstrumentationWebsocket`.

## 7. Decisiones de Albert antes de lanzar

- [ ] **Dominio definitivo** (BRIEF §13). Hoy es el placeholder `https://dorsal.app` en `index.html` (bloque comentado), `public/robots.txt` y `public/sitemap.xml`. Cambiarlo en esos tres sitios y regenerar nada más.
- [ ] **Prueba en dispositivos reales**: Safari iOS y Chrome Android, con capturas en el PR de H-12 (BRIEF §11). Esto no lo puede hacer un agente.
- [ ] **Nombre y marca**: comprobar disponibilidad antes de publicar (BRIEF §13).

## 8. Después del deploy a producción

- [ ] Repetir §2 contra el dominio real.
- [ ] Subir un `activities.csv` real y recorrer las ocho historias, incluida la descarga de las dos tarjetas.
- [ ] Refrescar la caché de la vista previa social del dominio nuevo.
- [ ] Confirmar que `/subir` y `/resultado` responden por enrutado del cliente (recarga directa de la URL, no sólo navegación interna).
