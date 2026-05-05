export function ModalConfirm({ mensagem, onSim, onNao }) {
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
