import { getToken } from './auth'

const BASE_URL = 'http://localhost:8000'

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getExamenes() {
  const res = await fetch(`${BASE_URL}/examenes/`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar exámenes')
  return res.json()
}

export async function crearExamen(data) {
  const res = await fetch(`${BASE_URL}/examenes/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear examen')
  return res.json()
}

export async function eliminarExamen(id) {
  const res = await fetch(`${BASE_URL}/examenes/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Error al eliminar examen')
  return res.json()
}
