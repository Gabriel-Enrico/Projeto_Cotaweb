const BASE = '/api'

async function req(endpoint, options = {}) {
  const headers = {}
  if (options.body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Erro ${res.status}`)
  return data
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
