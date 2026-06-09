import { getToken, apiFetch } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getUsuarios() {
  const res = await apiFetch(`${BASE_URL}/usuarios/`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar usuarios')
  return res.json()
}

export async function crearUsuario(data) {
  const res = await apiFetch(`${BASE_URL}/auth/registro`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear usuario')
  return res.json()
}

export async function editarUsuario(id, data) {
  const res = await apiFetch(`${BASE_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al editar usuario')
  return res.json()
}

export async function getCursosDeEmpleado(usuario_id) {
  const res = await apiFetch(`${BASE_URL}/dashboard/empleado/${usuario_id}`, { headers: headers() })
  if (!res.ok) throw new Error('Error al cargar cursos del empleado')
  return res.json()
}

export async function desactivarUsuario(id) {
  const res = await apiFetch(`${BASE_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('Error al desactivar usuario')
  return res.json()
}
