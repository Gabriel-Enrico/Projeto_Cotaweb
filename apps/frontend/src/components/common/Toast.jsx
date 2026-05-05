import Icons from '../../icons';

export function Toast({ toasts }) {
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
