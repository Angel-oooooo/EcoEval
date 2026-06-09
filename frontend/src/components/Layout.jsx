import { NavLink, useNavigate } from 'react-router-dom'
import { cerrarSesion, getUsuario } from '../api/auth'

const linksAdmin = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/empleados', label: 'Empleados' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/examenes', label: 'Exámenes' },
  { to: '/reportes', label: 'Reportes' },
]

const linksEmpleado = [
  { to: '/mis-cursos', label: 'Mis Cursos' },
  { to: '/mis-resultados', label: 'Mis Resultados' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const links = usuario?.rol === 'empleado' ? linksEmpleado : linksAdmin

  function handleLogout() {
    cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-lg font-bold text-green-600">EcoEval</h1>
          <p className="text-xs text-gray-400 truncate">{usuario?.nombre} {usuario?.apellido}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
