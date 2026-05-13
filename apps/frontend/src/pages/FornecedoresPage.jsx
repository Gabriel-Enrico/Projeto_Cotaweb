import { useState } from 'react';
import Icons from '../icons';
import { initials, normalizarTel, validarTel } from '../utils/formatters';
import * as api from '../api';
import { parseFornecedoresTexto } from '../utils/parsers';
import { EmptyState } from '../components/common/EmptyState';
import { ModalImport } from '../components/modals/ModalImport';

export default function FornecedoresPage({ 
  fornecedoresList, 
  setFornecedoresList, 
  restauranteId, 
  toast, 
  confirmar 
}) {
  const [fNome, setFNome] = useState('')
  const [fTel, setFTel] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fCnpj, setFCnpj] = useState('')
  const [fContato, setFContato] = useState('')
  const [fEditId, setFEditId] = useState(null)
  const [erroF, setErroF] = useState({})
  
  const [importModal, setImportModal] = useState(false)

  function limparForm() {
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
      restaurante_id: restauranteId,
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
      limparForm()
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

  async function processarImportacao(texto) {
    setImportModal(false)
    if (!texto.trim()) { toast('Cole algum conteúdo antes de importar.', 'warning'); return }

    let importados = 0, erros = 0
    const parsed = parseFornecedoresTexto(texto)
    
    if (!parsed.length) { toast('Nenhuma linha reconhecida.', 'warning'); return }
    
    for (const item of parsed) {
      try {
        const novo = await api.fornecedores.criar({ ...item, restaurante_id: restauranteId })
        setFornecedoresList(prev => [...prev, novo])
        importados++
      } catch { erros++ }
    }

    if (importados > 0) toast(`${importados} item(s) importado(s) com sucesso!`, 'success')
    if (erros > 0) toast(`${erros} linha(s) ignorada(s) por erro.`, 'warning')
  }

  return (
    <section>
      {importModal && (
        <ModalImport
          tipo="fornecedores"
          onImportar={processarImportacao}
          onFechar={() => setImportModal(false)}
        />
      )}

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
          <button className="btn btn--add" style={{ flex: '0 0 auto', width: 'auto', padding: '11px 16px' }} onClick={limparForm}>
            Cancelar
          </button>
        )}
      </div>

      <button className="btn btn--add" style={{ marginTop: 8, borderStyle: 'dashed' }} onClick={() => setImportModal(true)}>
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
  )
}
