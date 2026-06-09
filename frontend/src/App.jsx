import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Empleados from './pages/Empleados'
import Cursos from './pages/Cursos'
import Examenes from './pages/Examenes'
import Layout from './components/Layout'
import { getToken } from './api/auth'

function RutaProtegida({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function Placeholder({ titulo }) {
  return <div className="text-gray-500 text-sm">{titulo} — próximamente</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <RutaProtegida>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Placeholder titulo="Dashboard" />} />
                <Route path="/empleados" element={<Empleados />} />
                <Route path="/cursos" element={<Cursos />} />
                <Route path="/examenes" element={<Examenes />} />
                <Route path="/reportes" element={<Placeholder titulo="Reportes" />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  )
}
