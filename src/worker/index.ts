import * as Comlink from 'comlink'
import { createAnalyzeApi } from './analyze'

Comlink.expose(createAnalyzeApi())
