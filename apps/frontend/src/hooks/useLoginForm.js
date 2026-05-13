import { useState } from 'react'
import { auth } from '../api'

export function useLoginForm(onLogin) {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErro('')
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.senha) {
      setErro('Preencha e-mail e senha.')
      return triggerShake()
    }
    setLoading(true)
    try {
      const data = await auth.login({ email: form.email, senha: form.senha })
      onLogin(data)
    } catch (err) {
      setErro(err.message)
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    erro,
    loading,
    shake,
    setField,
    handleLogin,
  }
}