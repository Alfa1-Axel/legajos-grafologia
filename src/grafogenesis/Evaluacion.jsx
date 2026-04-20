import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/global.css'

const LOGO = 'https://i.imgur.com/ukSxvlb.png'

export default function Evaluacion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Inicializar directamente desde la URL, sin setState en el efecto
  const paramNombre   = searchParams.get('nombre') ?? ''
  const paramApellido = searchParams.get('apellido') ?? ''
  const paramCodigo   = searchParams.get('code') ?? ''
  const vieneDeQR     = !!(paramNombre && paramApellido && paramCodigo)

  const [nombre,   setNombre]   = useState(paramNombre)
  const [apellido, setApellido] = useState(paramApellido)
  const [codigo,   setCodigo]   = useState(paramCodigo)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [autoIniciando, setAutoIniciando] = useState(vieneDeQR)

  // Efecto solo para la lógica asíncrona (navegación), no para setState
  useEffect(() => {
    if (!vieneDeQR) return
    verificarYNavegar(paramNombre, paramApellido, paramCodigo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function verificarYNavegar(n, a, c) {
    const { data, error: err } = await supabase
      .from('config')
      .select('valor')
      .eq('clave', 'codigo_acceso')
      .single()

    if (err || !data || c.toUpperCase() !== data.valor.toUpperCase()) {
      setAutoIniciando(false)
      setError('Código inválido. Consultá al profesional.')
      return
    }

    navigate('/evaluacion/cuestionario', {
      state: { nombre: n.trim(), apellido: a.trim() }
    })
  }

  async function iniciar() {
    if (!nombre.trim() || !apellido.trim() || !codigo.trim()) {
      setError('Por favor completá todos los campos')
      return
    }
    setLoading(true)
    setError('')
    await verificarYNavegar(nombre.trim(), apellido.trim(), codigo.trim())
    setLoading(false)
  }

  if (autoIniciando) return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', flexDirection: 'column', gap: 16
    }}>
      {error ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#e74c3c', fontSize: 14 }}>{error}</p>
          <button
            onClick={() => setAutoIniciando(false)}
            style={{ marginTop: 12, padding: '10px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}
          >Volver</button>
        </div>
      ) : (
        <>
          <img src={LOGO} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '50%', background: 'white', padding: 4 }} />
          <p style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontStyle: 'italic' }}>
            Iniciando evaluación...
          </p>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>{nombre} {apellido}</p>
        </>
      )}
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--dark2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        width: '100%', maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={LOGO} alt="Grafogénesis"
            style={{ width: 'clamp(70px,20vw,110px)', height: 'clamp(70px,20vw,110px)', objectFit: 'contain', borderRadius: '50%', marginBottom: '1rem', background: 'white', padding: 4 }}
            onError={e => e.target.style.display = 'none'}
          />
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,6vw,28px)', color: 'var(--gold)', fontWeight: 300, fontStyle: 'italic', marginBottom: 4 }}>
            Grafogénesis®
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Evaluación Integral
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fg">
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" style={{ fontSize: 16 }} />
          </div>
          <div className="fg">
            <label>Apellido</label>
            <input type="text" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Tu apellido" style={{ fontSize: 16 }} />
          </div>
          <div className="fg">
            <label>Código de acceso</label>
            <input
              type="text" value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código que te dieron"
              onKeyDown={e => e.key === 'Enter' && iniciar()}
              style={{ fontSize: 16, letterSpacing: '.1em', textTransform: 'uppercase' }}
            />
          </div>

          {error && <p style={{ color: '#e74c3c', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>{error}</p>}

          <button onClick={iniciar} disabled={loading} style={{
            marginTop: 8, padding: '14px', borderRadius: 'var(--r)', border: 'none',
            background: loading ? 'var(--gold-dark)' : 'var(--gold)',
            color: 'var(--dark)', fontFamily: 'DM Sans, sans-serif',
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
          }}>
            {loading ? 'Verificando...' : 'Comenzar Evaluación →'}
          </button>
        </div>
      </div>
    </div>
  )
}