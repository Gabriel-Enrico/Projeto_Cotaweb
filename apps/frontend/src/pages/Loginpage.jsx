import { useLoginForm } from '../hooks/useLoginForm'
import '../styles/LoginPage.css'

export default function LoginPage({ onLogin }) {
  const {
    modo,
    form,
    erro,
    loading,
    shake,
    setField,
    setFieldCNPJ,
    trocarModo,
    handleLogin,
    handleRegistro,
  } = useLoginForm(onLogin)

  return (
    <div className="login-overlay">
      <div className={`login-card ${shake ? 'login-card--shake' : ''}`}>

        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>

        <p className="login-subtitle">
          {modo === 'login' ? 'Entre na sua conta' : 'Criar nova conta'}
        </p>

        <div className="login-tabs">
          <button
            className={`login-tab ${modo === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => trocarModo('login')}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`login-tab ${modo === 'registro' ? 'login-tab--active' : ''}`}
            onClick={() => trocarModo('registro')}
            type="button"
          >
            Criar conta
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={modo === 'login' ? handleLogin : handleRegistro}
        >
          {modo === 'registro' && (
            <div className="login-field">
              <label className="login-label">Nome completo</label>
              <input
                className="login-input"
                type="text"
                placeholder="Seu nome"
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

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
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={form.senha}
              onChange={e => setField('senha', e.target.value)}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {modo === 'registro' && (
            <>
              <div className="login-field">
                <label className="login-label">Confirmar senha</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmar}
                  onChange={e => setField('confirmar', e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="login-field">
                <label className="login-label">CNPJ da empresa</label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={e => setFieldCNPJ(e.target.value)}
                  maxLength={18}
                />
              </div>
            </>
          )}

          {erro && <div className="login-erro">{erro}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? <span className="login-spinner" />
              : modo === 'login' ? 'Entrar' : 'Criar conta e entrar'
            }
          </button>
        </form>
      </div>
    </div>
  )
}