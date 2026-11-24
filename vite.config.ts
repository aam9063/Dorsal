import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

/**
 * The landing imports the `src/shared/hooks/` barrel, which re-exports
 * `useAnalysis`. That hook is unused there, but the worker bridge it pulls
 * (Comlink plus the Zod schema) was counted as side-effectful and shipped in
 * the entry bundle the landing paints with.
 *
 * Declaring local `src/` modules side-effect free is what lets the tree shaker
 * drop them where they are unused. It is a deliberate trade-off, and it holds
 * only because of a property that has to stay true: of the two modules in
 * `src/` with real top-level work — `shared/hooks/use-gsap-reveal.ts` registers
 * the ScrollTrigger plugin, `shared/theme/theme-preference.ts` reads the media
 * query, the stored preference and applies the theme — each one is imported
 * only by the code that uses it, so it is never dropped while still needed.
 * A new module that mutates globals at import time and is imported only for
 * that effect would be silently dropped by this setting.
 *
 * Modules from dependencies and CSS (font-face declarations, Tailwind) keep
 * their default side-effect status.
 */
function hasModuleSideEffects(id: string) {
  const normalized = id.replace(/\\/g, '/')
  if (normalized.includes('/src/') && !normalized.endsWith('.css')) {
    return false
  }
  return true
}

/**
 * Preloads the woff2 fonts the landing paints with. They are hashed assets,
 * so the links are injected from the build manifest instead of being written
 * by hand in index.html; a preload is only emitted for a font that actually
 * shipped.
 */
function fontPreloads(): Plugin {
  const fontPattern = /(anton|inter|jetbrains-mono)-latin-\d+-normal-[A-Za-z0-9_-]+\.woff2$/
  return {
    name: 'dorsal-font-preloads',
    transformIndexHtml(html, ctx) {
      const fonts = ctx.bundle
        ? Object.values(ctx.bundle)
            .filter((chunk) => 'fileName' in chunk && fontPattern.test(chunk.fileName))
            .map((chunk) => ('fileName' in chunk ? chunk.fileName : ''))
            .filter(Boolean)
        : []
      const links = fonts
        .map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin />`)
        .join('\n    ')
      return html.replace('</head>', `    ${links}\n  </head>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fontPreloads()],
  build: {
    target: 'es2022',
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: hasModuleSideEffects,
      },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
})
