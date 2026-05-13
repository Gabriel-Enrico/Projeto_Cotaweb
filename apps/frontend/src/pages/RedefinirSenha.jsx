import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import '../styles/EsqueciSenha.css'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const location = useLocation()

  // Recupera o email vindo da tela de Esqueci Senha
  const email = location.state?.email || ''

  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

 
  async function handleReenviarCodigo() {
    try {
      setErro('')
      const response = await fetch('http://localhost:5173/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) throw new Error('Erro ao reenviar código.')
      alert('Um novo código foi enviado para seu e-mail!')
    } catch (err) {
      setErro(err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) {
      return setErro('A senha deve possuir no mínimo 6 caracteres.')
    }

    if (senha !== confirmarSenha) {
      return setErro('As senhas não coincidem.')
    }

    try {
      setLoading(true)
      const response = await fetch('http://localhost:3333/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, senha })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha')
      }

      setSucesso(true)
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fp-overlay">
      <div className="fp-card">
        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>

        <h2>Redefinir senha</h2>

        {sucesso ? (
          <div className="login-success" style={{ color: '#28a745', textAlign: 'center', padding: '20px' }}>
            <p><strong>Senha alterada com sucesso!</strong></p>
            <p>Redirecionando para o login...</p>
          </div>
        ) : (
          <>
            <p className="fp-subtitle">
              Insira o código enviado para <strong>{email}</strong>
            </p>

            <form onSubmit={handleSubmit} className="fp-form">
              <input
                type="text"
                placeholder="Código de verificação"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Nova senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />

              {erro && <div className="login-error">{erro}</div>}

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>

            <div className="fp-actions" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={handleReenviarCodigo}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '14px' }}
              >
                Não recebeu? Solicitar novo código
              </button>

              <Link to="/login" className="fp-back" style={{ textDecoration: 'none', fontSize: '14px', color: '#666' }}>
                Voltar para login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}