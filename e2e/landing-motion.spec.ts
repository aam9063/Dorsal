import { expect, test } from '@playwright/test'

/**
 * Under `prefers-reduced-motion: reduce` the landing animation hook must not
 * run at all: the markup's own values are shown immediately, so no element can
 * be caught mid-fade by the axe audit or wait for a reveal to become readable.
 * `emulateMedia` runs before `goto`, so these assertions need no retries and
 * no waiting for an animation to settle.
 */
test.describe('landing animations', () => {
  test('shows the hero and the call to action fully with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const headline = page.getByRole('heading', { level: 1 })
    await expect(headline).toHaveText('Tu año deportivo, en un dorsal.')
    expect(await headline.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    expect(await headline.evaluate((el) => getComputedStyle(el).transform)).toBe('none')

    const cta = page.getByTestId('landing-cta')
    await expect(cta).toHaveAccessibleName('Subir mi activities.csv')
    expect(await cta.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    expect(await cta.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
  })

  test('finishes the hero sequence and the counter at the markup values', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // The reveals rise without fading, so nothing is ever translucent: opacity
    // stays 1 from the first paint and only `transform` moves.
    const headline = page.getByRole('heading', { level: 1 })
    expect(await headline.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')

    // Counters end exactly where the markup value is.
    await expect(
      page.getByTestId('landing-root').locator('[data-anim-counter]').first(),
    ).toHaveText('3214', { timeout: 4000 })
    await expect(page.getByTestId('landing-root').locator('[data-anim-counter]').nth(1)).toHaveText(
      '412',
      { timeout: 4000 },
    )
  })
})
