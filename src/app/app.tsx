import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { LandingScreen } from '../features/landing'
import { bootstrapLocale } from '../shared/i18n'
import { NotFoundScreen } from './not-found-screen'
import { RootLayout } from './root-layout'

/**
 * The language is resolved before the first render: a stored explicit choice
 * wins, otherwise the browser language decides the first visit
 * (odd/tasks/i18n-english.md, S2 and S4). Running it once per bundle load
 * keeps a unit test that only imports components from ever touching
 * `navigator` or storage; in the running app every render starts with the
 * right locale and the right `<html lang>`.
 */
bootstrapLocale()

/**
 * The landing paints with the entry bundle; the upload flow and the story
 * player only need to be there once the user navigates to them, so each is
 * its own route chunk and the browser fetches it on navigation.
 */
const UploadScreen = lazy(() =>
  import('../features/upload').then((m) => ({ default: m.UploadScreen })),
)
const ResultScreen = lazy(() =>
  import('../features/wrapped').then((m) => ({ default: m.ResultScreen })),
)

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>{renderRoutes()}</Route>
      </Routes>
    </BrowserRouter>
  )
}

function renderRoutes() {
  return (
    <>
      <Route index element={<LandingScreen />} />
      <Route
        path="subir"
        element={
          <Suspense fallback={<RouteFallback />}>
            <UploadScreen />
          </Suspense>
        }
      />
      <Route
        path="resultado"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ResultScreen />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFoundScreen />} />
    </>
  )
}

/**
 * Placeholder while a lazy route chunk is on the wire. It carries no test id
 * so a test locator never matches it instead of the real screen.
 */
function RouteFallback() {
  return <div className="min-h-[60vh]" aria-hidden="true" />
}
