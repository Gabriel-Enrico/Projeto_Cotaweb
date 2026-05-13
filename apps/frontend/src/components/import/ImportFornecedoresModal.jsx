import { useState } from 'react'
import * as api from '../../api'

/**
 * Parser de texto colado no formato usado pelo cliente via WhatsApp:
 *
 * MERCEARIA
 * Dayse ACB DISTRIBUIDORA - 11987654321
 * Flavia Alimentos - 11912345678
 *
 * HORTIFRUTI
 * João Horti - 11933334444
 */
function parseFornecedores(texto) {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean)
  let departamentoAtual = ''
  const resultado = []

  for (const linha of linhas) {
    // Linha de departamento: toda em maiúsculas, sem traço/hífen
    const possivelmDept = /^[A-ZÁÉÍÓÚÂÊÔÃÈÀÜ\s]+$/.test(linha) && !linha.includes('-')
    if (possivelmDept && linha.length < 40) {
      departamentoAtual = linha
      continue
    }

    // Linha de fornecedor: deve ter um separador (traço ou vírgula) seguido de número de telefone
    const match = linha.match(/^(.+?)\s*[-,]\s*(\d[\d\s()+-]{8,15})$/)
    if (match) {
      const nome = match[1].trim()
      const telefone = match[2].replace(/\D/g, '') // só dígitos
      if (telefone.length >= 10 && telefone.length <= 11) {
        resultado.push({ nome, telefone, departamento: departamentoAtual })
      }
    }
  }

  return resultado
}

export default function ImportFornecedoresModal({ restauranteId, onImportado, onFechar }) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function handleParsear() {
    const parsed = parseFornecedores(texto)
    setPreview(parsed)
    setResultado(null)
  }

  async function handleImportar() {
    if (!preview || preview.length === 0) return
    setSalvando(true)
    try {
      const res = await api.importar.fornecedores({
        restaurante_id: restauranteId,
        fornecedores: preview,
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
        <h3 style={{ margin: '0 0 6px', fontWeight: 700 }}>📋 Importar Fornecedores</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
          Cole o texto do WhatsApp abaixo no formato:<br />
          <code style={{ fontSize: 12 }}>CATEGORIA{'\n'}Nome Fornecedor - 11999998888</code>
        </p>

        {!resultado && (
          <>
            <textarea
              rows={10}
              placeholder={'MERCEARIA\nDayse ACB DISTRIBUIDORA - 11987654321\nFlávia Alimentos - 11912345678\n\nHORTIFRUTI\nJoão Horti - 11933334444'}
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
                    ? '❌ Nenhum fornecedor reconhecido. Verifique o formato.'
                    : `✅ ${preview.length} fornecedor(es) reconhecido(s):`}
                </p>
                {preview.map((f, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8, background: 'var(--surface)',
                    border: '1px solid var(--border)', marginBottom: 6, fontSize: 13,
                  }}>
                    <strong>{f.nome}</strong>
                    <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{f.telefone}</span>
                    {f.departamento && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>#{f.departamento}</span>
                    )}
                  </div>
                ))}
                {preview.length > 0 && (
                  <button
                    onClick={handleImportar}
                    disabled={salvando}
                    style={{ ...btnStyle('#10b981'), marginTop: 12, display: 'block', width: '100%', padding: '10px' }}
                  >
                    {salvando ? 'Importando...' : `Importar ${preview.length} fornecedor(es)`}
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
