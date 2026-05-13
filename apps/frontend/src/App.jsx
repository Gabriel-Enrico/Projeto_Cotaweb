import { useState, useEffect, useCallback } from 'react'
import './App.css'
import * as api from './api'
import Icons from './icons'
import LoginPage from './pages/Loginpage'
import { Toast } from './components/common/Toast'
import { ModalConfirm } from './components/modals/ModalConfirm'
import FornecedoresPage from './pages/FornecedoresPage'
import ItensPage from './pages/ItensPage'
import EnviarPage from './pages/EnviarPage'
import AdminPage from './pages/admin/AdminPage'
import OnboardingChecklist from './components/onboarding/OnboardingChecklist'

const NOME_APP = 'COTAWEB'

export default function App() {
  const [authState, setAuthState] = useState(null)
  const [authCarregando, setAuthCarregando] = useState(true)

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

  const RESTAURANTE_ID = authState?.usuario?.restaurante_id

  const carregarFornecedores = useCallback(async () => {
    try {
      const data = await api.fornecedores.listar(RESTAURANTE_ID)
      setFornecedoresList(data)
    } catch (err) {
      toast('Erro ao carregar fornecedores: ' + err.message, 'error')
    }
  }, [toast, RESTAURANTE_ID])

  const carregarItens = useCallback(async () => {
    try {
      const data = await api.itens.listar(RESTAURANTE_ID)
      setItensList(data)
    } catch (err) {
      toast('Erro ao carregar itens: ' + err.message, 'error')
    }
  }, [toast, RESTAURANTE_ID])

  const carregarDepartamentos = useCallback(async () => {
    try {
      const data = await api.departamentos.listar(RESTAURANTE_ID)
      setDepartamentosList(data)
    } catch (err) {
    }
  }, [RESTAURANTE_ID])

  useEffect(() => {
    async function restaurarSessao() {
      const token = localStorage.getItem('accessToken')
      if (!token) { setAuthCarregando(false); return }
      try {
        const res = await api.auth.me()
        const usuario = res?.data?.usuario ?? res?.usuario
        setAuthState({ usuario })
      } catch {
        localStorage.removeItem('accessToken')
      } finally {
        setAuthCarregando(false)
      }
    }
    restaurarSessao()

    const handler = () => setAuthState(null)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  useEffect(() => {
    if (!RESTAURANTE_ID) return

    Promise.all([
      carregarFornecedores(),
      carregarItens(),
      carregarDepartamentos()
    ]).finally(() => setLoading(false))

  }, [RESTAURANTE_ID, carregarFornecedores, carregarItens, carregarDepartamentos])

  async function handleLogout() {
    await api.auth.logout()
    setAuthState(null)
  }

  if (authCarregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
        <div style={{ color: '#fff', opacity: 0.5, fontSize: 14 }}>Carregando...</div>
      </div>
    )
  }

  if (!authState) {
    return <LoginPage onLogin={(data) => setAuthState(data)} />
  }

  // Superadmin da plataforma CotaWeb: cargo=admin + sem restaurante_id
  const isSuperAdmin = authState?.usuario?.cargo === 'admin' && !authState?.usuario?.restaurante_id
  if (isSuperAdmin) {
    return <AdminPage onLogout={handleLogout} />
  }

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

      <div className="card">

        <header className="header">
          <div className="logo">
            <span className="logo-mark">C</span>
            <span className="logo-text">{NOME_APP}</span>
            {authState && (
              <button onClick={handleLogout} className="btn-nao" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 13, border: '1px solid var(--border)' }}>Sair</button>
            )}
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

          {/* Onboarding: aparece quando não há dados ainda */}
          {!loading && fornecedoresList.length === 0 && itensList.length === 0 && aba !== 'enviar' && (
            <OnboardingChecklist
              fornecedores={fornecedoresList.length}
              itens={itensList.length}
              onAbrirFornecedores={() => setAba('fornecedores')}
              onAbrirItens={() => setAba('itens')}
              onAbrirEnviar={() => setAba('enviar')}
            />
          )}

          {!loading && (fornecedoresList.length > 0 || itensList.length > 0 || aba === 'enviar') && aba === 'fornecedores' && (
            <FornecedoresPage
              fornecedoresList={fornecedoresList}
              setFornecedoresList={setFornecedoresList}
              restauranteId={RESTAURANTE_ID}
              toast={toast}
              confirmar={confirmar}
            />
          )}

          {!loading && (fornecedoresList.length > 0 || itensList.length > 0 || aba === 'itens') && aba === 'itens' && (
            <ItensPage
              itensList={itensList}
              setItensList={setItensList}
              departamentosList={departamentosList}
              restauranteId={RESTAURANTE_ID}
              toast={toast}
              confirmar={confirmar}
            />
          )}

          {!loading && aba === 'enviar' && (
            <EnviarPage
              fornecedoresList={fornecedoresList}
              itensList={itensList}
              restauranteId={RESTAURANTE_ID}
              toast={toast}
              ultimaCotacaoId={ultimaCotacaoId}
              setUltimaCotacaoId={setUltimaCotacaoId}
            />
          )}

        </div>
      </div>
    </div>
  )
}