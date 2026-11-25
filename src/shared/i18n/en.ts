import type { Messages } from './es'
import { formatNumber } from '../format'

const EMPTY = ''

/**
 * The English copy, satisfying the shape `es.ts` defines. The translation
 * follows the Spanish tone — direct, no marketing fill — and keeps the
 * metric units and the `h`/`min` duration shape: both are unambiguous in
 * English, and rewording them would change what every story and card prints
 * (odd/tasks/i18n-english.md, S6). Only grouping and decimal marks differ
 * (`1,451.4 km`), because `src/shared/format.ts` follows the active locale.
 */
export const en: Messages = {
  brand: {
    name: 'Dorsal',
    chip: '26',
    home: 'Back to the start',
    tagline: 'Your 2026 season',
  },
  theme: {
    label: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  language: {
    label: 'Language',
    es: 'Español',
    en: 'English',
  },
  privacy: {
    banner: 'Processed in your browser. Your file never leaves your device.',
  },
  footer: {
    disclaimer: 'Dorsal is not affiliated with Strava, Inc. or endorsed by it.',
  },
  a11y: {
    skipToContent: 'Skip to content',
  },
  sports: {
    run: 'Running',
    ride: 'Cycling',
    swim: 'Swimming',
    walk: 'Walking',
    hike: 'Hiking',
    other: 'Other',
  },
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsAbbr: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  monthsShort: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  weekdays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  landing: {
    navAriaLabel: 'Main',
    navHow: 'How it works',
    navPrivacy: 'Privacy',
    navFaq: 'Questions',
    headerCta: 'Create my Dorsal',
    // Still read by scripts/og-image (generated-asset copy); never rendered as
    // a kicker above a heading on the landing (odd/tasks/redesign-objeto-dorsal.md, S6).
    eyebrow: 'Your 2026 sports recap · Free',
    // Editorial spine and numbered header bands of the redesign.
    spineLabel: 'Dorsal · 2026 season',
    heroMeta: 'Object · The season race card',
    stepsMeta: 'How it works · Three steps',
    previewsMeta: 'What you will see · Your season, stage by stage',
    privacyMeta: 'Privacy · No servers',
    faqMeta: 'Questions · The essentials',
    title: 'Your year in sport, on one Dorsal.',
    subtitle:
      'Upload the activities.csv from your Strava account export and we return your 2026 told like a race: your kilometers, your stage profile, your streaks and a race card ready to share. No account, no subscription.',
    cta: 'Upload my activities.csv',
    secondary: 'How do I download it?',
    privacyNote: 'Processed in your browser. Your file never leaves your device.',
    exampleLabel: 'Example',
    card: {
      seasonLabel: '2026 season',
      kmLabel: 'km',
      km: '3,214',
      name: 'Javier A.',
      stats: [
        { value: '412', label: 'Activ.' },
        { value: '287 h', label: 'Moving' },
        { value: '41,380', label: 'm of climbing' },
      ],
      everestValue: '4.7×',
      everestLabel: 'Everests of climbing',
      streakLabel: 'Longest streak',
      streakValue: '23 days',
    },
    steps: {
      title: 'Three steps. No accounts.',
      description:
        'No sign-up and nothing to connect. Only the file Strava already gives you for free.',
      items: [
        {
          title: 'Request your file',
          body: 'In Strava, open Settings › My account › Download or delete your account and press "Request export". You get an email with the link; it can take a few hours.',
        },
        {
          title: 'Upload it here',
          body: 'Unpack the archive and upload activities.csv here, the one at the root. It carries your whole history, but we only count your 2026 activities.',
        },
        {
          title: 'Get your Dorsal',
          body: 'Eight stories about your season and a portrait card for Instagram, WhatsApp or wherever you like.',
        },
      ],
    },
    previews: {
      title: 'Your season, stage by stage.',
      description:
        'Every story comes from your real data. If you do not run, we skip the pace talk: it adapts to your sport.',
      listAriaLabel: 'The eight stories of your season',
      stageTag: 'Stage',
      yearArt: '2026',
      archetypeArt: 'Who are you?',
      materialArt: '842 km',
      items: [
        {
          number: '01',
          title: 'The cover',
          description: 'Your number of the season, with your name if you want.',
        },
        { number: '02', title: 'The numbers', description: 'Kilometers, hours and Everests.' },
        {
          number: '03',
          title: 'Your year’s profile',
          description: 'Your months as a mountain stage.',
        },
        {
          number: '04',
          title: 'Consistency',
          description: 'All 365 days, one by one, and your best streak.',
        },
        {
          number: '05',
          title: 'Your archetype',
          description: 'Methodical early bird or weekend warrior?',
        },
        {
          number: '06',
          title: 'Your gear',
          description: 'The shoes and the bike that carried you.',
        },
        {
          number: '07',
          title: 'The year in heartbeats',
          description: 'How many times your heart beat while training.',
        },
        { number: '08', title: 'Your Dorsal', description: 'The number and the card to share.' },
      ],
    },
    privacyStrip: {
      title: 'Your file never travels to a server.',
      items: [
        {
          title: 'Everything happens in your browser',
          body: 'The file is read and computed on your device. Close the tab and nothing remains.',
        },
        {
          title: 'No sign-up, no email',
          body: 'We ask for no account, no Strava password, no permissions. Only the file.',
        },
        {
          title: 'Only 2026',
          body: 'We read your whole history, but only count your 2026 activities. The rest is discarded in your browser.',
        },
      ],
    },
    faq: {
      title: 'Before you upload your file',
      items: [
        {
          question: 'Which file do I have to upload?',
          answer:
            'Always activities.csv. The Strava export arrives compressed in a .zip. Unzip it and upload the activities.csv file, the one at the root.',
        },
        {
          question: 'Do I need a paid Strava plan?',
          answer: 'No. The data export is available to any account, free or paid.',
        },
        {
          question: 'Why is the file not there immediately?',
          answer:
            'Strava prepares it and sends it to you by email. If you have been logging activities for many years, it can take several hours.',
        },
        {
          question: 'Is my data stored anywhere?',
          answer:
            'No. It is processed in your browser and discarded when you close the tab. The only thing kept on your device is the image you choose to download.',
        },
        {
          question: 'Does it work for cycling, swimming or trail?',
          answer:
            'Yes. The stories adapt to your main sport and show how you split your time across all of them.',
        },
        {
          question: 'Is this an official Strava app?',
          answer: 'No. Dorsal is an independent project and has no relationship with Strava, Inc.',
        },
      ],
    },
    footer: {
      madeWith: '© 2026 Dorsal · Made by athletes, for athletes.',
      navAriaLabel: 'Footer',
      howLink: 'How it works',
      ctaLink: 'Upload my activities.csv',
    },
  },
  upload: {
    title: 'Upload your Strava file',
    subtitle: 'We only need one file: activities.csv.',
    meta: 'Upload · Your activities.csv',
    errorMeta: 'Error · Check the file',
    howto: {
      title: 'Still do not have the file?',
      steps: [
        'In Strava, open Settings › My account › Download or delete your account.',
        'Request the export and wait for the email with the link: it can take hours or days.',
        'Unpack the archive and keep activities.csv, the one at the root.',
        'Upload it here. It carries your whole history, but we only use the 2026 activities.',
      ],
    },
    pickFile: 'Choose activities.csv',
    dropHere: 'or drop it here',
    hint: 'We only accept activities.csv, up to 50 MB.',
    retry: 'Choose a different file',
    errors: {
      extensionTitle: 'This file is not a CSV',
      extensionBody:
        'We only accept activities.csv. If your export arrived compressed, unzip it and choose activities.csv, the file at the root.',
      sizeTitle: 'The file is too large',
      sizeBody:
        'The limit is 50 MB and your file exceeds it. Check that you picked activities.csv and not the complete export.',
      zipTitle: 'That is the archive, not the CSV',
      zipBody:
        'Dorsal needs activities.csv, which sits inside the compressed export archive. Unzip it on your device and choose activities.csv, the one at the root.',
      notStravaTitle: 'This CSV does not look like a Strava export',
      notStravaBody:
        'The first row does not have the activities.csv columns. Check that you picked the file from your export and try again.',
      noSeasonTitle: 'This file has no 2026 activities',
      noSeasonBody:
        'Check that you picked the file from your export and try again. If you trained in 2026, review that the file includes that year.',
      unsupportedTitle: 'Your browser cannot read the file',
    },
  },
  processing: {
    title: 'Preparing your season…',
    meta: 'Processing · On your device',
    errorMeta: 'Error · Check the file',
    phaseReading: 'Reading your file…',
    phaseComputing: 'Computing your numbers…',
    phaseDone: 'Done',
    seenRowsLabel: 'Rows read',
    keptRowsLabel: '2026 activities',
    cancel: 'Cancel',
    errorTitle: 'We could not process the file',
    errorUnreadable:
      'The file could not be read. Check that it is the activities.csv from the export and try again.',
    errorGeneric: 'Something failed while processing the file. Try again.',
    back: 'Try again',
  },
  result: {
    title: 'Your 2026 season',
    meta: 'Result · 2026 season',
    subtitle: 'The eight stories and your Dorsal will go here.',
    kilometres: 'Kilometers',
    movingTime: 'Moving time',
    activities: 'Activities',
    activeDays: 'Active days',
    elevation: 'Positive elevation gain (m)',
    provisional: 'Provisional screen.',
    openPlayer: 'Watch my season as stories',
  },
  player: {
    close: 'Close the stories',
    zoneNext: 'Next story',
    tapHint: 'Tap the screen to advance',
    zonePrevious: 'Previous story',
    progressLabel: 'Progress of the stories',
  },
  stories: {
    '01-portada': {
      title: 'The cover',
      seasonLabel: 'Season',
      year: '2026',
      kilometresLabel: 'Kilometers',
      greeting: 'your year has its Dorsal.',
      greetingStandalone: 'Your year has its Dorsal.',
      introPlural: 'events later, it is time to look back. There are eight stages.',
      introSingular: 'event later, it is time to look back. There are eight stages.',
      nameLabel: 'What should we call you?',
      namePlaceholder: 'Your name or nickname (optional)',
    },
    '02-numeros': {
      title: 'The numbers',
      intro: 'This year you traveled',
      kilometresLabel: 'km',
      lapsLead: 'That is',
      lapsUnit: 'laps',
      lapsUnitSingular: 'lap',
      lapsTail: 'on a 400-meter track. Lane 1, skipping none.',
      movingTimeLabel: 'Moving',
      activitiesLabel: 'Activities',
      activeDaysSuffix: 'different days',
      elevationLabel: 'Of positive gain',
      everestUnit: 'Everest',
      everestAria: 'times Mount Everest',
      sportSplitTitle: 'Split by sport',
      sportSplitAriaLead: 'Moving time split by sport:',
    },
    '03-perfil': {
      title: 'Your year’s profile',
      subtitle:
        'If your season were a mountain stage, this would be its profile. Kilometers per month.',
      peakBadge: 'HC',
      peakLabel: 'Pass of',
      valleyLabel: 'Valley of',
      valleyBody: 'Your lightest month of the year.',
      comebackLabel: 'Comeback',
      comebackBody: 'After the valley, you multiplied your volume.',
      profileAriaLead: 'Kilometers per month:',
      unitKm: 'km',
    },
    '04-constancia': {
      title: 'Consistency',
      intro: 'Days with activity',
      activeDaysSuffix: 'of 365 days',
      heatmapAria:
        '2026 calendar: one square per day with activity; the color marks the moving time in four levels.',
      legendLess: 'Less time',
      legendMore: 'More time',
      streakUnit: 'days in a row',
      streakUnitSingular: 'day in a row',
      streakFrom: 'from',
      streakTo: 'to',
      streakDe: '',
      streakTail: 'Your longest streak.',
      weekdayLead: 'is your favorite day: present in',
      weekSingular: 'week',
      weekPlural: 'weeks',
    },
    '05-arquetipo': {
      title: 'Your archetype',
      lead: 'Your sports archetype is',
      archetypeNames: {
        earlyBird: 'Early bird',
        nightOwl: 'Night owl',
        weekendWarrior: 'Weekend warrior',
        methodical: 'Methodical',
        multisport: 'Multisport',
        longDistance: 'Long-hauler',
        steady: 'Steady',
      },
      secondaryLead: 'Your secondary trait:',
      distributionLabel: 'When you start',
      clockPeakLabel: 'YOUR hour',
    },
    '07-latidos': {
      title: 'The year in heartbeats',
      lead: 'While training, your heart beat',
      millionsUnit: 'million times',
      beatsUnit: 'beats',
      restingDaysLead: 'is what a resting heart beats to get to that figure.',
      restingUnit: 'days',
      restingUnitSingular: 'day',
      peakLead: 'your peak of the year,',
      estimateNote: 'Estimated from the average heart rate of each activity and its moving time.',
    },
    '06-material': {
      title: 'Your gear',
      eyebrow: 'Stage 6 · Your gear',
      starLead: {
        shoes: 'The shoes that carried you the most.',
        bikes: 'The bike that carried you the most.',
      },
      hoursLabel: 'Moving',
      rankingLabel: 'All your gear, from most to fewest hours.',
      retirementBadge: 'Time to retire them',
      retirementNote: 'More than 800 km in 2026: the export only covers this season.',
      rowActivitySingular: 'activity',
      rowActivityPlural: 'activities',
    },
    '08-dorsal': {
      title: 'Your Dorsal',
      eyebrow: 'Finish · Your Dorsal',
      plate: 'Dorsal · 2026 season',
      plateShort: '2026 season',
      plateKm: 'KM',
      fallbackName: 'Your year',
      statActivities: 'Activ.',
      statEverest: 'Everest',
      statStreak: 'Streak',
      statActiveDays: 'Days',
      chartCaption: 'Km per month',
      madeWith: 'Made with Dorsal',
      previewLabel: 'Your Dorsal: number, name and 2026 season.',
      shareLabel: 'Share the Dorsal',
      downloadLabel: 'Download the Dorsal',
      actionHint: '1080 × 1920 PNG, ready for stories.',
      carnet: {
        title: 'Season card',
        sportsTitle: 'Your split by sport',
        mostPracticedLabel: 'The sport that took most of your time',
        bestWeekLabel: 'The week with most km',
        consecutiveLead: 'Consecutive weeks hitting the sessions',
        weeksUnit: 'weeks',
        weeksUnitSingular: 'week',
        marksTitle: 'Best marks',
        longestSessionLabel: 'The longest outing',
        biggestElevationDayLabel: 'The day with most climbing',
        bestWeekMarkLabel: 'The best week',
        powerTitle: 'Power',
        weightedAvgPowerLabel: 'Best weighted average',
        maxPowerLabel: 'Best peak',
        powerEvolutionLabel: 'Evolution per month',
        previewLabel: 'Your season card: sports, weeks, best marks and power.',
        shareLabel: 'Share the season card',
        downloadLabel: 'Download the season card',
        actionHint: '1080 × 1920 PNG with all the data.',
      },
      toggleGroupLabel: 'Your season card',
      toggleDorsal: 'Dorsal',
      toggleCarnet: 'Card',
    },
  },
  notFound: {
    title: 'This page does not exist',
    cta: 'Back to the start',
  },
} satisfies Messages

/**
 * Copy for the refusal to open the wrapped when no activity survived the 2026
 * filter, with the real counts of the run (BRIEF §5.4). The English sentence
 * functions pass the locale explicitly so they read the same on the first
 * render and after a switch.
 */
export function uploadNoSeasonMessage(totalRows: number): string {
  return `We read ${formatNumber(totalRows, 'en')} activities and none is from 2026.`
}

/**
 * Copy for story 05: the share of starts at the peak hour, e.g.
 * `(72, '7:00')` → "72% of your starts were at 7:00.".
 */
export function archetypePeakSentence(sharePct: number, hourText: string): string {
  return `${formatNumber(sharePct, 'en')}% of your starts were at ${hourText}.`
}

/** Copy for story 07: the peak date, e.g. `(24, 'October')` → "on 24 October". */
export function heartbeatPeakDate(day: number, month: string): string {
  return `on ${formatNumber(day, 'en')} ${month}`
}

/** Copy for story 07: the coverage in words, e.g. `(85)` → "You recorded heart rate during 85% of your moving time." */
export function heartbeatCoverageSentence(coveragePct: number): string {
  return `You recorded heart rate during ${formatNumber(coveragePct, 'en')}% of your moving time.`
}

/** List with the English joining, e.g. `[Worker, FileReader]` → "Worker and FileReader". */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join(EMPTY)
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? EMPTY}`
}

/** Copy for the unsupported-browser state, naming each missing API. */
export function uploadUnsupportedMessage(missing: readonly string[]): string {
  return `To read the file on your device, your browser is missing ${joinAnd(missing)}. Update it or try another one and upload the file again.`
}

/** Copy for the warning about rows that could not be read and were ignored. */
export function resultCorruptWarning(corruptRows: number): string {
  return `We ignored ${formatNumber(corruptRows, 'en')} rows we could not read. The numbers count only the valid activities.`
}

/**
 * Copy for the fulfilled week rule of the season card, printing the threshold
 * so the rule is visible on the artifact, e.g. `(3)` → "3 or more sessions per week".
 */
export function fulfilledWeeksSentence(sessionsPerWeek: number): string {
  return `${formatNumber(sessionsPerWeek, 'en')} or more sessions per week`
}

/**
 * Copy for the power coverage of the season card, so a partial year cannot
 * read as a complete one: `(34, 60)` → "power in 34 of 60 workouts".
 */
export function powerCoverageSentence(sessionsWithPower: number, totalSessions: number): string {
  return `power in ${formatNumber(sessionsWithPower, 'en')} of ${formatNumber(totalSessions, 'en')} workouts`
}
