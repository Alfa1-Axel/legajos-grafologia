import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../styles/global.css'

const DIMENSIONES = [
  { id:'sentimental',  nombre:'Dimensión Sentimental' },
  { id:'ideologica',   nombre:'Dimensión Ideológica' },
  { id:'vital',        nombre:'Dimensión Vital y Protagónica' },
  { id:'afectiva',     nombre:'Dimensión Afectiva y Vincular' },
  { id:'logica',       nombre:'Dimensión Lógica y Ética' },
  { id:'intuitiva',    nombre:'Dimensión Intuitiva y Apertura' },
  { id:'defensiva',    nombre:'Dimensión Defensiva y Diplomacia' },
  { id:'instintiva',   nombre:'Dimensión Instintiva y Corporal' },
  { id:'autonomia',    nombre:'Dimensión de Autonomía y Rebeldía' },
]

const SIMBOLOS = { A:'+', B:'x', C:'=', D:'-' }
const LETRAS = ['A','B','C','D']

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
    return;
  }
  cargarDimension(0);
}, [nombre, apellido, navigate]);
  async function cargarDimension(idx) {
    setLoading(true)
    const dim = DIMENSIONES[idx]
    const { data, error } = await supabase
      .from('preguntas')
      .select('*')
      .eq('dimension_id', dim.id)
      .order('orden')
    if (!error) setPreguntas(data || [])
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
      alert(`Faltán responder ${sinResponder.length} pregunta${sinResponder.length > 1 ? 's' : ''}`)
      return
    }
    if (dimIdx < DIMENSIONES.length - 1) {
      const next = dimIdx + 1
      setDimIdx(next)
      cargarDimension(next)
      window.scrollTo({ top:0, behavior:'smooth' })
    } else {
      guardar()
    }
  }

  function anterior() {
    if (dimIdx > 0) {
      const prev = dimIdx - 1
      setDimIdx(prev)
      cargarDimension(prev)
      window.scrollTo({ top:0, behavior:'smooth' })
    }
  }

  async function guardar() {
    setSaving(true)
    // Calcular conteos por dimensión
    const resultados = {}
    DIMENSIONES.forEach(dim => {
      const respDim = respuestas[dim.id] || {}
      let A=0,B=0,C=0,D=0
      Object.values(respDim).forEach(r => {
        if(r==='A') A++
        else if(r==='B') B++
        else if(r==='C') C++
        else if(r==='D') D++
      })
      const total = A+B+C+D
      const safe = total || 1
      const porcentajes = {
        A: +((A/safe)*100).toFixed(2),
        B: +((B/safe)*100).toFixed(2),
        C: +((C/safe)*100).toFixed(2),
        D: +((D/safe)*100).toFixed(2),
      }
      const vals = [A,B,C,D]
      const max = Math.max(...vals)
      const dominante = LETRAS[vals.indexOf(max)]
      const rangos = { A:'Predominante', B:'Intermedio', C:'Irregular', D:'Deficitario' }
      resultados[dim.id] = {
        nombre: dim.nombre,
        valores: {A,B,C,D},
        total,
        porcentajes,
        dominante,
        rango: rangos[dominante]
      }
    })

    const { error } = await supabase.from('evaluaciones').insert({
      nombre,
      apellido,
      respuestas,
      resultados,
    })

    setSaving(false)
    if (error) { alert('Error al guardar: ' + error.message); return }
    setCompletado(true)
  }

  if (completado) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--dark)', padding:'1rem'
    }}>
      <div style={{
        background:'var(--dark2)', border:'1px solid var(--border2)',
        borderRadius:'var(--r2)', padding:'3rem 2rem',
        maxWidth:420, width:'100%', textAlign:'center'
      }}>
        <div style={{ fontSize:60, marginBottom:'1rem' }}>✓</div>
        <h1 style={{
          fontFamily:'Cormorant Garamond, serif', fontSize:26,
          color:'var(--gold)', fontWeight:300, marginBottom:'.5rem'
        }}>¡Evaluación Completada!</h1>
        <p style={{ color:'var(--text2)', fontSize:14, marginBottom:'1.5rem', lineHeight:1.7 }}>
          Gracias <strong style={{color:'var(--gold)'}}>{nombre} {apellido}</strong> por completar la evaluación. Tus respuestas fueron registradas exitosamente.
        </p>
        <button className="btn btn-gold" onClick={() => navigate('/evaluacion')}>
          Nueva Evaluación
        </button>
      </div>
    </div>
  )

  const dim = DIMENSIONES[dimIdx]
  const respDim = respuestas[dim.id] || {}
  const progress = ((dimIdx + 1) / DIMENSIONES.length) * 100

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', padding:'1rem' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* HEADER */}
        <div style={{
          background:'var(--dark2)', border:'1px solid var(--border)',
          borderRadius:'var(--r2)', padding:'14px 18px', marginBottom:'1rem',
          display:'flex', alignItems:'center', justifyContent:'space-between'
        }}>
          <div style={{
            fontFamily:'Cormorant Garamond, serif', fontSize:16,
            color:'var(--gold)', fontStyle:'italic'
          }}>Grafogénesis®</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>
            {nombre} {apellido}
          </div>
        </div>

        {/* PROGRESO */}
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:'1rem'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12 }}>
            <span style={{ color:'var(--text2)' }}>Dimensión {dimIdx+1} de {DIMENSIONES.length}</span>
            <span style={{ color:'var(--gold)', fontWeight:500 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ background:'var(--dark)', height:6, borderRadius:3, overflow:'hidden' }}>
            <div style={{
              background:'var(--gold)', height:'100%', borderRadius:3,
              width: progress+'%', transition:'width .4s ease'
            }}/>
          </div>
        </div>

        {/* DIMENSIÓN HEADER */}
        <div style={{
          background:'linear-gradient(135deg, var(--dark2), var(--surface))',
          border:'1px solid var(--border2)', borderRadius:'var(--r2)',
          padding:'16px', marginBottom:'1rem', textAlign:'center'
        }}>
          <p style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 }}>
            Dimensión {dimIdx+1}
          </p>
          <h2 style={{
            fontFamily:'Cormorant Garamond, serif', fontSize:20,
            color:'var(--gold)', fontWeight:400, margin:0
          }}>{dim.nombre}</h2>
        </div>

        {/* PREGUNTAS */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text3)' }}>
            Cargando preguntas...
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {preguntas.map((p, idx) => {
              const seleccionada = respDim[p.orden]
              return (
                <div key={p.id} style={{
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:'var(--r2)', padding:'16px'
                }}>
                  <p style={{
                    color:'var(--text)', fontSize:14, fontWeight:500,
                    marginBottom:12, lineHeight:1.6
                  }}>
                    <span style={{
                      background:'var(--gold)', color:'var(--dark)',
                      fontSize:11, fontWeight:700, padding:'2px 8px',
                      borderRadius:10, marginRight:8
                    }}>{idx+1}</span>
                    {p.pregunta}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {LETRAS.map(letra => {
                      const texto = p['opcion_' + letra.toLowerCase()]
                      const selected = seleccionada === letra
                      return (
                        <div
                          key={letra}
                          onClick={() => responder(dim.id, p.orden, letra)}
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'12px', borderRadius:'var(--r)',
                            border: selected ? '2px solid var(--gold)' : '1px solid var(--border)',
                            background: selected ? 'rgba(201,168,76,.12)' : 'var(--dark2)',
                            cursor:'pointer', transition:'all .15s'
                          }}
                        >
                          <div style={{
                            width:34, height:34, borderRadius:8, flexShrink:0,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            background: selected ? 'var(--gold)' : 'var(--surface)',
                            color: selected ? 'var(--dark)' : 'var(--text2)',
                            fontWeight:700, fontSize:13
                          }}>{letra}</div>
                          <span style={{ flex:1, fontSize:13, color:'var(--text)', lineHeight:1.5 }}>
                            {texto}
                          </span>
                          <span style={{
                            color: selected ? 'var(--gold)' : 'var(--text3)',
                            fontWeight:700, fontSize:16, flexShrink:0
                          }}>{SIMBOLOS[letra]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* NAVEGACIÓN */}
        <div className="form-nav" style={{ marginTop:'1.5rem' }}>
          {dimIdx > 0
            ? <button className="btn btn-outline" onClick={anterior}>← Anterior</button>
            : <div/>
          }
          <button className="btn btn-gold" onClick={siguiente} disabled={saving}>
            {saving ? 'Guardando...' : dimIdx === DIMENSIONES.length-1 ? '✓ Finalizar' : 'Siguiente →'}
          </button>
        </div>

        <div style={{ height:'2rem' }}/>
      </div>
    </div>
  )
}