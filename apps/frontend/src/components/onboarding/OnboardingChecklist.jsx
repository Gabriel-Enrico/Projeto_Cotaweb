/**
 * OnboardingChecklist — aparece quando o usuário ainda não tem
 * fornecedores nem itens cadastrados, guiando o primeiro acesso.
 */
export default function OnboardingChecklist({ fornecedores, itens, onAbrirFornecedores, onAbrirItens, onAbrirEnviar }) {
  const temFornecedores = fornecedores > 0
  const temItens = itens > 0

  const passos = [
    {
      numero: 1,
      titulo: 'Adicione seus fornecedores',
      descricao: 'Cadastre os distribuidores que você já usa — pode colar a lista do WhatsApp direto aqui.',
      feito: temFornecedores,
      acao: 'Adicionar / Importar',
      onClick: onAbrirFornecedores,
      cor: '#7c3aed',
    },
    {
      numero: 2,
      titulo: 'Crie sua lista de compras',
      descricao: 'Informe os produtos que deseja cotar. Também pode colar a lista de pedidos do WhatsApp.',
      feito: temItens,
      acao: 'Adicionar / Importar',
      onClick: onAbrirItens,
      cor: '#0ea5e9',
    },
    {
      numero: 3,
      titulo: 'Envie sua primeira cotação',
      descricao: 'Selecione fornecedores e produtos — a CotaWeb dispara tudo via WhatsApp automaticamente.',
      feito: false,
      acao: temFornecedores && temItens ? 'Enviar agora!' : 'Disponível após os passos 1 e 2',
      onClick: temFornecedores && temItens ? onAbrirEnviar : null,
      cor: '#10b981',
    },
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed18, #0ea5e918)',
        border: '1px solid #7c3aed33',
        borderRadius: 14, padding: '24px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>👋 Bem-vindo(a) ao CotaWeb!</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Para realizar sua primeira cotação, complete os passos abaixo:
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {passos.map((passo) => (
          <div key={passo.numero} style={{
            display: 'flex', gap: 16, alignItems: 'flex-start',
            background: 'var(--surface)', border: `1px solid ${passo.feito ? passo.cor + '44' : 'var(--border)'}`,
            borderRadius: 12, padding: '16px 20px',
            opacity: passo.numero > 1 && !passos[passo.numero - 2].feito ? 0.5 : 1,
          }}>
            {/* Indicador */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: passo.feito ? passo.cor : passo.cor + '22',
              color: passo.feito ? '#fff' : passo.cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 15,
            }}>
              {passo.feito ? '✓' : passo.numero}
            </div>

            {/* Texto */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 700, fontSize: 15, marginBottom: 4,
                textDecoration: passo.feito ? 'line-through' : 'none',
                color: passo.feito ? 'var(--muted)' : 'var(--text)',
              }}>
                {passo.titulo}
              </div>
              {!passo.feito && (
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                  {passo.descricao}
                </p>
              )}
              {!passo.feito && (
                <button
                  onClick={passo.onClick || undefined}
                  disabled={!passo.onClick}
                  style={{
                    padding: '7px 16px', borderRadius: 8, border: 'none',
                    background: passo.onClick ? passo.cor : 'var(--border)',
                    color: passo.onClick ? '#fff' : 'var(--muted)',
                    fontWeight: 700, cursor: passo.onClick ? 'pointer' : 'default',
                    fontSize: 13,
                  }}
                >
                  {passo.acao}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
