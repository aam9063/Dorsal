# Dorsal

Tu temporada 2026 de Strava, contada en ocho historias y un dorsal para compartir.

Subes el `activities.csv` de tu exportación, el navegador lo lee **sin enviarlo a ningún servidor**, y el año se convierte en una pieza que puedes mirar y compartir: tu número de temporada, tus meses como perfil de etapa, tus rachas, tu arquetipo, tu material, tus latidos, y dos tarjetas PNG de 1080×1920 —el dorsal y el carnet de temporada— listas para historias.

Sin cuenta, sin registro, sin subida a la nube. Sólo 2026: el resto de tu historial se descarta mientras se lee el archivo y nunca sale del worker.

```
CSV local  →  Web Worker  →  agregados de 2026  →  ocho historias + dos tarjetas
             (parseo y métricas)   (YearSummary)        (React + Canvas 2D)
```

## Demo

<!--
  Hueco reservado para el gif del vídeo de lanzamiento.
  El gif que va aquí SÍ se versiona: guárdalo en docs/media/ y enlázalo como
  ![Dorsal en 20 segundos](docs/media/demo.gif)
  Las capturas de trabajo del vídeo viven en public/img/, que está fuera de git.
-->

## Privacidad: la promesa y cómo se sostiene

Tu archivo no sale de tu dispositivo. Eso no es una frase del README: es una restricción del proyecto con tres capas.

- **Lint**: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` y los `import()` remotos están prohibidos en `src/`. También el almacenamiento de datos de usuario, salvo la preferencia de tema.
- **Test de comportamiento**: `e2e/privacy.spec.ts` recorre la app entera —subida, procesado, ocho historias, exportar tarjeta— y comprueba que **toda** petición es al mismo origen y `GET`, que el worker y los websockets quedan en el origen, que `localStorage`, `sessionStorage`, `cookie` e `indexedDB` quedan vacíos, y que el contenido del archivo nunca viaja de vuelta en una petición.
- **Producción**: CSP estricta (`connect-src 'self'`, `script-src 'self'`, sin orígenes de terceros) y HSTS en `netlify.toml`, con cada relajación medida y su motivo escrito al lado.

## Empezar en local

Necesitas **Node 22** y **pnpm 11**.

```bash
pnpm install
pnpm fixtures   # genera las exportaciones sintéticas en fixtures/generated/
pnpm dev        # http://localhost:5173
```

No hay backend ni variables de entorno. No hay nada que configurar.

Los fixtures son personas inventadas (`runner-es`, `cyclist`, `multisport`, `no-gear`, `ten-years-history`, `no-2026`, `year-boundaries`, `broken-rows`, `cyclist-power`…). **Nunca** se commitea una exportación real.

## Comandos

| Comando                                        | Qué hace                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Servidor de desarrollo en el puerto 5173                                                                    |
| `pnpm build`                                   | Typecheck y build de producción en `dist/`                                                                  |
| `pnpm preview`                                 | Sirve el build de producción                                                                                |
| `pnpm check`                                   | La puerta completa: typecheck, lint, formato, tests, arquitectura, exportaciones reales y marca             |
| `pnpm test`                                    | Tests unitarios (Vitest)                                                                                    |
| `pnpm test:e2e`                                | Suite end-to-end en Chromium, WebKit y escritorio                                                           |
| `pnpm test:e2e --grep @privacy`                | Sólo la promesa de privacidad                                                                               |
| `pnpm verify --fixture runner-es --theme both` | Abre la app, sube un fixture, recorre las historias y guarda capturas, consola y red en `artifacts/verify/` |
| `pnpm lint` / `pnpm typecheck` / `pnpm arch`   | ESLint, TypeScript y las fronteras entre módulos                                                            |
| `pnpm fixtures`                                | Regenera las exportaciones sintéticas                                                                       |
| `pnpm og:image` / `pnpm icons`                 | Regeneran la imagen social y los iconos desde el propio renderer                                            |

## Verificación, no confianza

`pnpm verify` es la herramienta que usa este proyecto para no creerse nada: levanta la app, sube un fixture real, camina las ocho historias y deja evidencia de lo que pasó —capturas en claro y oscuro, `console.log`, `network.json`, y opcionalmente trazas de rendimiento y memoria. Cualquier `console.error` hace fallar la corrida.

La suite e2e incluye además comprobaciones de accesibilidad con axe en cada estado nuevo, y compara los dos PNG descargados byte a byte.

## Estructura

| Ruta            | Qué hay                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/core/`     | Dominio puro: lector del CSV, métricas, tiempo, esquema Zod. Sin React, sin DOM, sin red                   |
| `src/worker/`   | El Web Worker que parsea y calcula; sólo agregados de 2026 cruzan al hilo principal                        |
| `src/features/` | `landing`, `upload`, `processing`, `wrapped` (player y ocho historias), `share` (las dos tarjetas)         |
| `src/shared/`   | Tokens de diseño, i18n en español, hooks, componentes de UI                                                |
| `fixtures/`     | Generador de exportaciones sintéticas y las personas de prueba                                             |
| `scripts/`      | `verify` (evidencia real), `og-image` (imagen social e iconos), comprobaciones de marca y de exportaciones |
| `e2e/`          | Playwright: historias, player, subida, tarjetas, privacidad                                                |
| `docs/`         | `feature-map.md`, `export-format.md`, `glossary.md`, `launch-checklist.md`, `models.md`                    |
| `odd/tasks/`    | El documento de cada hito: specs citadas, decisiones y evidencia                                           |
| `design/`       | Sistema de diseño sincronizado y artboards del rediseño                                                    |

## Documentación

- **[`BRIEF.md`](BRIEF.md)** — qué se construye y en qué orden.
- **[`AGENTS.md`](AGENTS.md)** — cómo se trabaja aquí: el bucle del agente, las restricciones duras y las convenciones.
- **[`docs/feature-map.md`](docs/feature-map.md)** — cómo llegar a cada función y qué selectores la controlan.
- **[`docs/export-format.md`](docs/export-format.md)** — el formato real de `activities.csv` y qué columnas se leen.
- **[`docs/launch-checklist.md`](docs/launch-checklist.md)** — lo que hay que comprobar antes de publicar.

## Despliegue

Netlify. `main` publica en producción y cada pull request genera un deploy preview. El build es estático (`dist/`); las cabeceras de seguridad salen de `netlify.toml`. Sólo se mergea a `dev` y a `main` con revisión.

## Aviso

Dorsal no está afiliado a Strava ni cuenta con su respaldo. El nombre, los colores y los datos son del atleta: el archivo se procesa en su navegador y el resultado es suyo.
