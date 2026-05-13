import { useLoginForm } from '../hooks/useLoginForm'
import '../styles/LoginPage.css'

export default function LoginPage({ onLogin }) {
  const {
    form,
    erro,
    loading,
    shake,
    setField,
    handleLogin,
  } = useLoginForm(onLogin)

  return (
    <div className="login-overlay">
      <div className={`login-card ${shake ? 'login-card--shake' : ''}`}>

        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>

        <p className="login-subtitle">
          Entre na sua conta
        </p>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-field">
            <label className="login-label">E-mail</label>
            <input
              className="login-input"
              type="email"
              placeholder="email@empresa.com"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Senha</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setField('senha', e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? <span className="login-spinner" />
              : 'Entrar'
            }
          </button>
        </form>
      </div>
    </div>
  )
}