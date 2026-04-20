import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'
import { QRCodeSVG } from 'qrcode.react'
import { generarPDFGrafo } from './pdfGrafo'
import '../styles/global.css'

const DIMENSIONES = [
  { id:'sentimental', nombre:'Dimensión Sentimental' },
  { id:'instintiva',  nombre:'Dimensión Instintiva y Corporal' },
  { id:'intuitiva',   nombre:'Dimensión Intuitiva y Apertura' },
  { id:'autonomia',   nombre:'Dimensión de Autonomía y Rebeldía' },
  { id:'vital',       nombre:'Dimensión Vital y Protagónica' },
  { id:'afectiva',    nombre:'Dimensión Afectiva y Vincular' },
  { id:'ideologica',  nombre:'Dimensión Ideológica' },
  { id:'defensiva',   nombre:'Dimensión Defensiva y Diplomacia' },
  { id:'logica',      nombre:'Dimensión Lógica y Ética' },
]

const LOGO = 'https://i.imgur.com/ukSxvlb.png'

const S = {
  input: { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--text)', padding:'9px 12px', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none' },
  textarea: { width:'100%', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--text)', padding:'8px 10px', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none', resize:'vertical' },
  select: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--text)', padding:'8px 10px', fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none' },
  panel: { background:'var(--dark)', borderRadius:'var(--r)', padding:14, marginBottom:12, border:'1px solid var(--border)' },
  panelTitle: { fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 },
  btnGold: { padding:'8px 14px', borderRadius:'var(--r)', border:'none', background:'var(--gold)', color:'var(--dark)', fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer', fontWeight:500 },
  btnOutline: { padding:'8px 14px', borderRadius:'var(--r)', border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer' },
}

// ── HEADER COMPARTIDO (fuera del componente para evitar recreación en cada render) ──
function Header({ titulo, subtitulo, acciones, setMenuOpen }) {
  return (
    <header style={{
      background:'var(--dark2)', borderBottom:'1px solid var(--border2)',
      padding:'0 1rem', display:'flex', alignItems:'center',
      justifyContent:'space-between', height:62,
      position:'sticky', top:0, zIndex:200
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <img src={LOGO} alt="Logo"
          style={{ height:34,width:34,objectFit:'contain',borderRadius:'50%',background:'white',padding:2,flexShrink:0 }}
          onError={e=>e.target.style.display='none'}
        />
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(14px,4vw,19px)', color:'var(--gold)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {titulo}
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>
            {subtitulo}
          </div>
        </div>
      </div>

      {/* Botones desktop */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }} className="hdr-btns-desktop">
        {acciones}
      </div>

      {/* Hamburguesa mobile */}
      <button
        onClick={()=>setMenuOpen(v=>!v)}
        className="hdr-hamburger"
        style={{ display:'none', padding:8, borderRadius:'var(--r)', border:'1px solid var(--border)', background:'transparent', color:'var(--gold)', cursor:'pointer', fontSize:20, lineHeight:1 }}
      >☰</button>
    </header>
  )
}

export default function AdminGrafo() {
  const navigate = useNavigate()
  const [evaluaciones, setEvaluaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [openId, setOpenId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Estados modales
  const [editando, setEditando] = useState(false)
  const [editDim, setEditDim] = useState(0)
  const [editPreguntas, setEditPreguntas] = useState([])
  const [editLoading, setEditLoading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [pdfModal, setPdfModal] = useState(null)
  const [showCodigo, setShowCodigo] = useState(false)
  const [codigoActual, setCodigoActual] = useState('')
  const [nuevoCodigo, setNuevoCodigo] = useState('')

  const [showQR, setShowQR] = useState(false)
  const [qrNombre, setQrNombre] = useState('')
  const [qrApellido, setQrApellido] = useState('')
  const [qrURL, setQrURL] = useState('')
  const [qrGenerado, setQrGenerado] = useState(false)
  const qrRef = useRef(null)

  const [toast, setToast] = useState({ show:false, msg:'', type:'' })
  const [pdfDatos, setPdfDatos] = useState({
    edad:'', estadoCivil:'', hijos:'', convivientes:'0',
    ocupacion:'', enfermedad:'', medicacion:'', observaciones:'',
    nivelA:'Medio', nivelB:'Medio', nivelC:'Medio', nivelD:'Medio',
    perfil:'A', tieneDinamica:false, dinamica:'evasion',
    fortalezas:'', areas:''
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('evaluaciones').select('*').order('created_at', { ascending:false })
    setEvaluaciones(data||[])
    setLoading(false)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta evaluación?')) return
    await supabase.from('evaluaciones').delete().eq('id', id)
    if (openId===id) setOpenId(null)
    cargar()
  }

  function showToast(msg, type='success') {
    setToast({ show:true, msg, type })
    setTimeout(()=>setToast({ show:false, msg:'', type:'' }), 3000)
  }

  // EXCEL
  function exportarExcel() {
    const filas = evaluaciones.map(e => {
      const row = { 'Nombre':e.nombre, 'Apellido':e.apellido, 'Fecha':e.created_at?new Date(e.created_at).toLocaleDateString('es-AR'):'' }
      DIMENSIONES.forEach(dim=>{
        const r=e.resultados?.[dim.id]
        if(r){
          row[dim.nombre+' (+)']=r.valores?.A||0
          row[dim.nombre+' (x)']=r.valores?.B||0
          row[dim.nombre+' (=)']=r.valores?.C||0
          row[dim.nombre+' (-)']=r.valores?.D||0
          row[dim.nombre+' Dom.']=r.dominante||''
          row[dim.nombre+' Rango']=r.rango||''
        }
      })
      return row
    })
    const ws=XLSX.utils.json_to_sheet(filas)
    ws['!cols']=Object.keys(filas[0]||{}).map(k=>({wch:Math.max(k.length,12)}))
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Evaluaciones')
    XLSX.writeFile(wb,'Grafogenesis_'+new Date().toISOString().split('T')[0]+'.xlsx')
  }

  // EDITOR
  async function abrirEditor() {
    setMenuOpen(false)
    setEditando(true)
    await cargarPreguntasDim(0)
  }

  async function cargarPreguntasDim(idx) {
    setEditLoading(true)
    setEditDim(idx)
    const { data } = await supabase.from('preguntas').select('*').eq('dimension_id',DIMENSIONES[idx].id).order('orden')
    setEditPreguntas(data||[])
    setEditLoading(false)
  }

  function updatePregunta(idx, field, value) {
    setEditPreguntas(prev=>prev.map((p,i)=>i===idx?{...p,[field]:value}:p))
  }

  async function guardarPreguntas() {
    setSavingEdit(true)
    for(const p of editPreguntas){
      await supabase.from('preguntas').update({
        pregunta:p.pregunta,opcion_a:p.opcion_a,
        opcion_b:p.opcion_b,opcion_c:p.opcion_c,opcion_d:p.opcion_d,
      }).eq('id',p.id)
    }
    setSavingEdit(false)
    showToast('Preguntas guardadas')
  }

  // CÓDIGO
  async function cargarCodigo() {
    const { data } = await supabase.from('config').select('valor').eq('clave','codigo_acceso').single()
    if(data){ setCodigoActual(data.valor); setNuevoCodigo(data.valor) }
  }

  async function guardarCodigo() {
    if(!nuevoCodigo.trim()) return
    const val=nuevoCodigo.trim().toUpperCase()
    await supabase.from('config').update({valor:val}).eq('clave','codigo_acceso')
    setCodigoActual(val)
    setShowCodigo(false)
    showToast('Código actualizado: '+val)
  }

  // QR
  async function generarQR() {
    if(!qrNombre.trim()||!qrApellido.trim()){
      showToast('Ingresá nombre y apellido','error')
      return
    }
    const { data } = await supabase.from('config').select('valor').eq('clave','codigo_acceso').single()
    const code = data?.valor||'GRAFO2024'
    const base = window.location.origin
    const url = `${base}/evaluacion?nombre=${encodeURIComponent(qrNombre.trim())}&apellido=${encodeURIComponent(qrApellido.trim())}&code=${encodeURIComponent(code)}`
    setQrURL(url)
    setQrGenerado(true)
  }

  function descargarQR() {
    const svg = qrRef.current?.querySelector('svg')
    if(!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 400
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0,0,400,400)
      ctx.drawImage(img,0,0,400,400)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `QR_${qrNombre}_${qrApellido}.png`
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // PDF
  function abrirPDFModal(ev) {
    const r=ev.resultados||{}
    let tA=0,tB=0,tC=0,tD=0
    DIMENSIONES.forEach(dim=>{const d=r[dim.id];if(!d)return;tA+=d.valores?.A||0;tB+=d.valores?.B||0;tC+=d.valores?.C||0;tD+=d.valores?.D||0})
    const vals=[tA,tB,tC,tD],max=Math.max(...vals)
    setPdfDatos(prev=>({...prev,perfil:['A','B','C','D'][vals.indexOf(max)]}))
    setPdfModal(ev)
  }

  function generarPDF() {
    generarPDFGrafo(pdfModal,pdfDatos)
    setPdfModal(null)
  }

  const filtered = evaluaciones.filter(e=>
    !filtro||`${e.nombre} ${e.apellido}`.toLowerCase().includes(filtro.toLowerCase())
  )

  // ── VISTA EDITOR ─────────────────────────────────────────────
  if (editando) return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>
      <Header
        titulo="Editor de Preguntas"
        subtitulo="Grafogénesis®"
        setMenuOpen={setMenuOpen}
        acciones={<>
          <button onClick={guardarPreguntas} disabled={savingEdit} style={S.btnGold}>
            {savingEdit?'Guardando...':'💾 Guardar'}
          </button>
          <button onClick={()=>setEditando(false)} style={S.btnOutline}>← Volver</button>
        </>}
      />

      <div style={{ padding:'1rem', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
          {DIMENSIONES.map((dim,idx)=>(
            <button key={dim.id} onClick={()=>cargarPreguntasDim(idx)} style={{
              padding:'6px 12px', borderRadius:'var(--r)', fontFamily:'DM Sans,sans-serif', fontSize:12, cursor:'pointer',
              border:editDim===idx?'1px solid var(--gold)':'1px solid var(--border)',
              background:editDim===idx?'var(--gold)':'var(--surface)',
              color:editDim===idx?'var(--dark)':'var(--text2)',
            }}>{dim.nombre.replace('Dimensión ','')}</button>
          ))}
        </div>

        {editLoading && <p style={{ color:'var(--text3)',textAlign:'center',padding:'2rem' }}>Cargando...</p>}

        {!editLoading && editPreguntas.map((p,idx)=>(
          <div key={p.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:14, marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
              Pregunta {p.orden}
            </div>
            <textarea value={p.pregunta} onChange={e=>updatePregunta(idx,'pregunta',e.target.value)} rows={2} style={{...S.textarea,marginBottom:10}} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
              {['a','b','c','d'].map((l,li)=>(
                <div key={l}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Opción {l.toUpperCase()} ({['+','x','=','-'][li]})</div>
                  <textarea value={p['opcion_'+l]} onChange={e=>updatePregunta(idx,'opcion_'+l,e.target.value)} rows={2} style={S.textarea} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`toast${toast.show?' show':''}${toast.type?' '+toast.type:''}`}>{toast.msg}</div>
    </div>
  )

  // ── VISTA PRINCIPAL ──────────────────────────────────────────
  const accionesPrincipales = <>
    <button onClick={()=>{setMenuOpen(false);setShowQR(true);setQrGenerado(false);setQrNombre('');setQrApellido('')}} style={S.btnGold}>
      📲 Generar QR
    </button>
    <button onClick={abrirEditor} style={S.btnOutline}>✏ Preguntas</button>
    <button onClick={()=>{setMenuOpen(false);setShowCodigo(true);cargarCodigo()}} style={S.btnOutline}>🔑 Código</button>
    <button onClick={()=>{setMenuOpen(false);exportarExcel()}} style={S.btnOutline}>⬇ Excel</button>
    <button onClick={()=>navigate('/')} style={S.btnOutline}>← Legajos</button>
  </>

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>
      {/* CSS responsive inline */}
      <style>{`
        @media (max-width: 640px) {
          .hdr-btns-desktop { display: none !important; }
          .hdr-hamburger { display: flex !important; align-items: center; justify-content: center; }
        }
        @media (min-width: 641px) {
          .hdr-hamburger { display: none !important; }
          .hdr-btns-desktop { display: flex !important; }
        }
      `}</style>

      <header style={{
        background:'var(--dark2)', borderBottom:'1px solid var(--border2)',
        padding:'0 1rem', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:62,
        position:'sticky', top:0, zIndex:200
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0, flex:1 }}>
          <img src={LOGO} alt="Logo"
            style={{ height:34,width:34,objectFit:'contain',borderRadius:'50%',background:'white',padding:2,flexShrink:0 }}
            onError={e=>e.target.style.display='none'}
          />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(13px,4vw,19px)', color:'var(--gold)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              Grafogénesis® — Evaluaciones
            </div>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>
              Panel Profesional
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="hdr-btns-desktop" style={{ display:'flex', gap:6, flexShrink:0 }}>
          {accionesPrincipales}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={()=>setMenuOpen(v=>!v)}
          className="hdr-hamburger"
          style={{ display:'none', padding:8, borderRadius:'var(--r)', border:'1px solid var(--border)', background:'transparent', color:'var(--gold)', cursor:'pointer', fontSize:22, lineHeight:1, flexShrink:0 }}
        >☰</button>
      </header>

      {/* MENÚ MÓVIL */}
      {menuOpen && (
        <div style={{
          position:'fixed', top:62, left:0, right:0, zIndex:190,
          background:'var(--dark2)', borderBottom:'1px solid var(--border2)',
          padding:'1rem', display:'flex', flexDirection:'column', gap:8
        }}>
          <button onClick={()=>{setMenuOpen(false);setShowQR(true);setQrGenerado(false);setQrNombre('');setQrApellido('')}} style={{...S.btnGold,width:'100%',padding:'12px'}}>📲 Generar QR</button>
          <button onClick={abrirEditor} style={{...S.btnOutline,width:'100%',padding:'12px'}}>✏ Editar Preguntas</button>
          <button onClick={()=>{setMenuOpen(false);setShowCodigo(true);cargarCodigo()}} style={{...S.btnOutline,width:'100%',padding:'12px'}}>🔑 Gestionar Código</button>
          <button onClick={()=>{setMenuOpen(false);exportarExcel()}} style={{...S.btnOutline,width:'100%',padding:'12px'}}>⬇ Exportar Excel</button>
          <button onClick={()=>navigate('/')} style={{...S.btnOutline,width:'100%',padding:'12px'}}>← Volver a Legajos</button>
        </div>
      )}

      <div style={{ padding:'1rem', maxWidth:1280, margin:'0 auto' }}>
        <div style={{ display:'flex', gap:8, marginBottom:'1.2rem', flexWrap:'wrap', alignItems:'center' }}>
          <input
            style={{...S.input, width:'100%', maxWidth:280}}
            placeholder="🔍 Buscar por nombre..."
            value={filtro}
            onChange={e=>setFiltro(e.target.value)}
          />
          <span style={{ fontSize:12, color:'var(--text3)' }}>
            {filtered.length} evaluación{filtered.length!==1?'es':''}
          </span>
        </div>

        {loading && <p style={{ color:'var(--text3)', textAlign:'center', padding:'2rem' }}>Cargando...</p>}

        {!loading && filtered.length===0 && (
          <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--text3)' }}>
            <div style={{ fontSize:42, marginBottom:'.8rem' }}>📋</div>
            <div style={{ marginBottom:8 }}>No hay evaluaciones registradas</div>
            <div style={{ fontSize:12 }}>
              Generá un QR para cada paciente desde el botón <strong style={{color:'var(--gold)'}}>📲 Generar QR</strong>
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(ev=>{
            const isOpen=openId===ev.id
            const fecha=ev.created_at?new Date(ev.created_at).toLocaleDateString('es-AR'):'—'
            const r=ev.resultados||{}
            let tA=0,tB=0,tC=0,tD=0
            DIMENSIONES.forEach(dim=>{const d=r[dim.id];if(!d)return;tA+=d.valores?.A||0;tB+=d.valores?.B||0;tC+=d.valores?.C||0;tD+=d.valores?.D||0})
            const tTotal=tA+tB+tC+tD||1

            return (
              <div key={ev.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
                <div
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px', cursor:'pointer', userSelect:'none' }}
                  onClick={()=>setOpenId(isOpen?null:ev.id)}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <div style={{ background:'var(--dark2)', border:'1px solid var(--border2)', color:'var(--gold)', fontFamily:'Cormorant Garamond,serif', fontSize:13, fontWeight:600, padding:'4px 12px', borderRadius:4, whiteSpace:'nowrap', flexShrink:0 }}>
                      {ev.nombre} {ev.apellido}
                    </div>
                    <span style={{ color:'var(--text3)', fontSize:11, whiteSpace:'nowrap' }}>{fecha}</span>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:18, transition:'transform .2s', transform:isOpen?'rotate(90deg)':'none', display:'inline-block', flexShrink:0, marginLeft:8 }}>›</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop:'1px solid var(--border)', padding:14 }}>
                    {/* Resumen */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
                      {[{l:'(+)',v:tA,c:'#27ae60'},{l:'(x)',v:tB,c:'#e74c3c'},{l:'(=)',v:tC,c:'#f39c12'},{l:'(-)',v:tD,c:'#0891b2'}].map(s=>(
                        <div key={s.l} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 4px', textAlign:'center' }}>
                          <div style={{ fontSize:18, fontFamily:'Cormorant Garamond,serif', color:s.c, fontWeight:300 }}>{s.v}</div>
                          <div style={{ fontSize:10, color:'var(--text3)' }}>{s.l}</div>
                          <div style={{ fontSize:10, color:'var(--text2)' }}>{((s.v/tTotal)*100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>

                    {/* Tabla */}
                    <div style={{ overflowX:'auto', marginBottom:12 }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, minWidth:440 }}>
                        <thead>
                          <tr style={{ background:'var(--dark2)' }}>
                            <th style={{ padding:'7px 8px', textAlign:'left', color:'var(--text3)', fontWeight:500 }}>Dimensión</th>
                            {['+','x','=','-'].map(s=><th key={s} style={{ padding:'7px 8px', textAlign:'center', color:'var(--gold)', fontWeight:700, fontSize:13 }}>{s}</th>)}
                            <th style={{ padding:'7px 8px', textAlign:'center', color:'var(--text3)', fontWeight:500 }}>Dom.</th>
                            <th style={{ padding:'7px 8px', textAlign:'center', color:'var(--text3)', fontWeight:500 }}>Rango</th>
                          </tr>
                        </thead>
                        <tbody>
                          {DIMENSIONES.map((dim,di)=>{
                            const d=ev.resultados?.[dim.id]; if(!d) return null
                            return (
                              <tr key={dim.id} style={{ background:di%2===0?'var(--dark2)':'transparent', borderBottom:'1px solid var(--border)' }}>
                                <td style={{ padding:'6px 8px', color:'var(--text2)', fontSize:11 }}>{dim.nombre}</td>
                                {['A','B','C','D'].map(l=>(
                                  <td key={l} style={{ padding:'6px 8px', textAlign:'center' }}>
                                    <span style={{ color:'var(--text)', fontWeight:500 }}>{d.valores?.[l]||0}</span>
                                    <div style={{ fontSize:10, color:'var(--text3)' }}>{d.porcentajes?.[l]?.toFixed(0)}%</div>
                                  </td>
                                ))}
                                <td style={{ padding:'6px 8px', textAlign:'center', color:'var(--gold)', fontWeight:700 }}>{d.dominante}</td>
                                <td style={{ padding:'6px 8px', textAlign:'center', color:'var(--text2)', fontSize:11 }}>{d.rango}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button onClick={()=>abrirPDFModal(ev)} style={S.btnGold}>📄 Generar PDF</button>
                      <button onClick={()=>eliminar(ev.id)} style={{ padding:'8px 14px', borderRadius:'var(--r)', border:'1px solid rgba(192,57,43,.45)', background:'transparent', color:'#e74c3c', fontFamily:'DM Sans,sans-serif', fontSize:13, cursor:'pointer' }}>✕ Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL QR */}
      {showQR && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'2rem', width:'100%', maxWidth:420 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'var(--gold)', marginBottom:'1rem' }}>📲 Generar QR para Paciente</h2>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:'1rem', lineHeight:1.6 }}>
              El paciente escanea el QR y entra directo al cuestionario con sus datos pre-cargados.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:'1rem' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Nombre del paciente</div>
                <input
                  value={qrNombre}
                  onChange={e=>{setQrNombre(e.target.value);setQrGenerado(false)}}
                  placeholder="Ej: María"
                  style={S.input}
                />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Apellido del paciente</div>
                <input
                  value={qrApellido}
                  onChange={e=>{setQrApellido(e.target.value);setQrGenerado(false)}}
                  placeholder="Ej: González"
                  style={S.input}
                />
              </div>
            </div>

            <button onClick={generarQR} style={{...S.btnGold, width:'100%', padding:'12px', marginBottom:'1rem'}}>
              Generar QR
            </button>

            {qrGenerado && (
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'inline-block', background:'white', padding:16, borderRadius:'var(--r2)', marginBottom:12 }} ref={qrRef}>
                  <QRCodeSVG
                    value={qrURL}
                    size={220}
                    level="H"
                    imageSettings={{
                      src: LOGO,
                      x: undefined, y: undefined,
                      height: 40, width: 40,
                      excavate: true,
                    }}
                  />
                </div>
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>
                    <strong style={{color:'var(--gold)'}}>{qrNombre} {qrApellido}</strong>
                  </p>
                  <p style={{ fontSize:10, color:'var(--text3)', wordBreak:'break-all' }}>{qrURL}</p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={descargarQR} style={{...S.btnGold, flex:1, padding:'10px'}}>
                    ⬇ Descargar QR
                  </button>
                  <button
                    onClick={()=>navigator.clipboard.writeText(qrURL).then(()=>showToast('Link copiado'))}
                    style={{...S.btnOutline, flex:1, padding:'10px'}}
                  >
                    📋 Copiar link
                  </button>
                </div>
              </div>
            )}

            <button onClick={()=>setShowQR(false)} style={{...S.btnOutline, width:'100%', padding:'10px', marginTop:12}}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CÓDIGO */}
      {showCodigo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'2rem', width:'100%', maxWidth:380 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'var(--gold)', marginBottom:'1rem' }}>🔑 Código de Acceso</h2>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:'1rem', lineHeight:1.6 }}>
              Código actual: <strong style={{color:'var(--gold)'}}>{codigoActual}</strong><br/>
              Usalo cuando el paciente ingresa manualmente sin QR.
            </p>
            <div style={{ marginBottom:'1rem' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Nuevo código</div>
              <input value={nuevoCodigo} onChange={e=>setNuevoCodigo(e.target.value.toUpperCase())} placeholder="Ej: GRAFO2024" style={{...S.input,letterSpacing:'.1em',fontWeight:500}} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowCodigo(false)} style={{...S.btnOutline,flex:1,padding:'10px'}}>Cancelar</button>
              <button onClick={guardarCodigo} style={{...S.btnGold,flex:2,padding:'10px'}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PDF */}
      {pdfModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:1000, overflowY:'auto', padding:'1rem' }}>
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'1.5rem', width:'100%', maxWidth:560, margin:'auto' }}>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'var(--gold)', marginBottom:'.8rem' }}>📋 Datos del Informe</h2>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:'1rem' }}>
              {pdfModal.nombre} {pdfModal.apellido} · {pdfModal.created_at?new Date(pdfModal.created_at).toLocaleDateString('es-AR'):''}
            </p>

            <div style={S.panel}>
              <div style={S.panelTitle}>Datos del Evaluado</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                {[['edad','Edad','35'],['estadoCivil','Estado Civil','Casado/a'],['hijos','Hijos','—'],['ocupacion','Ocupación','Docente']].map(([key,label,ph])=>(
                  <div key={key}>
                    <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>{label}</div>
                    <input value={pdfDatos[key]} onChange={e=>setPdfDatos(p=>({...p,[key]:e.target.value}))} placeholder={ph} style={S.input} />
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Convivientes</div>
                  <select value={pdfDatos.convivientes} onChange={e=>setPdfDatos(p=>({...p,convivientes:e.target.value}))} style={{...S.select,width:'100%'}}>
                    {['0','1','2','3','4','5','6','7','8','9','10+'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Enfermedad</div>
                  <input value={pdfDatos.enfermedad} onChange={e=>setPdfDatos(p=>({...p,enfermedad:e.target.value}))} placeholder="Ninguna" style={S.input} />
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Medicación</div>
                <input value={pdfDatos.medicacion} onChange={e=>setPdfDatos(p=>({...p,medicacion:e.target.value}))} placeholder="Ninguna" style={S.input} />
              </div>
              <div>
                <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Observaciones</div>
                <textarea value={pdfDatos.observaciones} onChange={e=>setPdfDatos(p=>({...p,observaciones:e.target.value}))} rows={2} placeholder="Observaciones relevantes..." style={S.textarea} />
              </div>
            </div>

            <div style={S.panel}>
              <div style={S.panelTitle}>Niveles de Influencia</div>
              {[['nivelA','Predominante (+)'],['nivelB','Intermedia (x)'],['nivelC','Irregular (=)'],['nivelD','Deficitaria (-)']].map(([key,label])=>(
                <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
                  <select value={pdfDatos[key]} onChange={e=>setPdfDatos(p=>({...p,[key]:e.target.value}))} style={S.select}>
                    {['Nulo','Bajo','Medio','Alto'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={S.panel}>
              <div style={S.panelTitle}>Perfil Predominante</div>
              <select value={pdfDatos.perfil} onChange={e=>setPdfDatos(p=>({...p,perfil:e.target.value}))} style={{...S.select,width:'100%'}}>
                <option value="A">PERFIL PREDOMINANTE (+)</option>
                <option value="B">PERFIL EQUILIBRADO — EMPÁTICO (x)</option>
                <option value="C">PERFIL INHIBIDO — CAUTELOSO (=)</option>
                <option value="D">PERFIL PRAGMÁTICO — PROFESIONAL (-)</option>
              </select>
            </div>

            <div style={S.panel}>
              <div style={S.panelTitle}>Dinámica Combinada</div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:10 }}>
                <input type="checkbox" checked={pdfDatos.tieneDinamica} onChange={e=>setPdfDatos(p=>({...p,tieneDinamica:e.target.checked}))} style={{ width:'auto', accentColor:'var(--gold)' }} />
                <span style={{ fontSize:13, color:'var(--text2)' }}>Hay dinámica combinada</span>
              </label>
              {pdfDatos.tieneDinamica && (
                <select value={pdfDatos.dinamica} onChange={e=>setPdfDatos(p=>({...p,dinamica:e.target.value}))} style={{...S.select,width:'100%'}}>
                  <option value="evasion">Dinámica de Evasión (+/=)</option>
                  <option value="compensacion">Dinámica de Compensación (+/x)</option>
                </select>
              )}
            </div>

            <div style={S.panel}>
              <div style={S.panelTitle}>Conclusiones</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Fortalezas detectadas</div>
                <textarea value={pdfDatos.fortalezas} onChange={e=>setPdfDatos(p=>({...p,fortalezas:e.target.value}))} rows={2} placeholder="Ej: Capacidad analítica..." style={S.textarea} />
              </div>
              <div>
                <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>Áreas de mejora</div>
                <textarea value={pdfDatos.areas} onChange={e=>setPdfDatos(p=>({...p,areas:e.target.value}))} rows={2} placeholder="Ej: Manejo de la frustración..." style={S.textarea} />
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setPdfModal(null)} style={{...S.btnOutline,flex:1,padding:'12px'}}>Cancelar</button>
              <button onClick={generarPDF} style={{...S.btnGold,flex:2,padding:'12px'}}>🖨️ Generar PDF</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.show?' show':''}${toast.type?' '+toast.type:''}`}>{toast.msg}</div>
    </div>
  )
}