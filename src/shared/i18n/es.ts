import { formatNumber } from '../format'

const EMPTY = ''

export const es = {
  brand: {
    name: 'Dorsal',
    chip: '26',
    home: 'Volver al inicio',
    tagline: 'Tu temporada 2026',
  },
  theme: {
    label: 'Tema',
    system: 'Sistema',
    light: 'Claro',
    dark: 'Oscuro',
  },
  privacy: {
    banner: 'Se procesa en tu navegador. Tu archivo no sale de tu dispositivo.',
  },
  footer: {
    disclaimer: 'Dorsal no está afiliado a Strava ni cuenta con su respaldo.',
  },
  a11y: {
    skipToContent: 'Saltar al contenido',
  },
  sports: {
    run: 'Carrera a pie',
    ride: 'Bici',
    swim: 'Natación',
    walk: 'Caminata',
    hike: 'Senderismo',
    other: 'Otro',
  },
  months: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  monthsAbbr: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  monthsShort: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  landing: {
    navAriaLabel: 'Principal',
    navHow: 'Cómo funciona',
    navPrivacy: 'Privacidad',
    navFaq: 'Preguntas',
    headerCta: 'Crear mi Dorsal',
    eyebrow: 'Resumen deportivo 2026 · Gratis',
    title: 'Tu año entero, en un dorsal.',
    subtitle:
      'Sube el activities.csv de la exportación de tu cuenta de Strava y te devolvemos tu 2026 contado como una carrera: tus kilómetros, tu perfil de etapa, tus rachas y un dorsal listo para compartir. Sin registro ni suscripción.',
    cta: 'Subir mi activities.csv',
    secondary: '¿Cómo lo descargo?',
    privacyNote: 'Se procesa en tu navegador. Tu archivo no sale de tu dispositivo.',
    exampleLabel: 'Ejemplo',
    card: {
      seasonLabel: 'Temporada 2026',
      kmLabel: 'km',
      km: '3214',
      name: 'Javier A.',
      stats: [
        { value: '412', label: 'Activ.' },
        { value: '287 h', label: 'En movimiento' },
        { value: '41.380', label: 'm desnivel' },
      ],
      everestValue: '4,7×',
      everestLabel: 'Everest de desnivel',
      streakLabel: 'Racha más larga',
      streakValue: '23 días',
    },
    steps: {
      eyebrow: 'Cómo funciona',
      title: 'Tres pasos. Cero cuentas.',
      description:
        'No hace falta registrarse ni conectar nada. Solo el archivo que Strava ya te da gratis.',
      items: [
        {
          title: 'Pide tu archivo',
          body: 'En Strava, entra en Ajustes › Mi cuenta › Descargar o eliminar tu cuenta y pulsa «Solicitar archivo». Te llega un email con el enlace; puede tardar unas horas.',
        },
        {
          title: 'Súbelo aquí',
          body: 'Descomprime el archivo que te llega y sube aquí activities.csv, el que está en la raíz. Trae todo tu historial, pero solo contamos tus actividades de 2026.',
        },
        {
          title: 'Recibe tu Dorsal',
          body: 'Ocho historias sobre tu temporada y una tarjeta en formato vertical para Instagram, WhatsApp o donde quieras.',
        },
      ],
    },
    previews: {
      eyebrow: 'Lo que vas a ver',
      title: 'Tu temporada, por etapas.',
      description:
        'Cada historia sale de tus datos reales. Si no corres, no hablamos de ritmos: se adapta a tu deporte.',
      listAriaLabel: 'Las ocho historias de tu temporada',
      yearArt: '2026',
      archetypeArt: '¿Quién eres?',
      materialArt: '842 km',
      items: [
        {
          number: '01',
          title: 'La portada',
          description: 'Tu número de temporada, con tu nombre si quieres.',
        },
        { number: '02', title: 'Los números', description: 'Kilómetros, horas y Everests.' },
        {
          number: '03',
          title: 'El perfil de tu año',
          description: 'Tus meses como una etapa de montaña.',
        },
        {
          number: '04',
          title: 'Constancia',
          description: 'Los 365 días, uno a uno, y tu mejor racha.',
        },
        {
          number: '05',
          title: 'Tu arquetipo',
          description: '¿Madrugador metódico o guerrero de fin de semana?',
        },
        {
          number: '06',
          title: 'Tu material',
          description: 'Las zapatillas y la bici que te llevaron.',
        },
        {
          number: '07',
          title: 'El año en latidos',
          description: 'Cuántas veces latió tu corazón entrenando.',
        },
        { number: '08', title: 'Tu dorsal', description: 'El número y la tarjeta para compartir.' },
      ],
    },
    privacyStrip: {
      title: 'Tu archivo no viaja a ningún servidor.',
      items: [
        {
          title: 'Todo pasa en tu navegador',
          body: 'El archivo se lee y se calcula en tu dispositivo. Al cerrar la pestaña no queda nada.',
        },
        {
          title: 'Sin registro ni email',
          body: 'No pedimos cuenta, ni contraseña de Strava, ni permisos. Solo el archivo.',
        },
        {
          title: 'Solo 2026',
          body: 'Leemos tu historial entero, pero solo contamos tus actividades de 2026. El resto se descarta en tu navegador.',
        },
      ],
    },
    faq: {
      eyebrow: 'Preguntas',
      title: 'Lo que todo el mundo pregunta',
      items: [
        {
          question: '¿Qué archivo tengo que subir?',
          answer:
            'Siempre activities.csv. El envío de Strava llega comprimido en un .zip. Descomprímelo y sube el archivo activities.csv, que está en la raíz.',
        },
        {
          question: '¿Necesito Strava de pago?',
          answer:
            'No. La exportación de datos está disponible para cualquier cuenta, gratuita o de pago.',
        },
        {
          question: '¿Por qué no me llega el archivo al momento?',
          answer:
            'Strava lo prepara y te lo envía por email. Si llevas muchos años registrando actividades, puede tardar varias horas.',
        },
        {
          question: '¿Se guardan mis datos en algún sitio?',
          answer:
            'No. Se procesa en tu navegador y se descarta al cerrar la pestaña. Solo se guarda en tu dispositivo la imagen que tú decidas descargar.',
        },
        {
          question: '¿Vale para bici, natación o trail?',
          answer:
            'Sí. Las historias se adaptan a tu deporte principal y te enseñan el reparto entre todos los que practiques.',
        },
        {
          question: '¿Es una app oficial de Strava?',
          answer:
            'No. Dorsal es un proyecto independiente y no tiene ninguna relación con Strava, Inc.',
        },
      ],
    },
    footer: {
      madeWith: '© 2026 Dorsal · Hecho por corredores, para corredores.',
      navAriaLabel: 'Pie de página',
      howLink: 'Cómo funciona',
      ctaLink: 'Subir mi activities.csv',
    },
  },
  upload: {
    title: 'Sube tu archivo de Strava',
    subtitle: 'Solo necesitamos un archivo: activities.csv.',
    howto: {
      title: '¿Aún no tienes el archivo?',
      steps: [
        'En Strava, entra en Ajustes › Mi cuenta › Descargar o eliminar tu cuenta.',
        'Pide el archivo y espera el email con el enlace: puede tardar horas o días.',
        'Descomprime el archivo que te llega y quédate con activities.csv, el que está en la raíz.',
        'Súbelo aquí. Trae todo tu historial, pero solo usamos las actividades de 2026.',
      ],
    },
    pickFile: 'Elegir activities.csv',
    dropHere: 'o arrástralo aquí',
    hint: 'Solo aceptamos activities.csv, de hasta 50 MB.',
    retry: 'Volver a elegir otro archivo',
    errors: {
      extensionTitle: 'Este archivo no es un CSV',
      extensionBody:
        'Solo aceptamos activities.csv. Si tu exportación llegó comprimida, descomprímela y elige activities.csv, el archivo que está en la raíz.',
      sizeTitle: 'El archivo es demasiado grande',
      sizeBody:
        'El límite es de 50 MB y tu archivo lo supera. Comprueba que has elegido activities.csv y no la exportación completa.',
      zipTitle: 'Ese es el archivo comprimido, no el CSV',
      zipBody:
        'Dorsal necesita activities.csv, que va dentro del archivo comprimido de la exportación. Descomprímelo en tu dispositivo y elige activities.csv, el que está en la raíz.',
      notStravaTitle: 'Este CSV no parece de Strava',
      notStravaBody:
        'La primera fila no tiene las columnas de activities.csv. Comprueba que has elegido el archivo de tu exportación y vuelve a intentarlo.',
      noSeasonTitle: 'Este archivo no tiene actividades de 2026',
      noSeasonBody:
        'Comprueba que has elegido el archivo de tu exportación y vuelve a intentarlo. Si entrenaste en 2026, revisa que el archivo incluye ese año.',
      unsupportedTitle: 'Tu navegador no puede leer el archivo',
    },
  },
  processing: {
    title: 'Preparando tu temporada…',
    phaseReading: 'Leyendo tu archivo…',
    phaseComputing: 'Calculando tus números…',
    phaseDone: 'Listo',
    seenRowsLabel: 'Filas leídas',
    keptRowsLabel: 'Actividades de 2026',
    cancel: 'Cancelar',
    errorTitle: 'No pudimos procesar el archivo',
    errorUnreadable:
      'No se pudo leer el archivo. Comprueba que es el activities.csv de la exportación y vuelve a intentarlo.',
    errorGeneric: 'Algo falló al procesar el archivo. Vuelve a intentarlo.',
    back: 'Volver a intentarlo',
  },
  result: {
    title: 'Tu temporada 2026',
    subtitle: 'Aquí irán las ocho historias y tu dorsal.',
    kilometres: 'Kilómetros',
    movingTime: 'Tiempo en movimiento',
    activities: 'Actividades',
    activeDays: 'Días activos',
    elevation: 'Desnivel positivo (m)',
    provisional: 'Pantalla provisional.',
    openPlayer: 'Ver mi temporada en historias',
  },
  player: {
    close: 'Cerrar las historias',
    zoneNext: 'Siguiente historia',
    zonePrevious: 'Historia anterior',
    progressLabel: 'Progreso de las historias',
  },
  stories: {
    '01-portada': {
      title: 'La portada',
      seasonLabel: 'Temporada',
      year: '2026',
      kilometresLabel: 'Kilómetros',
      greeting: 'tu año ya tiene dorsal.',
      greetingStandalone: 'Tu año ya tiene dorsal.',
      introPlural: 'salidas después, toca mirar atrás. Son ocho etapas.',
      introSingular: 'salida después, toca mirar atrás. Son ocho etapas.',
      nameLabel: '¿Cómo quieres que te llamemos?',
      namePlaceholder: 'Tu nombre o apodo (opcional)',
    },
    '02-numeros': {
      title: 'Los números',
      intro: 'Este año has recorrido',
      kilometresLabel: 'Kilómetros',
      lapsLead: 'Son',
      lapsUnit: 'vueltas',
      lapsUnitSingular: 'vuelta',
      lapsTail: 'a una pista de 400 metros. Por calle 1, sin saltarte ninguna.',
      movingTimeLabel: 'En movimiento',
      activitiesLabel: 'Actividades',
      activeDaysSuffix: 'días distintos',
      elevationLabel: 'De desnivel positivo',
      everestUnit: 'Everest',
      everestAria: 'veces el Everest',
      sportSplitTitle: 'Reparto por deporte',
      sportSplitAriaLead: 'Reparto del tiempo en movimiento por deporte:',
    },
    '03-perfil': {
      title: 'El perfil de tu año',
      subtitle:
        'Si tu temporada fuera una etapa de montaña, este sería su perfil. Kilómetros por mes.',
      peakBadge: 'HC',
      peakLabel: 'Puerto de',
      valleyLabel: 'Valle de',
      valleyBody: 'Tu mes más flojo del año.',
      comebackLabel: 'Remontada',
      comebackBody: 'Después del valle, multiplicaste tu volumen.',
      profileAriaLead: 'Kilómetros por mes:',
      unitKm: 'km',
    },
    '04-constancia': {
      title: 'Constancia',
      intro: 'Días con actividad',
      activeDaysSuffix: 'de 365 días',
      heatmapAria:
        'Calendario de 2026: un cuadrado por cada día con actividad; el color indica el tiempo en movimiento en cuatro niveles.',
      legendLess: 'Menos tiempo',
      legendMore: 'Más tiempo',
      streakUnit: 'días seguidos',
      streakUnitSingular: 'día seguido',
      streakFrom: 'del',
      streakTo: 'al',
      streakDe: 'de',
      streakTail: 'Tu racha más larga.',
      weekdayLead: 'es tu día favorito: presente en',
      weekSingular: 'semana',
      weekPlural: 'semanas',
    },
    '06-material': {
      title: 'Tu material',
      eyebrow: 'Etapa 6 · Tu material',
      starLead: {
        shoes: 'La zapatilla que más te llevó.',
        bikes: 'La bici que más te llevó.',
      },
      hoursLabel: 'En movimiento',
      rankingLabel: 'Todo tu material, de más a menos horas.',
      retirementBadge: 'Toca jubilarlas',
      retirementNote: 'Más de 800 km en 2026: el export solo cuenta esta temporada.',
      rowActivitySingular: 'actividad',
      rowActivityPlural: 'actividades',
    },
  },
  notFound: {
    title: 'Esta página no existe',
    cta: 'Volver al inicio',
  },
} as const

/**
 * Copy for the refusal to open the wrapped when no activity survived the 2026
 * filter, with the real counts of the run (BRIEF §5.4).
 */
export function uploadNoSeasonMessage(totalRows: number): string {
  return `Leímos ${formatNumber(totalRows)} actividades y ninguna es de 2026.`
}

/** List with the Spanish joining, e.g. `[Worker, FileReader]` → "Worker y FileReader". */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join(EMPTY)
  }
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1] ?? EMPTY}`
}

/** Copy for the unsupported-browser state, naming each missing API. */
export function uploadUnsupportedMessage(missing: readonly string[]): string {
  return `Para leer el archivo en tu dispositivo, a tu navegador le falta ${joinAnd(missing)}. Actualiza el navegador o prueba con otro y vuelve a intentarlo.`
}

/** Copy for the warning about rows that could not be read and were ignored. */
export function resultCorruptWarning(corruptRows: number): string {
  return `Ignoramos ${formatNumber(corruptRows)} filas que no pudimos leer. Los números cuentan solo las actividades válidas.`
}
