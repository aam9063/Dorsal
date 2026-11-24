import { es } from './es'

export const messages = { es }

export type Locale = keyof typeof messages

export const defaultLocale: Locale = 'es'

export const t = messages[defaultLocale]

export {
  archetypePeakSentence,
  heartbeatCoverageSentence,
  heartbeatPeakDate,
  joinAnd,
  resultCorruptWarning,
  uploadNoSeasonMessage,
  uploadUnsupportedMessage,
} from './es'
