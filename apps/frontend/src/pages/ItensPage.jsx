import { useState } from 'react';
import Icons from '../icons';
import * as api from '../api';
import { EmptyState } from '../components/common/EmptyState';
import ImportItensModal from '../components/import/ImportItensModal';

const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'fardo', 'sc', 'sacos', 'm'];

export default function ItensPage({ 
  itensList, 
  setItensList, 
  departamentosList, 
  restauranteId, 
  toast, 
  confirmar 
}) {
  const [iProduto, setIProduto] = useState('')
  const [iQtd, setIQtd] = useState('')
  const [iUnidade, setIUnidade] = useState('un')
  const [iDeptId, setIDeptId] = useState('')
  const [iEditId, setIEditId] = useState(null)
  const [erroI, setErroI] = useState({})

  const [importModal, setImportModal] = useState(false)

  function limparForm() {
    setIProduto(''); setIQtd(''); setIUnidade('un'); setIDeptId('')
    setIEditId(null); setErroI({})
  }

  async function salvarItem() {
    const erros = {}
    if (!iProduto.trim()) erros.produto = 'Informe o produto'
    if (!iQtd || parseFloat(iQtd) <= 0) erros.qtd = 'Quantidade inválida'
    if (Object.keys(erros).length) { setErroI(erros); return }

    const body = {
      restaurante_id: restauranteId,
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
      limparForm()
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

  async function carregarItens() {
    try {
      const data = await api.itens.listar(restauranteId)
      setItensList(data)
    } catch {}
  }

  return (
    <section>
      {importModal && (
        <ImportItensModal
          restauranteId={restauranteId}
          departamentosList={departamentosList}
          onImportado={() => {
            carregarItens()
            toast('Importação concluída com sucesso!', 'success')
          }}
          onFechar={() => setImportModal(false)}
        />
      )}

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
          <button className="btn btn--add" style={{ flex: '0 0 auto', width: 'auto', padding: '11px 16px' }} onClick={limparForm}>
            Cancelar
          </button>
        )}
      </div>

      <button className="btn btn--add" style={{ marginTop: 8, borderStyle: 'dashed' }} onClick={() => setImportModal(true)}>
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
  )
}
