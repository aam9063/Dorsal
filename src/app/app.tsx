import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { LandingScreen } from '../features/landing'
import { NotFoundScreen } from './not-found-screen'
import { RootLayout } from './root-layout'

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
