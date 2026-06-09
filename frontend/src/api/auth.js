const BASE_URL = import.meta.env.VITE_API_URL

export async function login(correo, contrasena) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: correo, password: contrasena }),
  })
  if (!res.ok) throw new Error('Correo o contraseña incorrectos')
  return res.json()
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUsuario() {
  const u = localStorage.getItem('usuario')
  return u ? JSON.parse(u) : null
}

export function guardarSesion(token, usuario) {
  localStorage.setItem('token', token)
  localStorage.setItem('usuario', JSON.stringify(usuario))
}

export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (res.status === 401) {
    cerrarSesion()
    window.location.href = '/login'
    return
  }
  return res
}
