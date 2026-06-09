import { useState, useEffect } from 'react'
import { getExamenes, crearExamen, eliminarExamen } from '../api/examenes'
import { getCursos } from '../api/cursos'

function preguntaVacia() {
  return { texto_pregunta: '', orden: 1, opciones: [{ texto_opcion: '', es_correcta: true }, { texto_opcion: '', es_correcta: false }, { texto_opcion: '', es_correcta: false }, { texto_opcion: '', es_correcta: false }] }
}

export default function Examenes() {
  const [examenes, setExamenes] = useState([])
  const [cursos, setCursos] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ curso_id: '', titulo: '', instrucciones: '', intentos_permitidos: 1, preguntas: [preguntaVacia()] })

  useEffect(() => {
    cargar()
    getCursos().then(setCursos).catch(() => {})
  }, [])

  async function cargar() {
    try { setExamenes(await getExamenes()) }
    catch (e) { setError(e.message) }
  }

  function agregarPregunta() {
    const nueva = { ...preguntaVacia(), orden: form.preguntas.length + 1 }
    setForm({ ...form, preguntas: [...form.preguntas, nueva] })
  }

  function eliminarPregunta(idx) {
    setForm({ ...form, preguntas: form.preguntas.filter((_, i) => i !== idx) })
  }

  function updatePregunta(idx, campo, valor) {
    const preguntas = [...form.preguntas]
    preguntas[idx] = { ...preguntas[idx], [campo]: valor }
    setForm({ ...form, preguntas })
  }

  function updateOpcion(pIdx, oIdx, campo, valor) {
    const preguntas = [...form.preguntas]
    const opciones = [...preguntas[pIdx].opciones]
    if (campo === 'es_correcta') {
      // solo una opción puede ser correcta
      opciones.forEach((o, i) => { opciones[i] = { ...o, es_correcta: i === oIdx } })
    } else {
      opciones[oIdx] = { ...opciones[oIdx], [campo]: valor }
    }
    preguntas[pIdx] = { ...preguntas[pIdx], opciones }
    setForm({ ...form, preguntas })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await crearExamen({ ...form, curso_id: parseInt(form.curso_id) })
      setMostrarForm(false)
      setForm({ curso_id: '', titulo: '', instrucciones: '', intentos_permitidos: 1, preguntas: [preguntaVacia()] })
      cargar()
    } catch (e) { setError(e.message) }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este examen?')) return
    try { await eliminarExamen(id); cargar() }
    catch (e) { setError(e.message) }
  }

  const filtrados = examenes.filter(e =>
    `${e.titulo} ${e.curso}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Exámenes</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {mostrarForm ? 'Cancelar' : '+ Nuevo examen'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-6">
          <h3 className="text-sm font-semibold text-gray-700">Nuevo examen</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <select value={form.curso_id} onChange={e => setForm({ ...form, curso_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">Seleccionar...</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título del examen</label>
              <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
              <input value={form.instrucciones} onChange={e => setForm({ ...form, instrucciones: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intentos permitidos</label>
              <input type="number" min={1} value={form.intentos_permitidos} onChange={e => setForm({ ...form, intentos_permitidos: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Preguntas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Preguntas ({form.preguntas.length})</p>
              <button type="button" onClick={agregarPregunta} className="text-sm text-green-600 hover:underline">+ Agregar pregunta</button>
            </div>

            {form.preguntas.map((p, pIdx) => (
              <div key={pIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">Pregunta {pIdx + 1}</p>
                  {form.preguntas.length > 1 && (
                    <button type="button" onClick={() => eliminarPregunta(pIdx)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
                <input
                  placeholder="Escribe la pregunta..."
                  value={p.texto_pregunta}
                  onChange={e => updatePregunta(pIdx, 'texto_pregunta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-400">Marca la opción correcta con el círculo</p>
                <div className="space-y-2">
                  {p.opciones.map((o, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correcta-${pIdx}`}
                        checked={o.es_correcta}
                        onChange={() => updateOpcion(pIdx, oIdx, 'es_correcta', true)}
                        className="accent-green-600"
                      />
                      <input
                        placeholder={`Opción ${oIdx + 1}`}
                        value={o.texto_opcion}
                        onChange={e => updateOpcion(pIdx, oIdx, 'texto_opcion', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">Guardar examen</button>
          </div>
        </form>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input type="text" placeholder="Buscar examen..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Título', 'Curso', 'Preguntas', 'Intentos', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin exámenes registrados</td></tr>
            ) : (
              filtrados.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{e.titulo}</td>
                  <td className="px-4 py-3 text-gray-500">{e.curso}</td>
                  <td className="px-4 py-3 text-gray-500">{e.total_preguntas}</td>
                  <td className="px-4 py-3 text-gray-500">{e.intentos_permitidos}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEliminar(e.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
