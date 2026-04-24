import { useState, useEffect, useCallback } from 'react'
import './App.css'
import * as api from './api'
import Icons from './icons'

const RESTAURANTE_ID = 1
const NOME_APP = 'COTAWEB'
const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'fardo', 'sc', 'sacos', 'm']


function initials(str) {
  return str.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function normalizarTel(tel) {
  return tel.replace(/\D/g, '')
}

function validarTel(tel) {
  return /^\d{10,11}$/.test(normalizarTel(tel))
}

function parseFornecedoresTexto(texto) {
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

function parseItensTexto(texto, restauranteId) {
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

function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  )
}

function Toast({ toasts }) {
  const iconMap = { success: Icons.check, error: Icons.error, warning: Icons.warning, info: Icons.info }
  return (
    <div className="toast-wrapper">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.tipo}`}>
          <span className="toast-icon">{iconMap[t.tipo]}</span>
          {t.mensagem}
        </div>
      ))}
    </div>
  )
}

function ModalConfirm({ mensagem, onSim, onNao }) {
  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <p>{mensagem}</p>
        <div className="modal-actions">
          <button className="btn-sim" onClick={onSim}>Confirmar</button>
          <button className="btn-nao" onClick={onNao}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function ModalImport({ tipo, onImportar, onFechar }) {
  const [texto, setTexto] = useState('')
  const dica = tipo === 'fornecedores'
    ? 'Cole os contatos do WhatsApp. Formato: "Nome - 11987654321"'
    : 'Cole a lista de pedidos. Formato: "Produto – 3 CX" (traço entre produto e quantidade)'

  return (
    <div className="modal-overlay show">
      <div className="modal-box modal-import-box">
        <h3>{tipo === 'fornecedores' ? 'Colar lista de fornecedores' : 'Colar lista de pedidos'}</h3>
        <p className="import-dica">{dica}</p>
        <textarea rows={10} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Cole o texto aqui..." />
        <div className="modal-actions">
          <button className="btn-sim" onClick={() => onImportar(texto)}>Importar</button>
          <button className="btn-nao" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [aba, setAba] = useState('fornecedores')
  const [fornecedoresList, setFornecedoresList] = useState([])
  const [itensList, setItensList] = useState([])
  const [departamentosList, setDepartamentosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaCotacaoId, setUltimaCotacaoId] = useState(null)

  const [toasts, setToasts] = useState([])
  const toast = useCallback((mensagem, tipo = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, mensagem, tipo }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const [confirm, setConfirm] = useState(null)
  const confirmar = (mensagem) => new Promise(resolve => setConfirm({ mensagem, resolve }))

  const [importModal, setImportModal] = useState(null)

  const [fNome, setFNome] = useState('')
  const [fTel, setFTel] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fCnpj, setFCnpj] = useState('')
  const [fContato, setFContato] = useState('')
  const [fEditId, setFEditId] = useState(null)
  const [erroF, setErroF] = useState({})

  const [iProduto, setIProduto] = useState('')
  const [iQtd, setIQtd] = useState('')
  const [iUnidade, setIUnidade] = useState('un')
  const [iDeptId, setIDeptId] = useState('')
  const [iEditId, setIEditId] = useState(null)
  const [erroI, setErroI] = useState({})

  const carregarFornecedores = useCallback(async () => {
    try {
      const data = await api.fornecedores.listar(RESTAURANTE_ID)
      setFornecedoresList(data)
    } catch (err) {
      toast('Erro ao carregar fornecedores: ' + err.message, 'error')
    }
  }, [toast])

  const carregarItens = useCallback(async () => {
    try {
      const data = await api.itens.listar(RESTAURANTE_ID)
      setItensList(data)
    } catch (err) {
      toast('Erro ao carregar itens: ' + err.message, 'error')
    }
  }, [toast])

  const carregarDepartamentos = useCallback(async () => {
    try {
      const data = await api.departamentos.listar(RESTAURANTE_ID)
      setDepartamentosList(data)
    } catch (err) {
    }
  }, [])

  useEffect(() => {
    Promise.all([carregarFornecedores(), carregarItens(), carregarDepartamentos()])
      .finally(() => setLoading(false))
  }, [carregarFornecedores, carregarItens, carregarDepartamentos])

  function limparFormFornecedor() {
    setFNome(''); setFTel(''); setFEmail(''); setFCnpj(''); setFContato('')
    setFEditId(null); setErroF({})
  }

  async function salvarFornecedor() {
    const erros = {}
    if (!fNome.trim()) erros.nome = 'Informe o nome'
    if (!fTel.trim()) erros.tel = 'Informe o WhatsApp com DDD'
    else if (!validarTel(fTel)) erros.tel = 'Telefone inválido (10 ou 11 dígitos)'
    if (Object.keys(erros).length) { setErroF(erros); return }

    const body = {
      restaurante_id: RESTAURANTE_ID,
      nome: fNome.trim(),
      telefone: normalizarTel(fTel),
      email: fEmail.trim() || undefined,
      cnpj: fCnpj.trim() || undefined,
      contato_nome: fContato.trim() || undefined,
    }

    try {
      if (fEditId) {
        const atualizado = await api.fornecedores.atualizar(fEditId, body)
        setFornecedoresList(prev => prev.map(f => f.id === fEditId ? atualizado : f))
        toast(`Fornecedor "${atualizado.nome}" atualizado!`, 'success')
      } else {
        const novo = await api.fornecedores.criar(body)
        setFornecedoresList(prev => [...prev, novo])
        toast(`Fornecedor "${novo.nome}" adicionado!`, 'success')
      }
      limparFormFornecedor()
    } catch (err) {
      toast('Erro: ' + err.message, 'error')
    }
  }

  function editarFornecedor(f) {
    setFEditId(f.id)
    setFNome(f.nome)
    setFTel(f.telefone)
    setFEmail(f.email || '')
    setFCnpj(f.cnpj || '')
    setFContato(f.contato_nome || '')
    setErroF({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function removerFornecedor(f) {
    const ok = await confirmar(`Remover "${f.nome}"?`)
    if (!ok) return
    try {
      await api.fornecedores.deletar(f.id)
      setFornecedoresList(prev => prev.filter(x => x.id !== f.id))
      toast('Fornecedor removido.', 'success')
    } catch (err) {
      toast('Erro ao remover: ' + err.message, 'error')
    }
  }

  function limparFormItem() {
    setIProduto(''); setIQtd(''); setIUnidade('un'); setIDeptId('')
    setIEditId(null); setErroI({})
  }

  async function salvarItem() {
    const erros = {}
    if (!iProduto.trim()) erros.produto = 'Informe o produto'
    if (!iQtd || parseFloat(iQtd) <= 0) erros.qtd = 'Quantidade inválida'
    if (Object.keys(erros).length) { setErroI(erros); return }

    const body = {
      restaurante_id: RESTAURANTE_ID,
      produto: iProduto.trim(),
      quantidade: parseFloat(iQtd),
      unidade: iUnidade,
      departamento_id: iDeptId ? Number(iDeptId) : undefined,
    }

    try {
      if (iEditId) {
        const atualizado = await api.itens.atualizar(iEditId, body)
        setItensList(prev => prev.map(i => i.id === iEditId ? atualizado : i))
        toast(`Item "${atualizado.produto}" atualizado!`, 'success')
      } else {
        const novo = await api.itens.criar(body)
        setItensList(prev => [...prev, novo])
        toast(`Item "${novo.produto}" adicionado!`, 'success')
      }
      limparFormItem()
    } catch (err) {
      toast('Erro: ' + err.message, 'error')
    }
  }

  function editarItem(item) {
    setIEditId(item.id)
    setIProduto(item.produto)
    setIQtd(String(item.quantidade))
    setIUnidade(item.unidade)
    setIDeptId(item.departamento_id ? String(item.departamento_id) : '')
    setErroI({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function removerItem(item) {
    const ok = await confirmar(`Remover "${item.produto}"?`)
    if (!ok) return
    try {
      await api.itens.deletar(item.id)
      setItensList(prev => prev.filter(x => x.id !== item.id))
      toast('Item removido.', 'success')
    } catch (err) {
      toast('Erro ao remover: ' + err.message, 'error')
    }
  }

  async function processarImportacao(texto) {
    setImportModal(null)
    if (!texto.trim()) { toast('Cole algum conteúdo antes de importar.', 'warning'); return }

    let importados = 0, erros = 0

    if (importModal === 'fornecedores') {
      const parsed = parseFornecedoresTexto(texto)
      if (!parsed.length) { toast('Nenhuma linha reconhecida.', 'warning'); return }
      for (const item of parsed) {
        try {
          const novo = await api.fornecedores.criar({ ...item, restaurante_id: RESTAURANTE_ID })
          setFornecedoresList(prev => [...prev, novo])
          importados++
        } catch { erros++ }
      }
    } else {
      const parsed = parseItensTexto(texto, RESTAURANTE_ID)
      if (!parsed.length) { toast('Nenhuma linha reconhecida.', 'warning'); return }
      for (const item of parsed) {
        try {
          const novo = await api.itens.criar(item)
          setItensList(prev => [...prev, novo])
          importados++
        } catch { erros++ }
      }
    }

    if (importados > 0) toast(`${importados} item(s) importado(s) com sucesso!`, 'success')
    if (erros > 0) toast(`${erros} linha(s) ignorada(s) por erro.`, 'warning')
  }

  async function enviarWhatsApp() {
    if (!fornecedoresList.length || !itensList.length) {
      toast('Adicione fornecedores e itens antes de enviar!', 'warning')
      return
    }

    try {
      const cotacao = await api.cotacoes.criar({
        restaurante_id: RESTAURANTE_ID,
        titulo: `Cotação ${new Date().toLocaleDateString('pt-BR')}`,
        itens: itensList.map(i => ({
          item_id: i.id,
          produto: i.produto,
          unidade: i.unidade,
          quantidade: Number(i.quantidade),
        })),
        fornecedor_ids: fornecedoresList.map(f => f.id),
      })

      await api.cotacoes.enviar(cotacao.id)
      setUltimaCotacaoId(cotacao.id)

      const completa = await api.cotacoes.buscar(cotacao.id)
      const linhaItens = itensList.map(i => `• ${i.produto}: ${i.quantidade} ${i.unidade}`).join('\n')

      completa.fornecedores.forEach(cf => {
        const linkResposta = `${window.location.origin}/responder/${cf.token_resposta}`
        const msg =
          `*Cotação de Preços — ${NOME_APP}*\n\n` +
          `Olá, ${cf.fornecedor_nome}!\n\n` +
          `*Itens para cotar:*\n${linhaItens}\n\n` +
          `*Informe seus preços aqui:*\n${linkResposta}\n\n` +
          `Obrigado!`
        window.open(`https://wa.me/${cf.fornecedor_telefone}?text=${encodeURIComponent(msg)}`, '_blank')
      })

      toast(`Cotação enviada para ${completa.fornecedores.length} fornecedor(es)!`, 'success')
    } catch (err) {
      toast('Erro ao criar cotação: ' + err.message, 'error')
    }
  }

  async function exportarExcel() {
    try {
      let cotacaoId = ultimaCotacaoId
      if (!cotacaoId) {
        const cotacao = await api.cotacoes.criar({
          restaurante_id: RESTAURANTE_ID,
          titulo: `Cotação ${new Date().toLocaleDateString('pt-BR')}`,
          itens: itensList.map(i => ({
            item_id: i.id,
            produto: i.produto,
            unidade: i.unidade,
            quantidade: Number(i.quantidade),
          })),
          fornecedor_ids: fornecedoresList.map(f => f.id),
        })
        await api.cotacoes.enviar(cotacao.id)
        setUltimaCotacaoId(cotacao.id)
        cotacaoId = cotacao.id
      }
      window.open(`/api/exportar/cotacao/${cotacaoId}`, '_blank')
    } catch (err) {
      toast('Erro ao exportar: ' + err.message, 'error')
    }
  }

  const podeEnviar = fornecedoresList.length > 0 && itensList.length > 0

  const tabs = [
    { id: 'fornecedores', label: 'Fornecedores', icon: Icons.users, count: fornecedoresList.length },
    { id: 'itens', label: 'Produtos', icon: Icons.cart, count: itensList.length },
    { id: 'enviar', label: 'Enviar', icon: Icons.send, count: null },
  ]

  return (
    <div className="page">
      <Toast toasts={toasts} />

      {confirm && (
        <ModalConfirm
          mensagem={confirm.mensagem}
          onSim={() => { confirm.resolve(true); setConfirm(null) }}
          onNao={() => { confirm.resolve(false); setConfirm(null) }}
        />
      )}

      {importModal && (
        <ModalImport
          tipo={importModal}
          onImportar={processarImportacao}
          onFechar={() => setImportModal(null)}
        />
      )}

      <div className="card">

        <header className="header">
          <div className="logo">
            <span className="logo-mark">C</span>
            <span className="logo-text">{NOME_APP}</span>
          </div>
          <p className="logo-sub">Cotação via WhatsApp</p>
        </header>

        <nav className="tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab ${aba === t.id ? 'tab--active' : ''}`}
              onClick={() => setAba(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              {t.label}
              {t.count > 0 && <span className="tab-badge">{t.count}</span>}
            </button>
          ))}
        </nav>

        <div className="body">

          {loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Carregando...</p>}

          {!loading && aba === 'fornecedores' && (
            <section>
              <div className="field">
                <label>Nome do fornecedor *</label>
                <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Distribuidora São Jorge" />
                {erroF.nome && <span className="err">{erroF.nome}</span>}
              </div>

              <div className="field">
                <label>WhatsApp * (com DDD)</label>
                <input value={fTel} onChange={e => setFTel(e.target.value)} placeholder="Ex: 11987654321" />
                {erroF.tel && <span className="err">{erroF.tel}</span>}
              </div>

              <div className="field">
                <label>E-mail (opcional)</label>
                <input value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="fornecedor@email.com" />
              </div>

              <div className="row">
                <div className="field">
                  <label>CNPJ (opcional)</label>
                  <input value={fCnpj} onChange={e => setFCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
                </div>
                <div className="field">
                  <label>Nome do contato</label>
                  <input value={fContato} onChange={e => setFContato(e.target.value)} placeholder="João" />
                </div>
              </div>

              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn btn--add" style={{ flex: 1 }} onClick={salvarFornecedor}>
                  <span className="btn-icon">{fEditId ? Icons.save : null}</span>
                  {fEditId ? 'Salvar alterações' : '+ Adicionar fornecedor'}
                </button>
                {fEditId && (
                  <button className="btn btn--add" style={{ flex: '0 0 auto', width: 'auto', padding: '11px 16px' }} onClick={limparFormFornecedor}>
                    Cancelar
                  </button>
                )}
              </div>

              <button className="btn btn--add" style={{ marginTop: 8, borderStyle: 'dashed' }} onClick={() => setImportModal('fornecedores')}>
                <span className="btn-icon">{Icons.import}</span> Colar do WhatsApp
              </button>

              <ul className="list">
                {fornecedoresList.length === 0
                  ? <EmptyState icon={Icons.users} text="Nenhum fornecedor ainda" />
                  : fornecedoresList.map(f => (
                    <li key={f.id} className="list-item">
                      <div className="avatar avatar--blue">{initials(f.nome)}</div>
                      <div className="list-info">
                        <strong>{f.nome}</strong>
                        <span>
                          <span className="list-meta-icon">{Icons.phone}</span>
                          {f.telefone}{f.email ? ` · ${f.email}` : ''}
                        </span>
                      </div>
                      <button className="btn-rm" title="Editar" onClick={() => editarFornecedor(f)}>{Icons.edit}</button>
                      <button className="btn-rm" title="Remover" onClick={() => removerFornecedor(f)}>{Icons.trash}</button>
                    </li>
                  ))
                }
              </ul>
            </section>
          )}

          {!loading && aba === 'itens' && (
            <section>
              <div className="field">
                <label>Produto *</label>
                <input value={iProduto} onChange={e => setIProduto(e.target.value)} placeholder="Ex: Alcatra" />
                {erroI.produto && <span className="err">{erroI.produto}</span>}
              </div>

              <div className="row">
                <div className="field">
                  <label>Quantidade *</label>
                  <input type="number" min="0.01" step="0.01" value={iQtd} onChange={e => setIQtd(e.target.value)} />
                  {erroI.qtd && <span className="err">{erroI.qtd}</span>}
                </div>
                <div className="field field--unit">
                  <label>Unidade</label>
                  <select value={iUnidade} onChange={e => setIUnidade(e.target.value)}>
                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {departamentosList.length > 0 && (
                <div className="field">
                  <label>Departamento (opcional)</label>
                  <select value={iDeptId} onChange={e => setIDeptId(e.target.value)}>
                    <option value="">— sem departamento —</option>
                    {departamentosList.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn btn--add" style={{ flex: 1 }} onClick={salvarItem}>
                  <span className="btn-icon">{iEditId ? Icons.save : null}</span>
                  {iEditId ? 'Salvar alterações' : '+ Adicionar item'}
                </button>
                {iEditId && (
                  <button className="btn btn--add" style={{ flex: '0 0 auto', width: 'auto', padding: '11px 16px' }} onClick={limparFormItem}>
                    Cancelar
                  </button>
                )}
              </div>

              <button className="btn btn--add" style={{ marginTop: 8, borderStyle: 'dashed' }} onClick={() => setImportModal('itens')}>
                <span className="btn-icon">{Icons.import}</span> Colar do WhatsApp
              </button>

              <ul className="list">
                {itensList.length === 0
                  ? <EmptyState icon={Icons.cart} text="Nenhum item na lista" />
                  : itensList.map(i => (
                    <li key={i.id} className="list-item">
                      <div className="avatar avatar--green">{i.produto[0]?.toUpperCase()}</div>
                      <div className="list-info">
                        <strong>{i.produto}</strong>
                        <span>
                          {i.quantidade} {i.unidade}
                          {i.departamento_nome ? ` · ${i.departamento_nome}` : ''}
                        </span>
                      </div>
                      <button className="btn-rm" title="Editar" onClick={() => editarItem(i)}>{Icons.edit}</button>
                      <button className="btn-rm" title="Remover" onClick={() => removerItem(i)}>{Icons.trash}</button>
                    </li>
                  ))
                }
              </ul>
            </section>
          )}

          {!loading && aba === 'enviar' && (
            <section>
              {!podeEnviar ? (
                <div className="alert">
                  <p>Adicione fornecedores e itens antes de enviar a cotação.</p>
                </div>
              ) : (
                <>
                  <div className="resumo">
                    <h3>Resumo da cotação</h3>
                    <div className="resumo-row">
                      <span>Fornecedores</span>
                      <span className="tag">{fornecedoresList.length}</span>
                    </div>
                    <div className="resumo-row">
                      <span>Produtos</span>
                      <span className="tag">{itensList.length}</span>
                    </div>
                  </div>

                  <button className="btn btn--whatsapp" onClick={enviarWhatsApp}>
                    <span className="btn-icon">{Icons.whatsapp}</span>
                    Enviar cotação por WhatsApp
                  </button>

                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
                    Cria a cotação no sistema e abre o WhatsApp para cada fornecedor com link de resposta.
                  </p>

                  <button className="btn btn--excel" onClick={exportarExcel} style={{ marginTop: 12 }}>
                    <span className="btn-icon">{Icons.excel}</span>
                    Exportar comparativo (.xlsx)
                  </button>
                </>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  )
}