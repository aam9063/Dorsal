export const es = {
  brand: {
    name: 'Dorsal',
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
  landing: {
    eyebrow: 'Resumen deportivo 2026 · Gratis',
    title: 'Tu año entero, en un dorsal.',
    subtitle:
      'Sube el activities.csv de la exportación de tu cuenta de Strava y te devolvemos tu 2026 contado como una carrera. Sin registro, sin suscripción y sin que el archivo salga de tu dispositivo.',
    cta: 'Subir mi activities.csv',
    provisional: 'Portada provisional. La portada definitiva se construye en el hito H-04.',
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
    provisional:
      'Selector de archivo provisional. La subida real, con validación y estados de error, se construye en H-06.',
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
    provisional: 'Pantalla provisional. El reproductor de historias se construye en H-07.',
  },
  notFound: {
    title: 'Esta página no existe',
    cta: 'Volver al inicio',
  },
} as const
