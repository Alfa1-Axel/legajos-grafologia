import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LOGO_URL = 'https://i.imgur.com/oQ0t2v2.png'

export default function Evaluacion() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [error, setError] = useState('')

  function iniciar() {
    if (!nombre.trim() || !apellido.trim()) {
      setError('Por favor ingresá tu nombre y apellido')
      return
    }
    navigate('/evaluacion/cuestionario', {
      state: { nombre: nombre.trim(), apellido: apellido.trim() }
    })
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--dark)', padding:'1rem'
    }}>
      <div style={{
        background:'var(--dark2)', border:'1px solid var(--border2)',
        borderRadius:'var(--r2)', padding:'2.5rem',
        width:'100%', maxWidth:'420px'
      }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <img
            src={LOGO_URL} alt="Grafogénesis"
            style={{ width:80, height:80, objectFit:'contain', borderRadius:'50%', marginBottom:'1rem' }}
            onError={e => e.target.style.display='none'}
          />
          <h1 style={{
            fontFamily:'Cormorant Garamond, serif', fontSize:26,
            color:'var(--gold)', fontWeight:300, fontStyle:'italic', marginBottom:4
          }}>Grafogénesis®</h1>
          <p style={{ color:'var(--text3)', fontSize:12, letterSpacing:'.08em', textTransform:'uppercase' }}>
            Evaluación Integral
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="fg">
            <label>Nombre</label>
            <input
              type="text" value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre"
              onKeyDown={e => e.key === 'Enter' && iniciar()}
            />
          </div>
          <div className="fg">
            <label>Apellido</label>
            <input
              type="text" value={apellido}
              onChange={e => setApellido(e.target.value)}
              placeholder="Tu apellido"
              onKeyDown={e => e.key === 'Enter' && iniciar()}
            />
          </div>

          {error && (
            <p style={{ color:'#e74c3c', fontSize:12, textAlign:'center' }}>{error}</p>
          )}

          <button className="btn btn-gold" onClick={iniciar} style={{ marginTop:8 }}>
            Comenzar Evaluación →
          </button>
        </div>

        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <button
            className="btn btn-outline"
            style={{ fontSize:12, padding:'6px 14px' }}
            onClick={() => navigate('/login')}
          >
            Acceso Profesional
          </button>
        </div>
      </div>
    </div>
  )
}