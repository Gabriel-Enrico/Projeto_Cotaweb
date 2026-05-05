export function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  )
}
