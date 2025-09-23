import { Routes, Route } from 'react-router-dom'
import { routes } from './app/routes'
import { Directorio } from './pages/Directorio'
import { Meeting } from './pages/Meeting'
import { Header } from './components/Header'
import { Navigation } from './components/Navigation'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <Routes>
        <Route path={routes.directorio} element={<Directorio />} />
        <Route path={routes.meeting} element={<Meeting />} />
        <Route path="/" element={<Directorio />} />
      </Routes>
    </div>
  )
}

export default App
