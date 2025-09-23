import { Route, Routes, useLocation } from 'react-router-dom'
import { routes } from './app/routes'
import { DebugInfo } from './components/DebugInfo'
import { Header } from './components/Header'
import { Navigation } from './components/Navigation'
import { ActivityManager } from './pages/ActivityManager'
import { ActivitySelector } from './pages/ActivitySelector'
import { Directorio } from './pages/Directorio'
import { Meeting } from './pages/Meeting'

function App() {
  const location = useLocation()
  
  // No mostrar header y navigation en ciertas páginas
  const hideHeaderAndNav = location.pathname === routes.timerPopup || 
                           location.pathname === routes.activitySelector ||
                           location.pathname.startsWith('/activity/')

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugInfo />
      {!hideHeaderAndNav && <Header />}
      {!hideHeaderAndNav && <Navigation />}
      <Routes>
        <Route path={routes.home} element={<ActivitySelector />} />
        <Route path={routes.activitySelector} element={<ActivitySelector />} />
        <Route path="/activity/:meetingId" element={<ActivityManager />} />
        <Route path={routes.timerPopup} element={<Meeting />} />
        <Route path={routes.directorio} element={<Directorio />} />
        <Route path={routes.meeting} element={<Meeting />} />
      </Routes>
    </div>
  )
}

export default App
