import { useState } from 'react'
import * as api from '../../api'

/**
 * Parser de lista de compras colada do WhatsApp:
 *
 * PROTEINAS
 * Alcatra / miolo da alcatra – 3 CX
 * Bacon pedaço – 2 CX
 * Filé de frango – 6 KG
 *
 * MERCEARIA
 * Arroz tipo 1 – 10 PCT
 */
function parseItens(texto) {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean)
  const resultado = []

  for (const linha of linhas) {
    // Detecta separador: traço (–), hífen (-) ou ponto
    const match = linha.match(/^(.+?)\s*[–\-—]\s*(\d+[\d.,]*)\s*([A-Za-z]+)?\s*$/)
    if (match) {
      const produto = match[1].trim()
      const quantidade = parseFloat(match[2].replace(',', '.')) || 0
      const unidade = (match[3] || 'un').toLowerCase()
      if (produto.length >= 2) {
        resultado.push({ produto, quantidade, unidade })
      }
    } else {
      // Linha sem quantidade — apenas nome de produto
      const possivelmDept = /^[A-ZÁÉÍÓÚÂÊÔÃÈÀÜ\s]+$/.test(linha) && linha.length < 40
      if (!possivelmDept && linha.length >= 2) {
        resultado.push({ produto: linha, quantidade: 0, unidade: 'un' })
      }
    }
  }

  return resultado
}

export default function ImportItensModal({ restauranteId, departamentosList, onImportado, onFechar }) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState(null)
  const [deptId, setDeptId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function handleParsear() {
    const parsed = parseItens(texto)
    setPreview(parsed)
    setResultado(null)
  }

  async function handleImportar() {
    if (!preview || preview.length === 0) return
    setSalvando(true)
    try {
      const itensComDept = preview.map(item => ({
        ...item,
        ...(deptId ? { departamento_id: Number(deptId) } : {}),
      }))
      const res = await api.importar.itens({
        restaurante_id: restauranteId,
        itens: itensComDept,
      })
      setResultado(res?.data ?? res)
      onImportado?.()
      setPreview(null)
      setTexto('')
    } catch (e) {
      setResultado({ error: e.message })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onFechar}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 6px', fontWeight: 700 }}>📋 Importar Lista de Compras</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
          Cole a lista do WhatsApp:<br />
          <code style={{ fontSize: 12 }}>Alcatra – 3 CX{'\n'}Filé de frango – 6 KG</code>
        </p>

        {!resultado && (
          <>
            {departamentosList?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Departamento (opcional)
                </label>
                <select
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 14,
                  }}
                >
                  <option value="">Sem departamento</option>
                  {departamentosList.map(d => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              rows={10}
              placeholder={'Alcatra / miolo da alcatra – 3 CX\nBacon pedaço – 2 CX\nFilé de frango – 6 KG\nArroz tipo 1 – 10 PCT'}
              value={texto}
              onChange={e => { setTexto(e.target.value); setPreview(null) }}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', fontSize: 13, fontFamily: 'monospace',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={onFechar} style={btnStyle('#6b7280')}>Cancelar</button>
              <button onClick={handleParsear} disabled={!texto.trim()} style={btnStyle('#f59e0b')}>
                Visualizar Preview
              </button>
            </div>

            {preview !== null && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  {preview.length === 0
                    ? '❌ Nenhum item reconhecido. Verifique o formato.'
                    : `✅ ${preview.length} item(ns) reconhecido(s):`}
                </p>
                {preview.map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, background: 'var(--surface)',
                    border: '1px solid var(--border)', marginBottom: 6, fontSize: 13,
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{item.produto}</span>
                    <span style={{ color: 'var(--muted)' }}>{item.quantidade} {item.unidade}</span>
                  </div>
                ))}
                {preview.length > 0 && (
                  <button
                    onClick={handleImportar}
                    disabled={salvando}
                    style={{ ...btnStyle('#10b981'), marginTop: 12, display: 'block', width: '100%', padding: '10px' }}
                  >
                    {salvando ? 'Importando...' : `Importar ${preview.length} item(ns)`}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {resultado && !resultado.error && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Importação concluída!</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {resultado.criados} criado(s) · {resultado.ignorados} ignorado(s) (já existiam)
            </p>
            <button onClick={onFechar} style={{ ...btnStyle('#10b981'), marginTop: 16 }}>Fechar</button>
          </div>
        )}

        {resultado?.error && (
          <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
            Erro: {resultado.error}
            <button onClick={() => setResultado(null)} style={{ ...btnStyle('#ef4444'), marginLeft: 8 }}>Tentar novamente</button>
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 16,
}

const modalStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '28px 24px', width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto',
}

function btnStyle(color) {
  return {
    padding: '7px 16px', borderRadius: 7, border: 'none',
    background: color + '22', color: color,
    fontWeight: 700, cursor: 'pointer', fontSize: 13,
  }
}
