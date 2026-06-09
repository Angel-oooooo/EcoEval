import { useState, useEffect } from 'react'
import { getCursos, crearCurso, editarCurso, desactivarCurso, asignarCurso, getEmpleadosPorCurso } from '../api/cursos'
import { getUsuarios } from '../api/usuarios'

const formVacio = { titulo: '', descripcion: '', objetivo: '', material_texto: '', duracion_horas: 1, porcentaje_aprobatorio: 70 }
const estadoColor = { completado: 'text-green-600', pendiente: 'text-yellow-600', vencido: 'text-red-500', en_progreso: 'text-blue-600' }

export default function Cursos() {
  const [cursos, setCursos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [asignando, setAsignando] = useState(null)
  const [yaAsignados, setYaAsignados] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [empleadosPorCurso, setEmpleadosPorCurso] = useState({})
  const [form, setForm] = useState(formVacio)
  const [formAsign, setFormAsign] = useState({ usuario_id: '', fecha_limite: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
    getUsuarios().then(setUsuarios).catch(() => {})
  }, [])

  async function cargar() {
    try { setCursos(await getCursos()) }
    catch (e) { setError(e.message) }
  }

  async function toggleDetalle(c) {
    if (expandido === c.id) { setExpandido(null); return }
    setExpandido(c.id)
    if (!empleadosPorCurso[c.id]) {
      const data = await getEmpleadosPorCurso(c.id)
      setEmpleadosPorCurso(prev => ({ ...prev, [c.id]: data.empleados }))
    }
  }

  function abrirCrear() { setEditando(null); setForm(formVacio); setMostrarForm(true) }
  function abrirEditar(c) {
    setEditando(c.id)
    setForm({ titulo: c.titulo, descripcion: c.descripcion, objetivo: c.objetivo, material_texto: c.material_texto, duracion_horas: c.duracion_horas, porcentaje_aprobatorio: c.porcentaje_aprobatorio })
    setMostrarForm(true)
  }
  function cerrarForm() { setMostrarForm(false); setEditando(null); setForm(formVacio); setError('') }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    try {
      editando ? await editarCurso(editando, form) : await crearCurso(form)
      cerrarForm(); cargar()
    } catch (e) { setError(e.message) }
  }

  async function handleDesactivar(id) {
    if (!confirm('¿Desactivar este curso?')) return
    try { await desactivarCurso(id); cargar() }
    catch (e) { setError(e.message) }
  }

  async function abrirAsignar(c) {
    setError('')
    const data = await getEmpleadosPorCurso(c.id)
    setYaAsignados(data.empleados.map(e => e.usuario_id))
    setAsignando(c.id)
  }

  async function handleAsignar(e) {
    e.preventDefault(); setError('')
    try {
      await asignarCurso({ curso_id: asignando, usuario_id: parseInt(formAsign.usuario_id), fecha_limite: formAsign.fecha_limite || null })
      // refrescar detalle si está expandido
      const data = await getEmpleadosPorCurso(asignando)
      setEmpleadosPorCurso(prev => ({ ...prev, [asignando]: data.empleados }))
      setAsignando(null)
      setFormAsign({ usuario_id: '', fecha_limite: '' })
    } catch (e) { setError(e.message) }
  }

  const filtrados = cursos.filter(c =>
    `${c.titulo} ${c.descripcion}`.toLowerCase().includes(busqueda.toLowerCase())
  )
  const empleados = usuarios.filter(u => u.rol === 'empleado' && !yaAsignados.includes(u.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Cursos</h2>
        <button onClick={abrirCrear} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Nuevo curso
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Formulario curso */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 text-sm font-semibold text-gray-700">{editando ? 'Editar curso' : 'Nuevo curso'}</h3>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
            <textarea value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <textarea value={form.material_texto} onChange={e => setForm({ ...form, material_texto: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
            <input type="number" min={1} value={form.duracion_horas} onChange={e => setForm({ ...form, duracion_horas: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% Aprobatorio</label>
            <input type="number" min={1} max={100} value={form.porcentaje_aprobatorio} onChange={e => setForm({ ...form, porcentaje_aprobatorio: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={cerrarForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">Guardar</button>
          </div>
        </form>
      )}

      {/* Modal asignar */}
      {asignando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleAsignar} className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-800">Asignar curso a empleado</h3>
            {empleados.length === 0 ? (
              <p className="text-sm text-gray-500">Todos los empleados ya tienen este curso asignado.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                  <select value={formAsign.usuario_id} onChange={e => setFormAsign({ ...formAsign, usuario_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required>
                    <option value="">Seleccionar...</option>
                    {empleados.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite (opcional)</label>
                  <input type="date" value={formAsign.fecha_limite} onChange={e => setFormAsign({ ...formAsign, fecha_limite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAsignando(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              {empleados.length > 0 && (
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">Asignar</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input type="text" placeholder="Buscar curso..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Título', 'Duración', '% Aprobatorio', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin cursos registrados</td></tr>
            ) : (
              filtrados.map(c => (
                <>
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.titulo}</p>
                      <p className="text-xs text-gray-400">{c.descripcion}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.duracion_horas}h</td>
                    <td className="px-4 py-3 text-gray-500">{c.porcentaje_aprobatorio}%</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => toggleDetalle(c)} className="text-xs text-gray-500 hover:underline">
                        {expandido === c.id ? 'Ocultar' : 'Ver empleados'}
                      </button>
                      <button onClick={() => abrirAsignar(c)} className="text-xs text-green-600 hover:underline">Asignar</button>
                      <button onClick={() => abrirEditar(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDesactivar(c.id)} className="text-xs text-red-500 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                  {expandido === c.id && (
                    <tr key={`detalle-${c.id}`} className="bg-gray-50">
                      <td colSpan={4} className="px-6 py-3">
                        {!empleadosPorCurso[c.id] ? (
                          <p className="text-xs text-gray-400">Cargando...</p>
                        ) : empleadosPorCurso[c.id].length === 0 ? (
                          <p className="text-xs text-gray-400">Sin empleados asignados</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left pb-1 font-medium">Empleado</th>
                                <th className="text-left pb-1 font-medium">Estado</th>
                                <th className="text-left pb-1 font-medium">Fecha límite</th>
                                <th className="text-left pb-1 font-medium">Calificación</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {empleadosPorCurso[c.id].map((e, i) => (
                                <tr key={i}>
                                  <td className="py-1 pr-4 text-gray-700">{e.empleado}</td>
                                  <td className={`py-1 pr-4 font-medium ${estadoColor[e.estado] || 'text-gray-600'}`}>{e.estado}</td>
                                  <td className="py-1 pr-4 text-gray-500">{e.fecha_limite ? new Date(e.fecha_limite).toLocaleDateString('es-MX') : '—'}</td>
                                  <td className="py-1 text-gray-700">{e.puntuacion !== null ? `${e.puntuacion}%` : '—'}</td>
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
