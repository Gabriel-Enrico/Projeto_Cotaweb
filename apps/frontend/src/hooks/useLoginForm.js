import { useState } from 'react'
import { auth } from '../api'

export function useLoginForm(onLogin) {
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '', cnpj: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErro('')
  }

  function setFieldCNPJ(value) {
    let v = value.replace(/\D/g, '')
    if (v.length > 14) v = v.slice(0, 14)
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
    v = v.replace(/(\d{4})(\d)/, '$1-$2')
    setForm(f => ({ ...f, cnpj: v }))
    setErro('')
  }

  function trocarModo(novoModo) {
    setModo(novoModo)
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

  async function handleRegistro(e) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.senha || !form.cnpj) {
      setErro('Preencha todos os campos.')
      return triggerShake()
    }
    if (form.senha !== form.confirmar) {
      setErro('As senhas não coincidem.')
      return triggerShake()
    }
    if (form.senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres.')
      return triggerShake()
    }
    setLoading(true)
    try {
      await auth.registrar({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        cnpj: form.cnpj.replace(/\D/g, ''),
      })
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
  }
}