import { useState, useEffect } from 'react'
import { getMisCursos, getExamenParaResponder, responderExamen } from '../api/misCursos'

const estadoColor = {
  completado: 'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
  en_progreso: 'bg-blue-100 text-blue-700',
}

export default function MisCursos() {
  const [cursos, setCursos] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [examenActivo, setExamenActivo] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try { setCursos(await getMisCursos()) }
    catch (e) { setError(e.message) }
  }

  async function abrirExamen(curso) {
    setError('')
    setResultado(null)
    setRespuestas({})
    try {
      const data = await getExamenParaResponder(curso.examen_id)
      setPreguntas(data.preguntas)
      setExamenActivo(curso)
    } catch (e) { setError(e.message) }
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (Object.keys(respuestas).length < preguntas.length) {
      setError('Debes responder todas las preguntas')
      return
    }
    setError('')
    try {
      const lista = Object.entries(respuestas).map(([pregunta_id, opcion_seleccionada_id]) => ({
        pregunta_id: parseInt(pregunta_id),
        opcion_seleccionada_id: parseInt(opcion_seleccionada_id),
      }))
      const res = await responderExamen(examenActivo.examen_id, lista)
      setResultado(res)
      cargar()
    } catch (e) { setError(e.message) }
  }

  function cerrarExamen() {
    setExamenActivo(null)
    setPreguntas([])
    setRespuestas({})
    setResultado(null)
    setError('')
  }

  // Vista del examen
  if (examenActivo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{examenActivo.curso}</h2>
            <p className="text-sm text-gray-400">Examen</p>
          </div>
          <button onClick={cerrarExamen} className="text-sm text-gray-500 hover:underline">← Volver</button>
        </div>

        {resultado ? (
          <div className={`rounded-xl p-8 text-center border ${resultado.aprobado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-5xl font-bold mb-2 ${resultado.aprobado ? 'text-green-600' : 'text-red-500'}">{resultado.puntuacion}%</p>
            <p className={`text-lg font-semibold mb-1 ${resultado.aprobado ? 'text-green-700' : 'text-red-600'}`}>
              {resultado.aprobado ? '¡Aprobado!' : 'No aprobado'}
            </p>
            <p className="text-sm text-gray-500">{resultado.correctas} de {resultado.total} respuestas correctas</p>
            <button onClick={cerrarExamen} className="mt-6 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">
              Volver a mis cursos
            </button>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            {preguntas.map((p, i) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="font-medium text-gray-800 mb-3">{i + 1}. {p.texto_pregunta}</p>
                <div className="space-y-2">
                  {p.opciones.map(o => (
                    <label key={o.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      respuestas[p.id] == o.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name={`p-${p.id}`} value={o.id}
                        checked={respuestas[p.id] == o.id}
                        onChange={() => setRespuestas({ ...respuestas, [p.id]: o.id })}
                        className="accent-green-600" />
                      <span className="text-sm text-gray-700">{o.texto_opcion}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors">
              Enviar respuestas
            </button>
          </form>
        )}
      </div>
    )
  }

  // Vista de lista de cursos
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Cursos</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {cursos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-12 text-center text-gray-400 text-sm">
          No tienes cursos asignados
        </div>
      ) : (
        <div className="space-y-3">
          {cursos.map(c => (
            <div key={c.asignacion_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Encabezado del curso */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                  <p className="font-medium text-gray-800">{c.curso}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.puntuacion !== null && (
                    <span className={`text-sm font-medium ${c.aprobado ? 'text-green-600' : 'text-red-500'}`}>
                      {c.puntuacion}%
                    </span>
                  )}
                  <button onClick={() => setExpandido(expandido === c.asignacion_id ? null : c.asignacion_id)}
                    className="text-xs text-gray-400 hover:underline">
                    {expandido === c.asignacion_id ? 'Ocultar' : 'Ver material'}
                  </button>
                  {c.examen_id && !c.aprobado && c.estado !== 'vencido' && (
                    <button onClick={() => abrirExamen(c)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      {c.intento_numero > 0 ? 'Reintentar' : 'Tomar examen'}
                    </button>
                  )}
                </div>
              </div>

              {/* Material del curso */}
              {expandido === c.asignacion_id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                  {c.descripcion && <p className="text-sm text-gray-500">{c.descripcion}</p>}
                  {c.material_texto && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {c.material_texto}
                    </div>
                  )}
                  {c.fecha_limite && (
                    <p className="text-xs text-gray-400">
                      Fecha límite: {new Date(c.fecha_limite).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
