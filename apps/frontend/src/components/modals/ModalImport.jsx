import { useState } from 'react';

export function ModalImport({ tipo, onImportar, onFechar }) {
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
