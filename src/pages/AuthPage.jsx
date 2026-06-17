import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import styles from './AuthPage.module.scss'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()

  const [modo,     setModo]     = useState('login')   // 'login' | 'cadastro' | 'recuperar'
  const [nome,     setNome]     = useState('')
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')
  const [sucesso,  setSucesso]  = useState('')

  function resetForm() {
    setNome(''); setEmail(''); setSenha(''); setConfirm('')
    setErro(''); setSucesso('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(''); setSucesso('')

    if (modo === 'cadastro') {
      if (!nome.trim())           { setErro('Informe seu nome.'); return }
      if (senha.length < 6)       { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
      if (senha !== confirm)      { setErro('As senhas não coincidem.'); return }
    }

    if (modo === 'recuperar') {
      if (!email.trim()) { setErro('Informe seu e-mail.'); return }
      setLoading(true)
      try {
        await resetPassword(email.trim())
        setSucesso('Link enviado! Verifique sua caixa de entrada.')
        setEmail('')
      } catch (err) {
        const msg = err.message ?? ''
        const rateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')
        setErro(rateLimit
          ? 'Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.'
          : 'Não foi possível enviar o link. Verifique o e-mail informado.')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      if (modo === 'login') {
        await signIn(email, senha)
      } else {
        await signUp(email, senha, nome.trim())
        setSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        resetForm()
        setModo('login')
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed':       'Confirme seu e-mail antes de entrar.',
        'User already registered':   'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'A senha precisa ter pelo menos 6 caracteres.',
        'email rate limit exceeded':  'Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.',
        'over_email_send_rate_limit': 'Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.',
      }
      const msg = err.message ?? ''
      const rateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')
      setErro(rateLimit ? 'Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.' : (msgs[msg] ?? msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.bg}>
      {/* Decoração de fundo */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoCircle}>
            <span>ALMAH</span>
            <small>Comunicação</small>
          </div>
          <h1 className={styles.logoTitle}>Álbum de Figurinhas</h1>
          <p className={styles.logoSub}>Time ALMAH · 2024</p>
        </div>

        {/* Tabs */}
        {modo !== 'recuperar' && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${modo === 'login' ? styles.tabActive : ''}`}
              onClick={() => { setModo('login'); resetForm() }}
            >
              Entrar
            </button>
            <button
              className={`${styles.tab} ${modo === 'cadastro' ? styles.tabActive : ''}`}
              onClick={() => { setModo('cadastro'); resetForm() }}
            >
              Criar conta
            </button>
          </div>
        )}

        {modo === 'recuperar' && (
          <div className={styles.recuperarHeader}>
            <button className={styles.backLink} onClick={() => { setModo('login'); resetForm() }}>
              ← Voltar
            </button>
            <p className={styles.recuperarTitle}>Recuperar senha</p>
          </div>
        )}

        {/* Formulário */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {modo === 'cadastro' && (
            <div className={styles.field}>
              <label>Seu nome</label>
              <input
                type="text"
                placeholder="Como você quer aparecer no álbum"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className={styles.field}>
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={modo === 'login' || modo === 'recuperar'}
            />
          </div>

          {modo !== 'recuperar' && (
            <div className={styles.field}>
              <label>Senha</label>
              <input
                type="password"
                placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
          )}

          {modo === 'cadastro' && (
            <div className={styles.field}>
              <label>Confirmar senha</label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {erro    && <div className={styles.erro}>{erro}</div>}
          {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? <span className={styles.spinner} />
              : modo === 'login'     ? 'Entrar no álbum →'
              : modo === 'recuperar' ? 'Enviar link de recuperação'
              :                        'Criar minha conta →'
            }
          </button>

          {modo === 'login' && (
            <button
              type="button"
              className={styles.esqueceuLink}
              onClick={() => { setModo('recuperar'); resetForm() }}
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <p className={styles.footer}>
          {modo === 'login'
            ? <>Ainda não tem conta? <button className={styles.link} onClick={() => { setModo('cadastro'); resetForm() }}>Cadastre-se</button></>
            : modo === 'cadastro'
            ? <>Já tem conta? <button className={styles.link} onClick={() => { setModo('login'); resetForm() }}>Entrar</button></>
            : null
          }
        </p>
      </div>
    </div>
  )
}
