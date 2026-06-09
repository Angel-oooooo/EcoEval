import { useState, useEffect } from 'react'
import { getUsuarios } from '../api/usuarios'
import { getToken } from '../api/auth'

const BASE_URL = 'http://localhost:8000'

async function descargarReporte(usuario) {
  const res = await fetch(`${BASE_URL}/reportes/empleado/${usuario.id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  if (!res.ok) throw new Error('Error al generar el reporte')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_${usuario.nombre}_${usuario.apellido}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reportes() {
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [descargando, setDescargando] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getUsuarios()
      .then(data => setUsuarios(data.filter(u => u.rol === 'empleado')))
      .catch(e => setError(e.message))
  }, [])

  async function handleDescargar(usuario) {
    setError('')
    setDescargando(usuario.id)
    try {
      await descargarReporte(usuario)
    } catch (e) {
      setError(e.message)
    } finally {
      setDescargando(null)
    }
  }

  const filtrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.puesto}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Reportes PDF</h2>
        <p className="text-sm text-gray-400 mt-1">Genera evidencia de cumplimiento ISO 14001 por empleado</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="mb-4">
        <input type="text" placeholder="Buscar empleado..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Empleado', 'Correo', 'Puesto', 'Reporte'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin empleados registrados</td></tr>
            ) : (
              filtrados.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3 text-gray-500">{u.correo}</td>
                  <td className="px-4 py-3 text-gray-500">{u.puesto || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDescargar(u)}
                      disabled={descargando === u.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {descargando === u.id ? 'Generando...' : 'Descargar PDF'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
