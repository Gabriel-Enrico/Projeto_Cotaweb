import { normalizarTel, validarTel } from './formatters.js';

export function parseFornecedoresTexto(texto) {
  return texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !(/^[A-ZÁÀÃÉÊÍÓÔÚÜÇ\s+]+$/.test(l) && l.length < 30))
    .map(linha => {
      const match = linha.match(/^(.+?)[\-–:]\s*(\d[\d\s\(\)\-]+)$/)
      if (!match) return null
      const nome = match[1].trim()
      const telefone = normalizarTel(match[2])
      if (!validarTel(telefone)) return null
      return { nome, telefone }
    })
    .filter(Boolean)
}

export function parseItensTexto(texto, restauranteId) {
  const unMap = { cx: 'cx', kg: 'kg', g: 'g', l: 'l', ml: 'ml', un: 'un', pct: 'pct', sacos: 'sacos', m: 'm', fardo: 'fardo', sc: 'sc' }
  return texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !(/^[A-ZÁÀÃÉÊÍÓÔÚÜÇ\s+]+$/.test(l) && l.length < 30))
    .map(linha => {
      const match = linha.match(/^(.+?)[\-–]\s*(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ÿ]+)?$/)
      if (!match) return null
      return {
        restaurante_id: restauranteId,
        produto: match[1].trim(),
        quantidade: parseFloat(match[2].replace(',', '.')),
        unidade: unMap[match[3]?.toLowerCase()] ?? 'un',
      }
    })
    .filter(Boolean)
}
