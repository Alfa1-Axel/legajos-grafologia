import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)'
    }}>
      <div style={{
        background: 'var(--dark2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)', padding: '2.5rem',
        width: '100%', maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, background: 'var(--gold)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem',
            fontFamily: 'Cormorant Garamond, serif', fontSize: 24,
            color: 'var(--dark)', fontWeight: 600
          }}>G</div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 26,
            color: 'var(--gold)', fontWeight: 300, fontStyle: 'italic'
          }}>Legajos Grafológicos</h1>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Sistema de Registro Digital</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fg">
            <label>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required
            />
          </div>
          <div className="fg">
            <label>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          {error && (
            <p style={{ color: '#e74c3c', fontSize: 12, textAlign: 'center' }}>{error}</p>
          )}
          <button className="btn btn-gold" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}