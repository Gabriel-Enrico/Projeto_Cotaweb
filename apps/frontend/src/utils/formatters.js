export function initials(str) {
  return str.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export function normalizarTel(tel) {
  return tel.replace(/\D/g, '')
}

export function validarTel(tel) {
  return /^\d{10,11}$/.test(normalizarTel(tel))
}
