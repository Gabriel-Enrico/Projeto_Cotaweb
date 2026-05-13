import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/EsqueciSenha.css'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate() 

  const handleSubmit = (e) => {
    e.preventDefault()

    
    console.log('Enviar recuperação para:', email)
    alert('Código enviado com sucesso!')
    navigate('/redefinir-senha', { state: { email } });
  }

  return (
    <div className="fp-overlay">
      <div className="fp-card">

        <div className="login-logo">
          <span className="login-logo__text">COTA</span>
          <span className="login-logo__text login-logo__text--accent">WEB</span>
        </div>
        
        <h2>Esqueci minha senha</h2>

        <p className="fp-subtitle">
          Digite seu e-mail para receber o link de recuperação
        </p>

        <form onSubmit={handleSubmit} className="fp-form">
          <div className="login-field"> {}
            <input
              className="login-input"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="login-btn" type="submit">Enviar link</button>
        </form>

        <Link to="/login" className="fp-back" style={{ textDecoration: 'none', fontSize: '14px', color: '#666' }}>
          Voltar para login
        </Link>

      </div>
    </div>
  )
}