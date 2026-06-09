import { getToken, apiFetch } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getMisCursos() {
  const res = await apiFetch(`${BASE_URL}/cursos/mis-cursos`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar tus cursos')
  return res.json()
}

export async function getMisResultados() {
  const res = await apiFetch(`${BASE_URL}/dashboard/mis-resultados`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar tus resultados')
  return res.json()
}

export async function getExamenParaResponder(examen_id) {
  const res = await apiFetch(`${BASE_URL}/examenes/${examen_id}`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar el examen')
  return res.json()
}

export async function responderExamen(examen_id, respuestas) {
  const res = await apiFetch(`${BASE_URL}/examenes/responder`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ examen_id, respuestas }),
  })
  if (!res.ok) throw new Error('Error al enviar respuestas')
  return res.json()
}
