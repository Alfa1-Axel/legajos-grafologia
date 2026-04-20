import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/global.css'

const DIMENSIONES = [
  { id: 'sentimental', nombre: 'Dimensión Sentimental' },
  { id: 'instintiva',  nombre: 'Dimensión Instintiva y Corporal' },
  { id: 'intuitiva',   nombre: 'Dimensión Intuitiva y Apertura' },
  { id: 'autonomia',   nombre: 'Dimensión de Autonomía y Rebeldía' },
  { id: 'vital',       nombre: 'Dimensión Vital y Protagónica' },
  { id: 'afectiva',    nombre: 'Dimensión Afectiva y Vincular' },
  { id: 'ideologica',  nombre: 'Dimensión Ideológica' },
  { id: 'defensiva',   nombre: 'Dimensión Defensiva y Diplomacia' },
  { id: 'logica',      nombre: 'Dimensión Lógica y Ética' },
]

const SIMBOLOS = { A: '+', B: 'x', C: '=', D: '-' }
const LETRAS = ['A', 'B', 'C', 'D']

export default function Cuestionario() {
  const location = useLocation()
  const navigate = useNavigate()
  const { nombre, apellido } = location.state || {}

  const [dimIdx, setDimIdx] = useState(0)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completado, setCompletado] = useState(false)

useEffect(() => {
  if (!nombre || !apellido) { 
    navigate('/evaluacion'); 
    return 
  }
  cargarDimension(0)
}, [nombre, apellido, navigate])
async function cargarDimension(idx) {
  if (dimIdx === idx && preguntas.length > 0) return // Ya cargada
  setLoading(true)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  const { data } = await supabase
    .from('preguntas')
    .select('*')
    .eq('dimension_id', DIMENSIONES[idx].id)
    .order('orden')
  setPreguntas(data || [])
  setLoading(false)
}
  function responder(dimId, orden, letra) {
    setRespuestas(prev => ({
      ...prev,
      [dimId]: { ...(prev[dimId] || {}), [orden]: letra }
    }))
  }

  function siguiente() {
    const dim = DIMENSIONES[dimIdx]
    const respDim = respuestas[dim.id] || {}
    const sinResponder = preguntas.filter(p => !respDim[p.orden])
    if (sinResponder.length > 0) {
      alert(`Faltán ${sinResponder.length} pregunta${sinResponder.length > 1 ? 's' : ''} sin responder`)
      return
    }
    if (dimIdx < DIMENSIONES.length - 1) {
      const next = dimIdx + 1
      setDimIdx(next)
      cargarDimension(next)
    } else {
      guardar()
    }
  }

  function anterior() {
    if (dimIdx > 0) {
      const prev = dimIdx - 1
      setDimIdx(prev)
      cargarDimension(prev)
    }
  }

  async function guardar() {
    setSaving(true)
    const resultados = {}
    DIMENSIONES.forEach(dim => {
      const respDim = respuestas[dim.id] || {}
      let A=0, B=0, C=0, D=0
      Object.values(respDim).forEach(r => {
        if (r==='A') A++
        else if (r==='B') B++
        else if (r==='C') C++
        else if (r==='D') D++
      })
      const total = A+B+C+D
      const safe = total || 1
      const vals = [A,B,C,D]
      const max = Math.max(...vals)
      const dominante = LETRAS[vals.indexOf(max)]
      const rangos = { A:'Predominante', B:'Intermedio', C:'Irregular', D:'Deficitario' }
      resultados[dim.id] = {
        nombre: dim.nombre,
        valores: {A,B,C,D},
        total,
        porcentajes: {
          A: +((A/safe)*100).toFixed(2),
          B: +((B/safe)*100).toFixed(2),
          C: +((C/safe)*100).toFixed(2),
          D: +((D/safe)*100).toFixed(2),
        },
        dominante,
        rango: rangos[dominante]
      }
    })
    const { error } = await supabase.from('evaluaciones').insert({
      nombre, apellido, respuestas, resultados
    })
    setSaving(false)
    if (error) { alert('Error al guardar: ' + error.message); return }
    setCompletado(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (completado) return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--dark2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)', padding: 'clamp(2rem, 8vw, 3rem)',
        maxWidth: 420, width: '100%', textAlign: 'center'
      }}>
        <div style={{ fontSize: 'clamp(50px,15vw,70px)', marginBottom: '1rem' }}>✓</div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(22px,6vw,28px)',
          color: 'var(--gold)', fontWeight: 300, marginBottom: '.8rem'
        }}>¡Evaluación Completada!</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Gracias <strong style={{ color: 'var(--gold)' }}>{nombre} {apellido}</strong> por completar
          la evaluación. Tus respuestas fueron registradas exitosamente.
        </p>
        <button
          onClick={() => navigate('/evaluacion')}
          style={{
            padding: '14px 24px', borderRadius: 'var(--r)', border: 'none',
            background: 'var(--gold)', color: 'var(--dark)',
            fontFamily: 'DM Sans, sans-serif', fontSize: 15,
            fontWeight: 600, cursor: 'pointer', width: '100%'
          }}
        >Nueva Evaluación</button>
      </div>
    </div>
  )

  const dim = DIMENSIONES[dimIdx]
  const respDim = respuestas[dim.id] || {}
  const progress = ((dimIdx + 1) / DIMENSIONES.length) * 100
  const respondidas = Object.keys(respDim).length

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', paddingBottom: 80 }}>

      {/* HEADER STICKY */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--dark2)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(13px,4vw,16px)',
              color: 'var(--gold)', fontStyle: 'italic'
            }}>Grafogénesis®</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{nombre} {apellido}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>
              {dimIdx + 1} / {DIMENSIONES.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {respondidas}/{preguntas.length} respondidas
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--dark)', height: 5, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            background: 'var(--gold)', height: '100%', borderRadius: 3,
            width: progress + '%', transition: 'width .4s ease'
          }} />
        </div>
      </div>

      {/* DIMENSIÓN HEADER */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '14px 16px', textAlign: 'center'
      }}>
        <p style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>
          Dimensión {dimIdx + 1} de {DIMENSIONES.length}
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(17px,5vw,22px)',
          color: 'var(--gold)', fontWeight: 400, margin: 0
        }}>{dim.nombre}</h2>
      </div>

      {/* PREGUNTAS */}
      <div style={{ padding: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            Cargando preguntas...
          </div>
        ) : (
          preguntas.map((p, idx) => {
            const seleccionada = respDim[p.orden]
            return (
              <div key={p.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                padding: '14px',
                marginBottom: 10,
              }}>
                <p style={{
                  color: 'var(--text)',
                  fontSize: 'clamp(13px,3.5vw,15px)',
                  fontWeight: 500, marginBottom: 12, lineHeight: 1.6
                }}>
                  <span style={{
                    background: 'var(--gold)', color: 'var(--dark)',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 10, marginRight: 8
                  }}>{idx + 1}</span>
                  {p.pregunta}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {LETRAS.map(letra => {
                    const texto = p['opcion_' + letra.toLowerCase()]
                    const selected = seleccionada === letra
                    return (
                      <div
                        key={letra}
                        onClick={() => responder(dim.id, p.orden, letra)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '12px',
                          borderRadius: 'var(--r)',
                          border: selected ? '2px solid var(--gold)' : '1px solid var(--border)',
                          background: selected ? 'rgba(201,168,76,.1)' : 'var(--dark2)',
                          cursor: 'pointer', transition: 'all .15s',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: selected ? 'var(--gold)' : 'var(--surface)',
                          color: selected ? 'var(--dark)' : 'var(--text2)',
                          fontWeight: 700, fontSize: 13, marginTop: 1,
                        }}>{letra}</div>
                        <span style={{
                          flex: 1,
                          fontSize: 'clamp(12px,3.2vw,14px)',
                          color: 'var(--text)', lineHeight: 1.55
                        }}>{texto}</span>
                        <span style={{
                          color: selected ? 'var(--gold)' : 'var(--text3)',
                          fontWeight: 700, fontSize: 18, flexShrink: 0, marginTop: 2
                        }}>{SIMBOLOS[letra]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* NAVEGACIÓN FIJA ABAJO */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--dark2)', borderTop: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', gap: 10, zIndex: 100,
      }}>
        {dimIdx > 0 && (
          <button
            onClick={anterior}
            style={{
              flex: 1, padding: '14px', borderRadius: 'var(--r)',
              border: '1px solid var(--border2)', background: 'transparent',
              color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, cursor: 'pointer',
            }}
          >← Anterior</button>
        )}
        <button
          onClick={siguiente}
          disabled={saving}
          style={{
            flex: 2, padding: '14px', borderRadius: 'var(--r)',
            border: 'none',
            background: saving ? 'var(--gold-dark)' : 'var(--gold)',
            color: 'var(--dark)', fontFamily: 'DM Sans, sans-serif',
            fontSize: 15, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Guardando...' : dimIdx === DIMENSIONES.length - 1 ? '✓ Finalizar' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}