import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getResumen } from '../api/dashboard'

const COLORES = ['#16a34a', '#ca8a04', '#dc2626']

function Tarjeta({ label, valor, sub, color = 'text-gray-800' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const etiquetaPersonalizada = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getResumen()
      .then(setData)
      .catch(e => setError(e.message))
  }, [])

  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
  if (!data) return <p className="text-sm text-gray-400">Cargando...</p>

  const graficaData = [
    { name: 'Completados', value: data.completados },
    { name: 'Pendientes', value: data.pendientes },
    { name: 'Vencidos', value: data.vencidos },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>

      {/* Cards principales */}
      <div className="grid grid-cols-4 gap-4">
        <Tarjeta
          label="Empleados activos"
          valor={data.total_empleados}
          sub="registrados en el sistema"
        />
        <Tarjeta
          label="Cursos activos"
          valor={data.total_cursos}
          sub="disponibles en la plataforma"
        />
        <Tarjeta
          label="Tasa de cumplimiento"
          valor={`${data.tasa_cumplimiento}%`}
          sub="del total de asignaciones"
          color={data.tasa_cumplimiento >= 70 ? 'text-green-600' : 'text-red-500'}
        />
        <Tarjeta
          label="Total asignaciones"
          valor={data.total_asignaciones}
          sub="cursos asignados en total"
        />
      </div>

      {/* Gráfica + desglose */}
      <div className="grid grid-cols-3 gap-4">

        {/* Gráfica dona */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Estado de asignaciones</p>
          {graficaData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Sin asignaciones registradas</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={graficaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={etiquetaPersonalizada}
                >
                  {graficaData.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} asignaciones`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Desglose */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Completados</p>
            <p className="text-3xl font-bold text-green-700">{data.completados}</p>
            <p className="text-xs text-green-500 mt-1">cursos finalizados</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-700">{data.pendientes}</p>
            <p className="text-xs text-yellow-500 mt-1">cursos en espera</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Vencidos</p>
            <p className="text-3xl font-bold text-red-600">{data.vencidos}</p>
            <p className="text-xs text-red-400 mt-1">superaron la fecha límite</p>
          </div>
        </div>
      </div>
    </div>
  )
}
