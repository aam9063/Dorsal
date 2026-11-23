import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'
import { formatCountValue, parseCountValue, shouldAnimate } from './gsap-reveal-policy'

gsap.registerPlugin(ScrollTrigger)

type Listener = { element: HTMLElement; type: string; handler: EventListener }

/**
 * Drives every landing animation from one `gsap.context` scoped to `target`,
 * reverting the context (and the listeners and counter text it added) on
 * cleanup. Markup never hides anything: `gsap.from` sets the initial state
 * here, so with JavaScript blocked the page is readable as rendered.
 *
 * Under `prefers-reduced-motion: reduce` the hook does nothing at all — no
 * reveals, no hover lift, no press, no counter — and every element stays in
 * its final state (BRIEF §7).
 *
 * Only `transform` is animated for the reveals (never `width`, `height`,
 * `top`, `left`, so nothing shifts layout), and never `opacity`: axe has
 * failed contrast on text caught mid-fade before, and the audit on the smoke
 * spec runs right after the page appears, so a rise that keeps every element
 * fully opaque is the deterministic choice — nothing is ever half-lit, at
 * rest or in motion.
 *
 * Markup contract (data attributes, all optional):
 * - `[data-anim-hero]` — settled in DOM order on load (eyebrow, headline,
 *   subhead, then the example card).
 * - `[data-anim-section]` — rises once when it enters the viewport.
 * - `[data-anim-card]` — story preview cards, staggered when the row enters.
 * - `[data-anim-counter]` — counts up to its own markup text when the last
 *   hero element appears; skipped if the text is not a single number.
 * - `[data-anim-button]` — hover lift and press compression; the layout box
 *   and the 44 px hit area never change.
 */
export function useGsapReveal(target: RefObject<HTMLElement | null>): void {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const root = target.current
    if (root === null || !shouldAnimate(reducedMotion)) {
      return
    }

    const listeners: Listener[] = []
    const addListener = (element: HTMLElement, type: string, handler: EventListener): void => {
      element.addEventListener(type, handler)
      listeners.push({ element, type, handler })
    }
    const counterOriginals = new Map<HTMLElement, string>()

    const context = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>('[data-anim-hero]', root)
      const timeline = gsap.timeline({ defaults: { duration: 0.6, ease: 'power2.out' } })
      heroItems.forEach((item, index) => {
        timeline.from(item, { y: 24 }, index === 0 ? 0 : '<0.12')
      })

      gsap.utils.toArray<HTMLElement>('[data-anim-section]', root).forEach((section) => {
        gsap.from(section, {
          y: 32,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', once: true },
        })
      })

      const cards = gsap.utils.toArray<HTMLElement>('[data-anim-card]', root)
      const firstCard = cards[0]
      if (firstCard !== undefined) {
        gsap.from(cards, {
          y: 28,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: { trigger: firstCard, start: 'top 90%', once: true },
        })
      }

      const counterPosition = heroItems.length > 0 ? '<' : 0
      gsap.utils.toArray<HTMLElement>('[data-anim-counter]', root).forEach((element) => {
        const original = element.textContent ?? ''
        counterOriginals.set(element, original)
        const parsed = parseCountValue(original)
        if (parsed === null) {
          return
        }
        const frame = { value: 0 }
        timeline.to(
          frame,
          {
            value: parsed.value,
            duration: 1.1,
            ease: 'power1.out',
            onUpdate: () => {
              element.textContent = formatCountValue(frame.value, parsed)
            },
            onComplete: () => {
              element.textContent = original
            },
          },
          counterPosition,
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-anim-button]', root).forEach((button) => {
        const lift = gsap.quickTo(button, 'y', { duration: 0.18, ease: 'power2.out' })
        const press = gsap.quickTo(button, 'scale', { duration: 0.12, ease: 'power2.out' })
        addListener(button, 'pointerenter', () => {
          lift(-2)
        })
        addListener(button, 'pointerleave', () => {
          lift(0)
          press(1)
        })
        addListener(button, 'pointerdown', () => {
          press(0.97)
        })
        addListener(button, 'pointerup', () => {
          press(1)
        })
        addListener(button, 'pointercancel', () => {
          press(1)
        })
      })

      return () => {
        listeners.forEach(({ element, type, handler }) => {
          element.removeEventListener(type, handler)
        })
        counterOriginals.forEach((text, element) => {
          element.textContent = text
        })
      }
    }, root)

    return () => {
      context.revert()
    }
  }, [target, reducedMotion])
}
