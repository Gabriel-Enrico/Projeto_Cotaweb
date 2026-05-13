import { useState, useEffect, useCallback } from 'react'
import * as api from '../../api'
import Icons from '../../icons'

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconLogOut = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconToggleOn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
    <circle cx="16" cy="12" r="3"/>
  </svg>
)

const IconToggleOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
    <circle cx="8" cy="12" r="3"/>
  </svg>
)

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const STATUS_LABELS = {
  degustacao: { label: 'Degustação', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  ativo:      { label: 'Ativo',      color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  suspenso:   { label: 'Suspenso',   color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  cancelado:  { label: 'Cancelado',  color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
}

/**
 * Mostra o progresso do onboarding de um restaurante.
 * passos: fornecedores cadastrados → itens cadastrados → cotação enviada
 */
function OnboardingProgress({ onboarding }) {
  if (!onboarding) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>

  const { fornecedores, itens, cotacoes } = onboarding

  const passos = [
    { label: 'Fornecedores', feito: fornecedores > 0, valor: fornecedores, cor: '#7c3aed' },
    { label: 'Itens',        feito: itens > 0,        valor: itens,        cor: '#0ea5e9' },
    { label: 'Cotação',      feito: cotacoes > 0,     valor: cotacoes,     cor: '#16a34a' },
  ]

  const concluidos = passos.filter(p => p.feito).length
  const travado = concluidos === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 140 }}>
      {/* Barra de progresso */}
      <div style={{ display: 'flex', gap: 3 }}>
        {passos.map((p, i) => (
          <div
            key={i}
            title={`${p.label}: ${p.feito ? p.valor : 'nenhum'}`}
            style={{
              flex: 1, height: 5, borderRadius: 99,
              background: p.feito ? p.cor : '#e5e7eb',
              transition: 'background .2s',
            }}
          />
        ))}
      </div>

      {/* Rótulos dos passos */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {passos.map((p, i) => (
          <span key={i} style={{
            fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
            color: p.feito ? p.cor : '#9ca3af',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {p.feito
              ? <span style={{ color: p.cor }}>✓</span>
              : <span style={{ color: '#d1d5db' }}>○</span>
            }
            {p.feito ? `${p.label} (${p.valor})` : p.label}
          </span>
        ))}
      </div>

      {/* Alerta de cliente travado */}
      {travado && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 700, color: '#b45309',
          background: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 99, padding: '1px 7px', width: 'fit-content',
          fontFamily: 'var(--mono)',
        }}>
          <IconAlert /> TRAVADO
        </span>
      )}
    </div>
  )
}

function Badge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.05em', fontFamily: 'var(--mono)',
    }}>
      {s.label.toUpperCase()}
    </span>
  )
}

function StatCard({ label, value, color, icon, alert }) {
  return (
    <div style={{
      background: alert ? '#fef3c7' : 'var(--card)',
      border: `1px solid ${alert ? '#fde68a' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '18px 22px', minWidth: 120, flex: 1,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ color: color || 'var(--muted)', opacity: 0.7, display: 'flex' }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{label}</div>
    </div>
  )
}

function ActionBtn({ onClick, color, bgColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 7, border: `1px solid ${bgColor}`,
        background: bgColor, color: color,
        fontWeight: 600, cursor: 'pointer', fontSize: 12,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font)', transition: 'opacity .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  )
}

export default function AdminPage({ onLogout }) {
  const [aba, setAba] = useState('restaurantes')
  const [restaurantes, setRestaurantes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTravados, setFiltroTravados] = useState(false)
  const [modalRestaurante, setModalRestaurante] = useState(null)
  const [usuariosModal, setUsuariosModal] = useState(null)
  const [modalNovoUsuario, setModalNovoUsuario] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const [r, u, s] = await Promise.all([
        api.admin.restaurantes.listar({ busca, status: filtroStatus }),
        api.admin.usuarios.listar(),
        api.admin.stats(),
      ])
      setRestaurantes(Array.isArray(r) ? r : r?.data ?? [])
      setUsuarios(Array.isArray(u) ? u : u?.data ?? [])
      setStats(s?.data ?? s)
    } catch (e) {
      showToast('Erro ao carregar dados: ' + e.message, 'erro')
    } finally {
      setLoading(false)
    }
  }, [busca, filtroStatus, showToast])

  useEffect(() => { carregarDados() }, [carregarDados])

  async function salvarRestaurante(dados) {
    try {
      if (dados.id) {
        await api.admin.restaurantes.atualizar(dados.id, dados)
        showToast('Restaurante atualizado!')
      } else {
        await api.admin.restaurantes.criar(dados)
        showToast('Restaurante criado! CNPJ liberado para cadastro.')
      }
      setModalRestaurante(null)
      carregarDados()
    } catch (e) {
      showToast('Erro: ' + e.message, 'erro')
    }
  }

  async function deletarRestaurante(id, nome) {
    if (!window.confirm(`Remover o restaurante "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.admin.restaurantes.deletar(id)
      showToast('Restaurante removido.')
      carregarDados()
    } catch (e) {
      showToast('Erro: ' + e.message, 'erro')
    }
  }

  async function verUsuarios(restauranteId, restauranteNome) {
    try {
      const res = await api.admin.restaurantes.usuarios(restauranteId)
      setUsuariosModal({
        restauranteId,
        restauranteNome,
        list: Array.isArray(res) ? res : res?.data ?? [],
      })
    } catch (e) {
      showToast('Erro ao carregar usuários: ' + e.message, 'erro')
    }
  }

  async function salvarNovoUsuario(dados) {
    try {
      await api.admin.usuarios.criar(dados)
      showToast('Usuário criado com sucesso!')
      setModalNovoUsuario(null)
      carregarDados()
      if (usuariosModal) {
        verUsuarios(usuariosModal.restauranteId, usuariosModal.restauranteNome)
      }
    } catch (e) {
      showToast('Erro: ' + e.message, 'erro')
    }
  }

  async function toggleUsuario(usuario) {
    try {
      await api.admin.usuarios.atualizar(usuario.id, { ativo: !usuario.ativo })
      showToast(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'}!`)
      carregarDados()
    } catch (e) {
      showToast('Erro: ' + e.message, 'erro')
    }
  }

  // Filtra travados no frontend (onboarding com 0 fornecedores)
  const restaurantesFiltrados = filtroTravados
    ? restaurantes.filter(r => r._onboarding?.fornecedores === 0)
    : restaurantes

  const totalTravados = restaurantes.filter(r => r._onboarding?.fornecedores === 0 && r.status === 'degustacao').length

  const tabs = [
    { id: 'restaurantes', label: 'Restaurantes', icon: <IconBuilding /> },
    { id: 'usuarios',     label: 'Usuários',     icon: Icons.users },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 32px',
        borderBottom: '1px solid var(--border)', background: 'var(--card)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div className="logo">
          <div className="logo-mark">C</div>
          <span className="logo-text">otaWeb</span>
        </div>
        <span style={{
          background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd',
          borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 10px',
          letterSpacing: '0.1em', fontFamily: 'var(--mono)',
        }}>ADMIN</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onLogout}
          style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background .15s, color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fee2e2'
            e.currentTarget.style.color = 'var(--red)'
            e.currentTarget.style.borderColor = '#fca5a5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <IconLogOut /> Sair
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="toast-wrapper">
          <div className={`toast ${toast.tipo === 'erro' ? 'toast-error' : 'toast-success'}`}>
            <span className="toast-icon">
              {toast.tipo === 'erro' ? Icons.error : Icons.check}
            </span>
            {toast.msg}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <StatCard label="Total Restaurantes" value={stats.restaurantes?.total ?? 0}
              icon={<IconBuilding />} />
            <StatCard label="Ativos" value={stats.restaurantes?.ativos ?? 0}
              color="var(--green)" icon={Icons.check} />
            <StatCard label="Degustação" value={stats.restaurantes?.degustacao ?? 0}
              color="#b45309" icon={Icons.warning} />
            <StatCard label="Suspensos" value={stats.restaurantes?.suspensos ?? 0}
              color="var(--red)" icon={Icons.error} />
            <StatCard label="Usuários" value={stats.usuarios?.total ?? 0}
              color="var(--blue)" icon={Icons.users} />
            {/* Card de travados — destaque amarelo quando > 0 */}
            {stats.restaurantes?.travados > 0 && (
              <StatCard
                label="Sem nenhuma ação (+3 dias)"
                value={stats.restaurantes.travados}
                color="#b45309"
                icon={<IconAlert />}
                alert
              />
            )}
          </div>
        )}

        {/* Abas */}
        <div style={{ display: 'flex', marginBottom: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`tab ${aba === t.id ? 'tab--active' : ''}`}
              style={{
                minWidth: 140, flex: 'none',
                background: aba === t.id ? 'var(--card)' : 'transparent',
                borderRadius: '8px 8px 0 0',
                border: '1px solid var(--border)',
                borderBottom: aba === t.id ? '1px solid var(--card)' : '1px solid var(--border)',
                marginRight: 4, marginBottom: -1,
              }}
            >
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Aba: Restaurantes ── */}
        {aba === 'restaurantes' && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '0 var(--radius) var(--radius) var(--radius)', overflow: 'hidden',
          }}>

            {/* Filtros */}
            <div style={{
              display: 'flex', gap: 10, padding: '16px 20px',
              borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
              alignItems: 'center', background: '#fafafa',
            }}>
              <input
                placeholder="Buscar nome, CNPJ, responsável..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{
                  flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(17,24,39,.07)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
              <select
                value={filtroStatus}
                onChange={e => { setFiltroStatus(e.target.value); setFiltroTravados(false) }}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--text)', fontSize: 14,
                  fontFamily: 'var(--font)', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Todos os status</option>
                <option value="degustacao">Degustação</option>
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="cancelado">Cancelado</option>
              </select>

              {/* Filtro rápido: travados */}
              <button
                onClick={() => setFiltroTravados(v => !v)}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${filtroTravados ? '#fde68a' : 'var(--border)'}`,
                  background: filtroTravados ? '#fef3c7' : 'var(--card)',
                  color: filtroTravados ? '#b45309' : 'var(--muted)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}
              >
                <IconAlert />
                Travados
                {totalTravados > 0 && (
                  <span style={{
                    background: '#b45309', color: '#fff',
                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                    padding: '0 6px', fontFamily: 'var(--mono)',
                  }}>{totalTravados}</span>
                )}
              </button>

              <button
                onClick={() => setModalRestaurante({})}
                className="btn btn--add"
                style={{ width: 'auto', margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <IconPlus /> Novo Restaurante
              </button>
            </div>

            {loading && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32, fontFamily: 'var(--mono)', fontSize: 13 }}>
                Carregando...
              </p>
            )}

            {!loading && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Nome', 'CNPJ', 'Responsável', 'Status', 'Início', 'Onboarding', 'Ações'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', borderBottom: '1px solid var(--border)',
                          color: 'var(--muted)', textAlign: 'left', fontWeight: 600,
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                          fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            <div className="empty-icon"><IconBuilding /></div>
                            <p>{filtroTravados ? 'Nenhum cliente travado.' : 'Nenhum restaurante encontrado.'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {restaurantesFiltrados.map(r => {
                      const travado = r._onboarding?.fornecedores === 0
                      return (
                        <tr key={r.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: travado && r.status === 'degustacao' ? '#fffbeb' : 'transparent',
                            transition: 'background .1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = travado && r.status === 'degustacao' ? '#fef9c3' : '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = travado && r.status === 'degustacao' ? '#fffbeb' : 'transparent'}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{r.nome}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', color: 'var(--muted)', fontSize: 13 }}>
                            {r.cnpj || '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>{r.responsavel || '—'}</td>
                          <td style={{ padding: '12px 16px' }}><Badge status={r.status} /></td>
                          <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                            {r.degustacao_inicio ? new Date(r.degustacao_inicio).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <OnboardingProgress onboarding={r._onboarding} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <ActionBtn onClick={() => setModalRestaurante(r)} color="#6d28d9" bgColor="#ede9fe">
                                {Icons.edit} Editar
                              </ActionBtn>
                              <ActionBtn onClick={() => verUsuarios(r.id, r.nome)} color="var(--blue)" bgColor="var(--blue-bg)">
                                {Icons.users} Usuários
                              </ActionBtn>
                              <ActionBtn onClick={() => deletarRestaurante(r.id, r.nome)} color="var(--red)" bgColor="var(--red-bg)">
                                {Icons.trash} Remover
                              </ActionBtn>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legenda do onboarding */}
            {!loading && restaurantesFiltrados.length > 0 && (
              <div style={{
                padding: '10px 20px', borderTop: '1px solid var(--border)',
                background: '#fafafa', display: 'flex', gap: 20, alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  ONBOARDING:
                </span>
                {[
                  { cor: '#7c3aed', label: 'Fornecedores' },
                  { cor: '#0ea5e9', label: 'Itens' },
                  { cor: '#16a34a', label: 'Cotação' },
                ].map(p => (
                  <span key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ width: 20, height: 4, borderRadius: 99, background: p.cor, display: 'inline-block' }} />
                    {p.label}
                  </span>
                ))}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ width: 20, height: 4, borderRadius: 99, background: '#e5e7eb', display: 'inline-block' }} />
                  Pendente
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Aba: Usuários ── */}
        {aba === 'usuarios' && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '0 var(--radius) var(--radius) var(--radius)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', gap: 10, padding: '16px 20px',
              borderBottom: '1px solid var(--border)', alignItems: 'center', background: '#fafafa',
            }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setModalNovoUsuario({})}
                className="btn btn--add"
                style={{ width: 'auto', margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <IconPlus /> Novo Usuário
              </button>
            </div>

            {loading && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32, fontFamily: 'var(--mono)', fontSize: 13 }}>
                Carregando...
              </p>
            )}

            {!loading && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Nome', 'Email', 'Cargo', 'Restaurante', 'Status', 'Ações'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', borderBottom: '1px solid var(--border)',
                          color: 'var(--muted)', textAlign: 'left', fontWeight: 600,
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                          fontFamily: 'var(--mono)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">
                            <div className="empty-icon">{Icons.users}</div>
                            <p>Nenhum usuário encontrado.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {usuarios.map(u => (
                      <tr key={u.id}
                        style={{ borderBottom: '1px solid var(--border)', opacity: u.ativo ? 1 : 0.55, transition: 'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.nome}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: u.cargo === 'admin' ? '#ede9fe' : 'var(--blue-bg)',
                            color: u.cargo === 'admin' ? '#7c3aed' : 'var(--blue)',
                            border: `1px solid ${u.cargo === 'admin' ? '#c4b5fd' : '#bfdbfe'}`,
                            borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                            fontFamily: 'var(--mono)', letterSpacing: '0.05em',
                          }}>{u.cargo.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{u.restaurante_nome || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: u.ativo ? 'var(--green-bg)' : '#f3f4f6',
                            color: u.ativo ? 'var(--green)' : 'var(--muted)',
                            border: `1px solid ${u.ativo ? '#bbf7d0' : 'var(--border)'}`,
                            borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                            fontFamily: 'var(--mono)', letterSpacing: '0.05em',
                          }}>{u.ativo ? 'ATIVO' : 'INATIVO'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <ActionBtn
                            onClick={() => toggleUsuario(u)}
                            color={u.ativo ? 'var(--red)' : 'var(--green)'}
                            bgColor={u.ativo ? 'var(--red-bg)' : 'var(--green-bg)'}
                          >
                            {u.ativo ? <><IconToggleOff /> Desativar</> : <><IconToggleOn /> Ativar</>}
                          </ActionBtn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Restaurante */}
      {modalRestaurante !== null && (
        <RestauranteModal
          inicial={modalRestaurante}
          onSalvar={salvarRestaurante}
          onFechar={() => setModalRestaurante(null)}
        />
      )}

      {/* Modal: Usuários do restaurante */}
      {usuariosModal !== null && (
        <div style={overlayStyle} onClick={() => setUsuariosModal(null)}>
          <div style={{ ...modalBoxStyle, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                Usuários — {usuariosModal.restauranteNome}
              </h3>
              <button
                onClick={() => setModalNovoUsuario({ preSelectedId: usuariosModal.restauranteId })}
                className="btn btn--add"
                style={{ width: 'auto', margin: 0, padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <IconPlus /> Novo Usuário
              </button>
            </div>

            {usuariosModal.list.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">{Icons.users}</div>
                <p>Nenhum usuário cadastrado.</p>
              </div>
            )}

            {usuariosModal.list.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{u.email}</div>
                </div>
                <span style={{
                  background: u.cargo === 'admin' ? '#ede9fe' : 'var(--blue-bg)',
                  color: u.cargo === 'admin' ? '#7c3aed' : 'var(--blue)',
                  border: `1px solid ${u.cargo === 'admin' ? '#c4b5fd' : '#bfdbfe'}`,
                  borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--mono)',
                }}>{u.cargo.toUpperCase()}</span>
                <span style={{
                  background: u.ativo ? 'var(--green-bg)' : '#f3f4f6',
                  color: u.ativo ? 'var(--green)' : 'var(--muted)',
                  border: `1px solid ${u.ativo ? '#bbf7d0' : 'var(--border)'}`,
                  borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--mono)',
                }}>{u.ativo ? 'ATIVO' : 'INATIVO'}</span>
              </div>
            ))}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button onClick={() => setUsuariosModal(null)} className="btn-nao">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Usuário */}
      {modalNovoUsuario !== null && (
        <NovoUsuarioModal
          restaurantes={restaurantes}
          preSelected={modalNovoUsuario}
          onSalvar={salvarNovoUsuario}
          onFechar={() => setModalNovoUsuario(null)}
        />
      )}
    </div>
  )
}

function RestauranteModal({ inicial, onSalvar, onFechar }) {
  const isEdit = !!inicial?.id
  const [form, setForm] = useState({
    nome: inicial.nome || '',
    telefone: inicial.telefone || '',
    email: inicial.email || '',
    cnpj: inicial.cnpj || '',
    responsavel: inicial.responsavel || '',
    status: inicial.status || 'degustacao',
  })
  const [salvando, setSalvando] = useState(false)

  function upd(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try { await onSalvar(isEdit ? { id: inicial.id, ...form } : form) }
    finally { setSalvando(false) }
  }

  return (
    <div style={overlayStyle} onClick={onFechar}>
      <form style={modalBoxStyle} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, fontSize: 16 }}>
          {isEdit ? 'Editar Restaurante' : 'Novo Restaurante'}
        </h3>

        {[
          { label: 'Nome *', key: 'nome', required: true },
          { label: 'Telefone (somente números) *', key: 'telefone', required: true },
          { label: 'Email', key: 'email' },
          { label: 'CNPJ *', key: 'cnpj', placeholder: 'ex: 12.345.678/0001-99', required: true },
          { label: 'Responsável', key: 'responsavel' },
        ].map(({ label, key, required, placeholder }) => (
          <div key={key} className="field">
            <label>{label}</label>
            <input value={form[key]} onChange={e => upd(key, e.target.value)} required={required} placeholder={placeholder} />
          </div>
        ))}

        {!isEdit && (
          <div style={{ padding: '14px 16px', background: '#fafafa', borderRadius: 'var(--radius)', marginBottom: 14, border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--mono)' }}>
              Usuário Master — Acesso Inicial
            </h4>
            <div className="field">
              <label>Nome do usuário *</label>
              <input value={form.usuario_nome || ''} onChange={e => upd('usuario_nome', e.target.value)} required />
            </div>
            <div className="field">
              <label>Email do usuário *</label>
              <input type="email" value={form.usuario_email || ''} onChange={e => upd('usuario_email', e.target.value)} required />
            </div>
            <p style={{ fontSize: 11, margin: '10px 0 0', color: 'var(--muted)' }}>
              Senha padrão: <strong style={{ fontFamily: 'var(--mono)' }}>cotaweb123</strong>
            </p>
          </div>
        )}

        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={e => upd('status', e.target.value)}>
            <option value="degustacao">Degustação</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onFechar} className="btn-nao">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-sim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {salvando ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Restaurante'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NovoUsuarioModal({ restaurantes, preSelected, onSalvar, onFechar }) {
  const isGlobal = !preSelected?.preSelectedId
  const [form, setForm] = useState({
    nome: '', email: '', cargo: 'operador', senha: '',
    restaurante_id: isGlobal ? '' : preSelected.preSelectedId,
  })
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (!isGlobal || form.restaurante_id) { await onSalvar(form) }
      else { alert('Selecione um restaurante.'); setSalvando(false) }
    } finally {
      if (isGlobal && !form.restaurante_id) return
      setSalvando(false)
    }
  }

  return (
    <div style={{ ...overlayStyle, zIndex: 110 }} onClick={onFechar}>
      <form style={{ ...modalBoxStyle, maxWidth: 400 }} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, fontSize: 16 }}>Novo Usuário</h3>

        {isGlobal && (
          <div className="field">
            <label>Empresa (Restaurante) *</label>
            <select required value={form.restaurante_id} onChange={e => setForm(f => ({ ...f, restaurante_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {restaurantes.filter(r => r.id).map(r => (
                <option key={r.id} value={r.id}>{r.nome} ({r.cnpj})</option>
              ))}
            </select>
          </div>
        )}

        <div className="field"><label>Nome completo *</label>
          <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div className="field"><label>Email de acesso *</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="field"><label>Cargo *</label>
          <select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}>
            <option value="operador">Operador (Acesso às cotações)</option>
            <option value="admin">Administrador do Restaurante</option>
          </select>
        </div>
        <div className="field"><label>Senha (opcional)</label>
          <input placeholder="cotaweb123" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onFechar} className="btn-nao">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-sim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {salvando ? 'Salvando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}

const modalBoxStyle = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,.15)',
}