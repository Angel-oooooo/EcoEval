import { useState, useEffect } from 'react'
import { getMisResultados } from '../api/misCursos'

export default function MisResultados() {
  const [resultados, setResultados] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getMisResultados()
      .then(setResultados)
      .catch(e => setError(e.message))
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Resultados</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Examen', 'Calificación', 'Resultado', 'Fecha'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resultados.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin resultados todavía</td></tr>
            ) : (
              resultados.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">Examen #{r.examen_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.puntuacion}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {r.aprobado ? 'Aprobado' : 'No aprobado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '—'}
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
