import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/global.css'

const LOGO = 'https://i.imgur.com/ukSxvlb.png'

export default function Evaluacion() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function iniciar() {
    if (!nombre.trim() || !apellido.trim() || !codigo.trim()) {
      setError('Por favor completá todos los campos')
      return
    }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('config')
      .select('valor')
      .eq('clave', 'codigo_acceso')
      .single()

    if (err || !data) {
      setError('Error al verificar el código. Intentá de nuevo.')
      setLoading(false)
      return
    }

    if (codigo.trim().toUpperCase() !== data.valor.toUpperCase()) {
      setError('Código incorrecto. Consultá al profesional.')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/evaluacion/cuestionario', {
      state: { nombre: nombre.trim(), apellido: apellido.trim() }
    })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dark)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--dark2)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={LOGO}
            alt="Grafogénesis"
            style={{
              width: 'clamp(80px, 25vw, 120px)',
              height: 'clamp(80px, 25vw, 120px)',
              objectFit: 'contain',
              borderRadius: '50%',
              marginBottom: '1rem',
              background: 'white',
              padding: 4,
            }}
            onError={e => e.target.style.display = 'none'}
          />
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(22px, 6vw, 28px)',
            color: 'var(--gold)',
            fontWeight: 300,
            fontStyle: 'italic',
            marginBottom: 4,
          }}>Grafogénesis®</h1>
          <p style={{
            color: 'var(--text3)',
            fontSize: 11,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}>Evaluación Integral</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fg">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              style={{ fontSize: 16 }}
            />
          </div>
          <div className="fg">
            <label>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={e => setApellido(e.target.value)}
              placeholder="Tu apellido"
              style={{ fontSize: 16 }}
            />
          </div>
          <div className="fg">
            <label>Código de acceso</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Código que te dieron"
              onKeyDown={e => e.key === 'Enter' && iniciar()}
              style={{ fontSize: 16, letterSpacing: '.1em', textTransform: 'uppercase' }}
            />
          </div>

          {error && (
            <p style={{ color: '#e74c3c', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button
            onClick={iniciar}
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '14px',
              borderRadius: 'var(--r)',
              border: 'none',
              background: loading ? 'var(--gold-dark)' : 'var(--gold)',
              color: 'var(--dark)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
            }}
          >
            {loading ? 'Verificando...' : 'Comenzar Evaluación →'}
          </button>
        </div>
      </div>
    </div>
  )
}