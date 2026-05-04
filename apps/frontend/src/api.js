const BASE = '/api'

async function req(endpoint, options = {}, retry = true) {
  const headers = {}
  if (options.body) headers['Content-Type'] = 'application/json'
 
  const token = localStorage.getItem('accessToken')
  if (token) headers['Authorization'] = `Bearer ${token}`
 
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // envia cookie httpOnly do refreshToken
    headers: { ...headers, ...(options.headers || {}) },
  })
 
  if (res.status === 204) return null
 
  // Auto-refresh: se 401 e ainda não tentou
  if (res.status === 401 && retry) {
    const refreshed = await auth.refresh()
    if (refreshed) {
      return req(endpoint, options, false) // repete a chamada original
    }
    // Refresh falhou — desloga
    localStorage.removeItem('accessToken')
    window.dispatchEvent(new Event('auth:logout'))
    throw new Error('Sessão expirada. Faça login novamente.')
  }
 
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Erro ${res.status}`)
  return data
}

export const auth = {
  registrar: (body) => 
    req('auth/registrar', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: async ({ email, senha }) => {
    const data = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    })
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken)
    }
    return data
  },

  refresh: async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: async () => {
    await fetch(`${BASE}/auth/logout`, {
      method: 'POST', 
      credentials: 'include'
    })
    localStorage.removeItem('accessToken')
  },

  me: () => req('/auth/me'),
}

export const restaurantes = {
  listar: () => req('/restaurantes'),
  buscar: (id) => req(`/restaurantes/${id}`),
  criar: (body) => req('/restaurantes', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => req(`/restaurantes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
}

export const departamentos = {
  listar: (restauranteId) => req(`/restaurantes/${restauranteId}/departamentos`),
  criar: (body) => req('/departamentos', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => req(`/departamentos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletar: (id) => req(`/departamentos/${id}`, { method: 'DELETE' }),
}

export const fornecedores = {
  listar: (restauranteId) => req(`/restaurantes/${restauranteId}/fornecedores`),
  buscar: (id) => req(`/fornecedores/${id}`),
  criar: (body) => req('/fornecedores', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => req(`/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletar: (id) => req(`/fornecedores/${id}`, { method: 'DELETE' }),
}

export const itens = {
  listar: (restauranteId) => req(`/restaurantes/${restauranteId}/itens`),
  buscar: (id) => req(`/itens/${id}`),
  criar: (body) => req('/itens', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => req(`/itens/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletar: (id) => req(`/itens/${id}`, { method: 'DELETE' }),
}

export const cotacoes = {
  listar: (restauranteId) => req(`/restaurantes/${restauranteId}/cotacoes`),
  buscar: (id) => req(`/cotacoes/${id}`),
  comparar: (id) => req(`/cotacoes/${id}/comparar`),
  criar: (body) => req('/cotacoes', { method: 'POST', body: JSON.stringify(body) }),
  enviar: (id) => req(`/cotacoes/${id}/enviar`, { method: 'POST' }),
  finalizar: (id) => req(`/cotacoes/${id}/finalizar`, { method: 'POST' }),
  buscarPorToken: (token) => req(`/responder/${token}`),
  responder: (token, body) => req(`/responder/${token}`, { method: 'POST', body: JSON.stringify(body) }),
}
