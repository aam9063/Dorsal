import { BrowserRouter, Route, Routes } from 'react-router'
import { LandingScreen } from '../features/landing'
import { UploadScreen } from '../features/upload'
import { ResultScreen } from '../features/wrapped'
import { NotFoundScreen } from './not-found-screen'
import { RootLayout } from './root-layout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<LandingScreen />} />
          <Route path="subir" element={<UploadScreen />} />
          <Route path="resultado" element={<ResultScreen />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
