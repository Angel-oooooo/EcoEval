import { getToken, apiFetch } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getCursos() {
  const res = await apiFetch(`${BASE_URL}/cursos/`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar cursos')
  return res.json()
}

export async function crearCurso(data) {
  const res = await apiFetch(`${BASE_URL}/cursos/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear curso')
  return res.json()
}

export async function editarCurso(id, data) {
  const res = await apiFetch(`${BASE_URL}/cursos/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al editar curso')
  return res.json()
}

export async function desactivarCurso(id) {
  const res = await apiFetch(`${BASE_URL}/cursos/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Error al desactivar curso')
  return res.json()
}

export async function getEmpleadosPorCurso(curso_id) {
  const res = await apiFetch(`${BASE_URL}/dashboard/curso/${curso_id}`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar asignaciones')
  return res.json()
}

export async function asignarCurso(data) {
  const res = await apiFetch(`${BASE_URL}/cursos/asignar`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al asignar curso')
  return res.json()
}
