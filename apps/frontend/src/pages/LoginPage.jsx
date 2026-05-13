import { useLoginForm } from '../hooks/useLoginForm'
import '../styles/LoginPage.css'
import { Link } from 'react-router-dom'

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

        {/* LOGO */}
        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>

        <p className="login-subtitle">
          {modo === 'login'
            ? 'Bem-vindo de volta!'
            : 'Crie sua conta em segundos'}
        </p>

        {/* TABS */}
        <div className="login-tabs">
          <button
            className={`login-tab ${modo === 'login' ? 'active' : ''}`}
            onClick={() => trocarModo('login')}
            type="button"
          >
            Entrar
          </button>

          <button
            className={`login-tab ${modo === 'registro' ? 'active' : ''}`}
            onClick={() => trocarModo('registro')}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {/* FORM */}
        <form
          className="login-form"
          onSubmit={modo === 'login' ? handleLogin : handleRegistro}
        >
          {modo === 'registro' && (
            <div className="login-field">
              <label>Nome completo</label>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={form.nome}
                onChange={e => setField('nome', e.target.value)}
              />
            </div>
          )}

          <div className="login-field">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
            />
          </div>

          <div className="login-field">
            <label>Senha</label>
            <input
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
                <label>Confirmar senha</label>
                <input
                  type="password"
                  placeholder="Repita sua senha"
                  value={form.confirmar}
                  onChange={e => setField('confirmar', e.target.value)}
                />
              </div>

              <div className="login-field">
                <label>CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={e => setFieldCNPJ(e.target.value)}
                />
              </div>
            </>
          )}

          {erro && <div className="login-error">{erro}</div>}

          {/* EXTRAS */}
          {modo === 'login' && (
            <div className="login-extra">
              <label>
                <input type="checkbox" /> Lembrar de mim
              </label>
              <Link to="/esqueci-senha">
                Esqueci a senha
              </Link>
            </div>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}