import { getToken } from './auth'

const BASE_URL = 'http://localhost:8000'

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getResumen() {
  const res = await fetch(`${BASE_URL}/dashboard/resumen`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar el resumen')
  return res.json()
}
