import { useState, useEffect } from 'react'
import { getUsuarios, crearUsuario, editarUsuario, desactivarUsuario, getCursosDeEmpleado } from '../api/usuarios'

const formVacio = { nombre: '', apellido: '', correo: '', contrasena: '', rol: 'empleado', puesto: '' }
const rolColor = { admin: 'bg-purple-100 text-purple-700', instructor: 'bg-blue-100 text-blue-700', empleado: 'bg-gray-100 text-gray-600' }
const estadoColor = { completado: 'text-green-600', pendiente: 'text-yellow-600', vencido: 'text-red-500', en_progreso: 'text-blue-600' }

export default function Empleados() {
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [expandido, setExpandido] = useState(null)
  const [cursosEmpleado, setCursosEmpleado] = useState({})
  const [form, setForm] = useState(formVacio)
  const [error, setError] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try { setUsuarios(await getUsuarios()) }
    catch (e) { setError(e.message) }
  }

  async function toggleDetalle(u) {
    if (expandido === u.id) { setExpandido(null); return }
    setExpandido(u.id)
    if (!cursosEmpleado[u.id]) {
      const data = await getCursosDeEmpleado(u.id)
      setCursosEmpleado(prev => ({ ...prev, [u.id]: data.historial }))
    }
  }

  function abrirCrear() { setEditando(null); setForm(formVacio); setMostrarForm(true) }
  function abrirEditar(u) {
    setEditando(u.id)
    setForm({ nombre: u.nombre, apellido: u.apellido, correo: u.correo, contrasena: '', rol: u.rol, puesto: u.puesto || '' })
    setMostrarForm(true)
  }
  function cerrarForm() { setMostrarForm(false); setEditando(null); setForm(formVacio); setError('') }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    try {
      editando
        ? await editarUsuario(editando, { nombre: form.nombre, apellido: form.apellido, puesto: form.puesto, rol: form.rol })
        : await crearUsuario(form)
      cerrarForm(); cargar()
    } catch (e) { setError(e.message) }
  }

  async function handleDesactivar(id) {
    if (!confirm('¿Desactivar este usuario?')) return
    try { await desactivarUsuario(id); cargar() }
    catch (e) { setError(e.message) }
  }

  const filtrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.correo} ${u.puesto}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Empleados</h2>
        <button onClick={abrirCrear} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Nuevo empleado
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 text-sm font-semibold text-gray-700">{editando ? 'Editar empleado' : 'Nuevo empleado'}</h3>
          {[
            { label: 'Nombre', key: 'nombre' },
            { label: 'Apellido', key: 'apellido' },
            ...(!editando ? [{ label: 'Correo', key: 'correo', type: 'email' }, { label: 'Contraseña', key: 'contrasena', type: 'password' }] : []),
            { label: 'Puesto', key: 'puesto' },
          ].map(({ label, key, type = 'text' }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="empleado">Empleado</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={cerrarForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">Guardar</button>
          </div>
        </form>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input type="text" placeholder="Buscar por nombre, correo o puesto..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Nombre', 'Correo', 'Puesto', 'Rol', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
            ) : (
              filtrados.map(u => (
                <>
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nombre} {u.apellido}</td>
                    <td className="px-4 py-3 text-gray-500">{u.correo}</td>
                    <td className="px-4 py-3 text-gray-500">{u.puesto || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolColor[u.rol]}`}>{u.rol}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => toggleDetalle(u)} className="text-xs text-gray-500 hover:underline">
                        {expandido === u.id ? 'Ocultar' : 'Ver cursos'}
                      </button>
                      <button onClick={() => abrirEditar(u)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDesactivar(u.id)} className="text-xs text-red-500 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                  {expandido === u.id && (
                    <tr key={`detalle-${u.id}`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-3">
                        {!cursosEmpleado[u.id] ? (
                          <p className="text-xs text-gray-400">Cargando...</p>
                        ) : cursosEmpleado[u.id].length === 0 ? (
                          <p className="text-xs text-gray-400">Sin cursos asignados</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left pb-1 font-medium">Curso</th>
                                <th className="text-left pb-1 font-medium">Estado</th>
                                <th className="text-left pb-1 font-medium">Fecha límite</th>
                                <th className="text-left pb-1 font-medium">Calificación</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {cursosEmpleado[u.id].map((c, i) => (
                                <tr key={i}>
                                  <td className="py-1 pr-4 text-gray-700">{c.curso}</td>
                                  <td className={`py-1 pr-4 font-medium ${estadoColor[c.estado] || 'text-gray-600'}`}>{c.estado}</td>
                                  <td className="py-1 pr-4 text-gray-500">{c.fecha_limite ? new Date(c.fecha_limite).toLocaleDateString('es-MX') : '—'}</td>
                                  <td className="py-1 text-gray-700">{c.puntuacion !== null ? `${c.puntuacion}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
