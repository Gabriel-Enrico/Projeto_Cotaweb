import { useState } from 'react'
import * as api from '../api'
import '../styles/LoginPage.css'

export default function EsqueciSenhaPage({ onVoltar }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!email.trim()) {
      setErro('Informe seu e-mail.')
      return
    }

    setLoading(true)
    try {
      await api.auth.recuperarSenha(email.trim())
      setEnviado(true)
    } catch (err) {
      setErro(err.message || 'Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">

        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>

        {!enviado ? (
          <>
            <p className="login-subtitle">Recuperar senha</p>
            <p className="login-descricao">
              Informe seu e-mail cadastrado. O administrador será notificado
              e entrará em contato para redefinir sua senha.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label">E-mail</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="email@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {erro && <div className="login-erro">{erro}</div>}

              <button className="login-btn" type="submit" disabled={loading}>
                {loading
                  ? <span className="login-spinner" />
                  : 'Enviar solicitação'
                }
              </button>
            </form>
          </>
        ) : (
          <div className="login-sucesso">
            <div className="login-sucesso__icone">✓</div>
            <p className="login-sucesso__titulo">Solicitação enviada!</p>
            <p className="login-sucesso__texto">
              Se esse e-mail estiver cadastrado, o administrador será notificado
              e entrará em contato em breve para redefinir sua senha.
            </p>
          </div>
        )}

        <button
          type="button"
          className="login-link"
          onClick={onVoltar}
        >
          ← Voltar para o login
        </button>

      </div>
    </div>
  )
}