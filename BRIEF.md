# BRIEF: Dorsal (nombre de trabajo)

> Documento de arranque para los agentes. Contiene el objetivo, las decisiones tomadas, el stack, la arquitectura, la especificación de cada métrica, el plan por hitos y la metodología (ODD, RDD y flujo Git) integrada en cada parte.
> Las reglas operativas permanentes viven en `AGENTS.md`. Este brief describe **qué construir y en qué orden**.
> Idioma: este brief está en español. Código, commits, PRs e issues van en inglés. La interfaz de la web va en español.
> Diseño de referencia (landing, subida, procesado y las 8 historias, en modo claro y oscuro): https://claude.ai/artifact/3cgF6mxANwvDekwgcuZcsz (pendiente de actualizar a la subida del CSV y a la historia 06 "Tu material", ver sección 13).

---

## 1. Qué es y por qué

**Dorsal** es una web donde cualquier deportista sube el archivo `activities.csv` de la exportación de su cuenta de Strava y recibe su resumen del año 2026 en formato historias (tipo "wrapped"), más una tarjeta en forma de dorsal para compartir.

El CSV trae **todo el historial** desde que se creó la cuenta. Dorsal lo lee entero, pero **solo usa las actividades de 2026** y descarta el resto nada más leerlo (sección 5.4).

**Problema.** Strava hizo de pago su resumen anual "Year in Sport" en 2025, por primera vez desde 2016. Muchos usuarios gratuitos se quedaron sin él y se quejaron públicamente.

**Propuesta.** El usuario ya tiene derecho a descargar todos sus datos gratis. Dorsal los lee **en su propio navegador**, sin cuentas, sin servidor y sin conectar nada, y le devuelve su temporada contada como una carrera.

**Diferenciadores frente al resumen oficial:**
- Gratis y sin registro.
- Privacidad verificable: el archivo nunca sale del dispositivo (y lo comprobamos con tests, ver sección 8).
- Historias propias que no existen en el resumen oficial: el perfil de etapa del año, el material del año, el año en latidos y el arquetipo deportivo.

**Calendario.** Hoy es 23 nov 2026. Objetivo: **v1 pública antes del 15 dic 2026**, para coincidir con la temporada de resúmenes anuales. Strava tarda horas en preparar el archivo, así que la landing debe estar publicada unos días antes para que la gente lo pida a tiempo.

---

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Entrada | Solo el archivo `activities.csv`. No se lee el `.zip` ni los ficheros GPS (FIT, GPX, TCX). |
| Periodo | Solo 2026. El CSV se lee entero, pero las actividades de otros años se descartan en el worker y nunca salen de él. |
| Procesado | 100 % en el navegador, dentro de un Web Worker. Sin backend. |
| Cuentas | Ninguna. Sin email, sin login, sin OAuth con Strava. |
| Red | Tras elegir el archivo, la app no hace **ninguna** petición de red. Fuentes y assets autoalojados. |
| Persistencia | No se guarda nada del usuario (ni localStorage, ni IndexedDB, ni cookies). Única excepción: la preferencia de tema claro/oscuro. |
| Analítica | Ninguna en v1. |
| Plataforma | Web estática, mobile first, PWA instalable opcional (sin modo offline de datos). |
| Año | Año natural 2026 en hora local del usuario (sección 5.4). Si exporta antes del 31 dic, se muestra "hasta el <fecha de la última actividad>". |
| Idioma | Español en v1, con los textos externalizados para añadir inglés en v1.1. |
| Tema | Claro y oscuro según `prefers-color-scheme`, con selector manual. |
| Color principal | Naranja `#FC5200`. En texto pequeño sobre blanco se usa `#C23F00` (el `#FC5200` no llega a 4.5:1). |
| Marca | No usamos el nombre ni el logo de Strava como marca. Solo frases descriptivas ("compatible con la exportación de tu cuenta de Strava") y un aviso de no afiliación en el footer. |
| Licencia | MIT, repositorio público. |
| Hosting | Netlify (deploy preview por PR, producción desde `main`). |

---

## 3. Stack

Versiones: la última estable de cada herramienta en el momento de H-00. El agente fija las versiones exactas en `package.json` y lo anota en el documento de la feature.

| Capa | Elección | Motivo |
|---|---|---|
| Build | Vite | SPA estática, arranque rápido. |
| UI | React 19 + TypeScript estricto (TSX) | Stack habitual del proyecto. |
| Estilos | Tailwind CSS v4 con tokens propios | Tokens de color y tipografía del diseño. |
| Gestor de paquetes | pnpm | Preferencia del proyecto. |
| Routing | React Router (modo librería) | Solo 3 rutas: `/`, `/subir`, `/resultado`. |
| Worker RPC | Comlink | API tipada entre hilo principal y worker. |
| CSV | Papa Parse | Campos con comas y comillas; lectura por posición de columna (ver 5.2). |
| Validación de contrato | Zod | Valida el `YearSummary` que devuelve el worker. |
| Animación | Motion (historias) + GSAP (landing) | Transiciones de historias con Motion, como fija H-07; la landing usa GSAP por decisión de Albert. Ambas respetan `prefers-reduced-motion`. Nota: son dos librerías en el bundle; consolidar en GSAP es una decisión aparte (ver `odd/tasks/landing-animations.md`). |
| Tarjeta compartible | Canvas 2D propio (1080×1920 PNG) | Determinista; evita los fallos de fuentes de html-to-image. |
| Fuentes | Anton, Inter y JetBrains Mono, autoalojadas con Fontsource | Sin peticiones a Google Fonts. |
| Tests unitarios | Vitest | TDD en `core/`. |
| Tests e2e | Playwright + `@axe-core/playwright` | Verificación real, accesibilidad y privacidad. |
| Calidad | ESLint (flat config, typescript-eslint strict), Prettier, dependency-cruiser | Restricciones duras en CI. |
| CI | GitHub Actions | `pnpm check` + e2e en cada PR. |

---

## 4. Arquitectura

### 4.1 Estructura del repo

```
dorsal/
├── AGENTS.md
├── BRIEF.md
├── docs/
│   ├── feature-map.md        # mapa de features (AGENTS.md, sección 3)
│   ├── export-format.md      # formato real de activities.csv, resultado de H-01
│   ├── glossary.md
│   └── models.md             # modelos usados en gentle-shell
├── odd/tasks/                # documentos de feature de ODD
├── skills/                   # skills del proyecto
├── evals/                    # evals de skills
├── fixtures/
│   ├── generator/            # script que genera activities.csv sintéticos
│   └── generated/            # salida (ignorada por git salvo los pequeños)
├── scripts/verify/           # skill de verificación (Playwright)
├── src/
│   ├── app/                  # rutas, providers, tema, layout
│   ├── core/                 # dominio puro, sin React ni DOM
│   │   ├── model/            # Activity, YearSummary, tipos
│   │   ├── time/             # único sitio donde se crean fechas
│   │   ├── export-reader/    # lectura de activities.csv y filtro de 2026
│   │   └── metrics/          # una función pura por métrica
│   ├── worker/               # entrada del worker y API Comlink
│   ├── features/
│   │   ├── landing/
│   │   ├── upload/
│   │   ├── processing/
│   │   ├── wrapped/          # reproductor de historias + stories/<id>/
│   │   └── share/            # render de la tarjeta y compartir
│   └── shared/               # ui, tokens, i18n, hooks, theme
└── e2e/
```

### 4.2 Flujo de datos

1. El usuario elige `activities.csv` en `/subir`. Validación rápida en el hilo principal: extensión y tamaño.
2. El `File` se pasa al worker (no se copia: es un `Blob`).
3. El worker parsea el CSV fila a fila con Papa Parse y comprueba la cabecera (sección 5.2).
4. **Cada fila se normaliza y se filtra al momento**: si no es de 2026 (sección 5.4) se descarta y solo se suma a un contador. Las filas de otros años nunca se guardan en memoria.
5. Con las `Activity[]` de 2026 calcula las métricas. Va emitiendo progreso.
6. Devuelve un `YearSummary` serializable, validado con Zod: **solo agregados de 2026**, sin filas de actividad ni datos de otros años.
7. El hilo principal termina el worker y pinta las historias desde el `YearSummary`.

### 4.3 Fronteras (las comprueba dependency-cruiser, ver AGENTS.md 5.1)

- `core/` no importa React, DOM, `features/`, `app/` ni `worker/`.
- `core/export-reader/` solo se importa desde `worker/`.
- Una feature solo importa de otra a través de su `index.ts`.
- `features/*` reciben un `YearSummary`; nunca ven `Activity[]`.

---

## 5. Datos de entrada

### 5.1 Cómo consigue el usuario el archivo

1. En Strava: Ajustes › Mi cuenta › Descargar o eliminar tu cuenta › Solicitar archivo. Llega un email con el enlace y puede tardar de horas a días.
2. Descarga el `.zip` y lo descomprime.
3. Sube a Dorsal el archivo `activities.csv`, que está en la raíz del zip.

La landing y la pantalla de subida explican estos tres pasos. En móvil, descomprimir es el paso con más fricción: la guía muestra cómo hacerlo en iOS (app Archivos) y Android.

### 5.2 Lo que sabemos (con fuente) y lo que hay que confirmar

**Confirmado:**
- `activities.csv` está en la raíz del zip de exportación y tiene una fila por actividad.
- Trae **todo el historial** desde que se creó la cuenta (dato de Albert con su propio export).
- Tiene **dos columnas llamadas `Distance`**: una en km o m según el deporte, y otra siempre en metros. Hay que leer por posición, nunca por nombre.
- Algunos números vienen con separador de miles (por ejemplo `1,500` en natación), así que el parser no puede asumir un número limpio.
- La velocidad media solo aparece si hubo un sensor de velocidad.

**Sin confirmar (lo resuelve H-01 con exports reales):**
- Si las cabeceras cambian según el idioma de la cuenta (ES/EN).
- El formato exacto de `Activity Date` y si está en UTC o en hora local. Sin los ficheros GPS no hay otra fuente de hora local, así que esto decide cómo se calcula el año y el arquetipo (sección 5.4).
- Nombre y formato de las columnas de material (`Activity Gear`) y de esfuerzo relativo.
- Separador decimal y de miles según el idioma de la cuenta.
- Tamaño real de un CSV con muchos años (estimación: unos pocos MB).

H-01 deja todo esto escrito en `docs/export-format.md`, y el generador de fixtures lo reproduce. **Ningún CSV real se sube al repo**: Albert usa el suyo en local, fuera de git.

### 5.3 Modelo normalizado (borrador, se cierra en H-02)

```ts
type SportKind = 'run' | 'ride' | 'swim' | 'walk' | 'hike' | 'other'

interface Activity {
  id: string
  startLocal: PlainDateTime        // hora local resuelta en core/time
  sport: SportKind
  sportRaw: string
  distanceM: number | null
  movingTimeS: number
  elapsedTimeS: number
  elevationGainM: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  gear: string | null
}
```

### 5.4 Filtro del año 2026

- Una actividad es de 2026 si su **fecha de inicio en hora local** está entre el 1 ene 2026 00:00 y el 31 dic 2026 23:59:59.
- Si H-01 confirma que `Activity Date` viene en UTC, se convierte a la zona horaria del navegador. Límite conocido: una actividad hecha de viaje en otra zona puede caer en otro día u hora. Se acepta en v1.
- Casos que deben tener test: 31 dic 2025 a las 23:30 (fuera), 1 ene 2026 a las 00:10 (dentro), 31 dic 2026 a las 23:50 (dentro), cambio de hora de marzo y octubre.
- Las filas de otros años **no se guardan**: solo se cuentan para mostrar en el procesado "412 actividades de 2026 (de 1.204 en tu historial)".
- Si no hay ninguna actividad de 2026, se muestra un error propio ("Este archivo no tiene actividades de 2026") y no se abre el wrapped.

---

## 6. Las historias y sus métricas

Cada métrica es una **función pura** en `src/core/metrics/<nombre>.ts` con su `.test.ts` (TDD). Cada historia vive en `src/features/wrapped/stories/<id>/`. Si una historia no tiene datos suficientes, se **omite** y el reproductor ajusta las barras de progreso.

Umbral global: con menos de 5 actividades en 2026 se muestra una versión corta (portada, números y dorsal).

| # | Historia | Métrica (función) | Definición | Se omite si |
|---|---|---|---|---|
| 01 | Portada | (ninguna) | El CSV no trae el nombre: el usuario lo escribe (opcional) en la portada. Solo se guarda en memoria. | Nunca (sin nombre, "Tu año") |
| 02 | Los números | `totals` | Suma de distancia, tiempo en movimiento, nº de actividades, días activos y desnivel. Equivalencias: vueltas de pista = km / 0,4; Everest = desnivel / 8.849 m. Reparto por deporte según tiempo. | Nunca |
| 03 | El perfil de tu año | `monthlyProfile` | Km por mes. Mes máximo = "Puerto HC". Mes mínimo = "valle". Remontada = máximo posterior al valle / valle. | Menos de 3 meses con actividad |
| 04 | Constancia | `dailyHeatmap`, `longestStreak`, `favoriteWeekday` | Intensidad diaria en 4 niveles por cuartiles de tiempo. Racha = días consecutivos con actividad. Día favorito = día de la semana presente en más semanas. | Nunca |
| 05 | Tu arquetipo | `archetype` | Reglas deterministas (tabla 6.1). Incluye la distribución de horas de inicio en 24 franjas. | Menos de 10 actividades |
| 06 | Tu material | `gearOfTheYear` | Km y horas por material (`Activity Gear`). Ver 6.2. | Menos del 30 % del tiempo con material asignado |
| 07 | El año en latidos | `heartbeats` | Σ (FC media × tiempo en movimiento en min) de las actividades con pulso. Pico = FC máxima del año con su fecha. Equivalencia: días de reposo a 60 ppm. | Menos del 30 % del tiempo con pulso |
| 08 | Tu dorsal | `bibCard` | Número = km totales redondeados. Nombre, arquetipo, 3 datos y mini perfil del año. | Nunca |

### 6.1 Arquetipos (v1)

Se evalúan en orden. El primero que cumple da el nombre principal; el siguiente, un rasgo secundario.

| Arquetipo | Regla |
|---|---|
| Madrugador | ≥ 50 % de inicios antes de las 8:00 |
| Búho | ≥ 40 % de inicios después de las 20:00 |
| Guerrero de fin de semana | ≥ 60 % del tiempo en sábado y domingo |
| Metódico | Actividad ≥ 4 días en ≥ 70 % de las semanas con actividad |
| Multideporte | ≥ 3 deportes con ≥ 10 % del tiempo cada uno |
| Fondista | Mediana de duración ≥ 75 min |
| Constante | Fallback |

Género gramatical: el usuario elige en la portada cómo quiere que se le nombre (madrugadora / madrugador / forma neutra). Se guarda solo en memoria.

### 6.2 Tu material

La historia 06 sustituye a "Tu firma" del diseño: esa historia necesitaba los ficheros GPS, que ya no leemos.

1. Agrupa las actividades de 2026 por `Activity Gear` (sin material, al grupo "sin asignar", que no se muestra).
2. Por cada material: km, horas y nº de actividades de 2026.
3. Material estrella = el de más horas. Se muestra con su nombre tal cual lo escribió el usuario.
4. Aviso para zapatillas con más de 800 km **en 2026**: "Toca jubilarlas". El CSV solo da los km del año que contamos, no la vida total de la zapatilla, así que el texto lo deja claro.
5. Si el deporte principal es bici, se muestran bicis en lugar de zapatillas.

### 6.3 Backlog v1.1 (no entra en v1)

- El día más duro (columna de esfuerzo relativo, si H-01 confirma que existe).
- Distancias geográficas ("has corrido de Alicante a París").
- Interfaz en inglés.

---

## 7. Diseño y UX

- Fuente de verdad visual: el canvas enlazado arriba. Tokens: tinta `#0F100D`, hueso `#F2F0E9`, blanco `#FFFFFF`, naranja `#FC5200`, naranja texto `#C23F00`. Tipografías: Anton (display), Inter (texto), JetBrains Mono (etiquetas y datos).
- **Reproductor de historias:** tocar a la derecha avanza y a la izquierda retrocede, mantener pulsado pausa, flechas del teclado, barras de progreso arriba, botón cerrar. Avance automático cada 7 s salvo con `prefers-reduced-motion`.
- Accesibilidad: contraste AA, objetivos táctiles ≥ 44 px, navegación completa por teclado, `aria-label` en botones de icono y texto alternativo en cada gráfico. axe sin violaciones serias ni críticas.
- Estados de error con copy propio: no es un CSV, el CSV no es de Strava (faltan columnas), han subido el `.zip` en vez del CSV (se explica cómo sacar el CSV), sin actividades en 2026, filas corruptas (se ignoran y se avisa), navegador sin soporte.
- Rendimiento (gama media, objetivo inicial que H-12 ajusta): CSV de 10.000 actividades procesado en menos de 2 s sin bloquear la UI; historias a 60 fps.

---

## 8. Privacidad y seguridad (requisitos duros)

| Requisito | Cómo se garantiza |
|---|---|
| Cero peticiones de red con datos | Lint que prohíbe `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` y `navigator.sendBeacon` en `src/`. Test e2e `@privacy` que registra todas las peticiones tras elegir el archivo y exige cero. |
| CSP estricta | `netlify.toml` con `connect-src 'self'`, sin orígenes externos. Un test comprueba la cabecera en el deploy preview. |
| Nada persistido | Lint que prohíbe `localStorage`, `sessionStorage` e `indexedDB` fuera de `src/shared/theme/storage.ts`. |
| Solo 2026 sale del worker | El schema Zod de `YearSummary` solo admite agregados de 2026, sin filas de actividad. Test que sube un CSV de 10 años y comprueba que ningún dato de otro año llega al hilo principal. |
| Sin exports reales en git | `.gitignore` de `*.csv` y `*.zip` fuera de `fixtures/generated/` y check en CI. |

---

## 9. Hitos

Cada hito es un **documento de feature ODD** (`odd/tasks/<id>-<slug>.md`, sección 10). Las olas agrupan hitos que se pueden autorizar juntos. Dentro de una ola, los hitos con superficies de edición disjuntas pueden ir en paralelo.

| ID | Hito | Superficie de edición | Criterios de aceptación | Ola |
|---|---|---|---|---|
| H-00 | Bootstrap | raíz, `src/app`, `src/shared`, CI, `scripts/verify`, `docs/` | `pnpm check` en verde, `pnpm verify` abre la app y guarda captura, deploy preview en Netlify, reglas de lint de la sección 8 activas, `docs/feature-map.md` creado. | 1 |
| H-01 | **Gate de datos (go/no-go)** | `docs/export-format.md`, `fixtures/generator` | Formato real de `activities.csv` documentado con al menos un CSV de cuenta en ES y otro en EN, incluida la zona horaria de `Activity Date`. Generador de fixtures que lo reproduce. Si el formato impide alguna historia, se registra y Albert decide. **Bloquea H-02.** | 1 |
| H-02 | Lector del CSV y filtro 2026 | `src/core/export-reader`, `src/core/model`, `src/core/time` | Parsea todos los fixtures. Tests con columnas duplicadas, separadores de miles, filas corruptas, historial de 10 años y todos los casos límite de la sección 5.4. | 2 |
| H-03 | Métricas | `src/core/metrics` | Una función por métrica de la sección 6, con TDD. Schema Zod de `YearSummary`. | 2 |
| H-04 | Landing | `src/features/landing` | Fiel al canvas en claro y oscuro, 390 px y 1440 px, axe sin errores. | 2 |
| H-05 | Worker y progreso | `src/worker`, `src/features/processing` | Progreso real por fases, cancelable, UI fluida durante el procesado (sin long tasks > 50 ms en el hilo principal). | 3 |
| H-06 | Subida y errores | `src/features/upload` | Todos los estados de error de la sección 7 con su e2e. | 3 |
| H-07 | Reproductor de historias | `src/features/wrapped/player` | Gestos, teclado, pausa, barras, omisión de historias y movimiento reducido. | 3 |
| H-08 | Historias 01 a 04 | `src/features/wrapped/stories/{01..04}` | Capturas de `pnpm verify` en claro y oscuro con 3 fixtures distintos. | 4 |
| H-09 | Historia 06: Tu material | `src/core/metrics/gear-of-the-year`, `stories/06` | Fixtures con zapatillas, con bici y sin material. Aviso de 800 km con test. | 4 |
| H-10 | Historias 05 y 07 | `stories/05`, `stories/07` | Las reglas de arquetipo cubiertas con un fixture por arquetipo. | 4 |
| H-11 | Dorsal y compartir | `src/features/share`, `stories/08` | PNG 1080×1920 idéntico entre ejecuciones (test de snapshot). Web Share con fichero en móvil y descarga en escritorio. | 5 |
| H-12 | Endurecimiento y lanzamiento | transversal | Test `@privacy` en verde, CSP en producción, Lighthouse ≥ 90 en rendimiento y accesibilidad, Open Graph, checklist de lanzamiento. | 5 |

---

## 10. Metodología: ODD + RDD con gentle-ai / gentle-shell

Trabajamos con el ecosistema **gentle-ai** de Gentleman Programming, usando **gentle-shell** (el workspace para Pi) como entorno de los agentes.

### 10.1 ODD (Organic Driven Development)

ODD es el flujo por defecto de gentle-ai desde la v3. Fases por petición: **Authorize, Explore, Resolve uncertainty, Classify, Track (antes de la primera escritura), Implement y Close**.

- El trabajo pequeño se resuelve en línea. El sustancial tiene **un único documento de feature** en `odd/tasks/<id>-<slug>.md`, reflejado en Engram (`odd/<id>-<slug>/tasks`) para sobrevivir a interrupciones.
- Un cambio de alcance aceptado actualiza intención y tareas a la vez: se conserva lo completado válido, se añaden tareas y se reabren con motivo las invalidadas.
- **TDD activado** en `src/core/`: RED observado, GREEN, REFACTOR, con Vitest. En `src/features/` la aceptación es e2e con Playwright más la verificación de `AGENTS.md`.
- La delegación a subagentes solo ocurre con motivo: exploración, escritores en paralelo con superficies disjuntas, relevo por sesión larga o verificador independiente.

**Cómo encaja este brief en ODD:**

| Este brief | ODD |
|---|---|
| Un hito (`H-03`) | Una feature con su documento en `odd/tasks/` |
| Una ola | Un lote que Albert autoriza en Authorize |
| Criterios de aceptación | Checklist con IDs estables dentro del documento |
| Superficie de edición | Lo que permite lanzar escritores en paralelo sin solaparse |
| Secciones 5.2 (sin confirmar) y 13 | Resolve uncertainty |

**Plantilla del documento de feature:**

````markdown
# <ID>: <título>

## Objetivo
## Problema y motivo
## Alcance
- Dentro:
- Fuera:
## Restricciones
Requisitos de las secciones 2, 4.3 y 8 que aplican.
## Superficie de edición
## Checklist
- [ ] <ID>.1 ... · Criterio: ...
## Evidencia de verificación
Salida de `pnpm check`, capturas y logs de `pnpm verify`.
## Progreso
## Siguiente paso
## Log
Cambios de alcance aceptados y su motivo.
````

### 10.2 RDD (Receipt-Driven Development)

RDD es la revisión nativa de gentle-ai: **activada por defecto** y se desactiva con `gentle-ai review mode disable`. En este proyecto se queda **activada**.

- Tras cada commit de unidad de trabajo, gentle-shell evalúa el cambio. La revisión congela el candidato y liga las evidencias a Git, no a lo que cuenta el agente. La profundidad depende del riesgo.
- Un hallazgo de revisión no amplía el alcance por sí solo: si hace falta, se registra en el documento de la feature.
- Las evidencias que pide `AGENTS.md` (capturas, logs de red, salida de tests) forman parte del recibo.

**Revisión propia tras cada implementación.** Como RDD puede no revisar a fondo un cambio de riesgo bajo, añadimos una capa nuestra: al cerrar cada hito, **un agente distinto** del que implementó revisa el diff buscando optimizaciones, refactors y violaciones de `AGENTS.md`. Sus hallazgos van al documento de la feature antes del PR.

**Cambios de alto riesgo** (siempre con verificador independiente): todo lo que toque la sección 8 (red, persistencia, filtro de 2026), `core/export-reader`, `core/time` y la CSP.

### 10.3 Git

- Ramas: `main` ← `dev` ← `feature/<id>-<slug>` y `fix/<slug>`.
- Los agentes crean la rama desde `dev`, hacen commits atómicos con Conventional Commits (`feat(metrics): add longest streak`), push y abren **PR contra `dev`** de forma automática.
- **Ningún agente hace merge.** Albert revisa y mergea los PR a `dev`.
- **`dev` → `main` lo hace siempre Albert a mano.** Ningún agente toca `main`.
- Sin force-push a `dev` ni a `main`.

### 10.4 Antes de empezar

```bash
# gentle-ai
brew install gentleman-programming/tap/gentle-ai
gentle-ai --version
gentle-ai sync                 # tras cada actualización
gentle-ai review mode status   # debe decir enabled

# gentle-shell (paquete gentle-pi)
npm i -g gentle-pi
gentle-shell
# dentro: /gentle:status y /gentle:doctor
```

El comportamiento de ODD y RDD cambia entre versiones. En H-00 el agente comprueba la versión instalada, lee su documentación y anota en `docs/models.md` la versión y los modelos configurados.

---

## 11. Definición de "v1 terminada"

- Las 8 historias funcionan con los fixtures y con el `activities.csv` real de Albert (en local), mostrando solo 2026.
- `pnpm check`, e2e y `@privacy` en verde en `dev` y en `main`.
- Desplegada en producción desde `main` con la CSP activa.
- Probada en Safari iOS y Chrome Android reales, con capturas en el PR de H-12.

---

## 12. Fuera de alcance en v1

- Backend, cuentas, base de datos o cualquier almacenamiento de datos del usuario.
- Integración por API u OAuth con Strava.
- Leer el `.zip` completo, `profile.csv` o los ficheros GPS (FIT, GPX, TCX). Por tanto, nada de mapas ni rutas.
- Exports de Garmin, Coros, Polar u otras plataformas.
- Cualquier año distinto de 2026, incluida la comparativa con años anteriores.
- Monetización.

---

## 13. Decisiones abiertas (Albert)

1. Nombre definitivo y dominio. "Dorsal" es de trabajo: comprobar disponibilidad de dominio y marca antes de H-12.
2. Confirmar Netlify como hosting.
3. Si en v1.1 se añade analítica sin cookies, o se queda en cero.
4. Copy final de los arquetipos y de los textos de las historias.
5. Riesgo de marca: el naranja `#FC5200` es casi el de Strava (`#FC4C02`). Decisión tomada: se mantiene. Revisar si algún día hay un requerimiento.
6. Aceptar también el `.zip` y sacar de él solo `activities.csv`, para ahorrar al usuario descomprimir en el móvil. Por defecto, no.
7. El diseño hay que actualizarlo antes de H-04: la landing y la subida hablan del `.zip`, y la historia 06 pasa de "Tu firma" a "Tu material".

---

## 14. Fuentes

- Year in Sport pasa a ser de pago (Ars Technica, dic 2025): https://arstechnica.com/culture/2025/12/strava-puts-popular-year-in-sport-recap-behind-an-80-paywall/
- Cómo pedir el archivo y estructura del zip: https://trevordavies095.github.io/tempo/user-guide/bulk-import y https://martin-ueding.github.io/geo-activity-playground/moving-from-strava
- Dos columnas `Distance` y separador de miles en `activities.csv`: https://forum.intervals.icu/t/import-all-data-from-strava/81068?page=2
- Velocidad media solo con sensor: https://redback-operations.github.io/redback-documentation/docs/project-3/research/strava-bulk-export-data-description
- gentle-ai (ODD, RDD activado por defecto): https://github.com/Gentleman-Programming/gentle-ai
- gentle-ai v3.0.0 (ODD por defecto): https://newreleases.io/project/github/Gentleman-Programming/gentle-ai/release/v3.0.0
- gentle-shell / gentle-pi: https://github.com/Gentleman-Programming/gentle-pi
