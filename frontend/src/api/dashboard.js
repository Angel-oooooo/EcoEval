import { getToken, apiFetch } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getResumen() {
  const res = await apiFetch(`${BASE_URL}/dashboard/resumen`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar el resumen')
  return res.json()
}
