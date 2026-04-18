import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

function padId(n) { return String(n).padStart(3, '0') }

const LOGO_URL = 'https://i.imgur.com/oQ0t2v2.png'

export default function Dashboard() {
  const navigate = useNavigate()
  const [legajos, setLegajos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterId, setFilterId] = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [openCard, setOpenCard] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetch() {
      setLoading(true)
      const { data, error } = await supabase
        .from('legajos').select('*').order('num', { ascending: false })
      if (!error && isMounted) setLegajos(data || [])
      if (isMounted) setLoading(false)
    }
    fetch()
    return () => { isMounted = false }
  }, [])

  async function loadLegajos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('legajos').select('*').order('num', { ascending: false })
    if (!error) setLegajos(data || [])
    setLoading(false)
  }

  async function deleteLegajo(id) {
    if (!confirm('¿Eliminar este legajo? No se puede deshacer.')) return
    const { error } = await supabase.from('legajos').delete().eq('id', id)
    if (error) { alert('Error al eliminar'); return }
    await loadLegajos()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function exportarExcel() {
    const filas = legajos.map(l => ({
      'Legajo':               padId(l.num),
      'Fecha Escritura':      l.fecha_escritura || '',
      'Edad':                 l.edad || '',
      'Sexo':                 l.sexo || '',
      'Escolaridad':          l.escolaridad || '',
      'Lateralidad':          l.lateralidad || '',
      'Diagnóstico':          l.diagnostico || '',
      'Fase / Estadio':       l.fase || '',
      'Medicamentos':         l.medicamentos || '',
      'Detalle Medicamentos': l.medicamentos_detalle || '',
      'Hora':                 l.hora || '',
      'Lugar':                l.lugar || '',
      'Instrumento':          l.instrumento || '',
      'Tipo Papel':           l.papel || '',
      'Tipo Escrito':         l.tipo_escrito || '',
      'Estado Anímico':       l.animo || '',
      'Limitaciones':         l.limitaciones || '',
      'Análisis Correspond.': l.analisis_correspondencia || '',
      'Consentimiento':       l.c_acepta ? 'Sí' : 'No',
      'DNI Firmante':         l.c_dni || '',
      'Obs. General':         l.obs_general || '',
      'Obs. Escritura':       l.obs_escritura || '',
      'Obs. Psicológicas':    l.obs_psico || '',
      'Correspondencia Diag': l.obs_corr || '',
      'Conclusiones':         l.obs_concl || '',
      'Imágenes':             (l.images || []).filter(Boolean).length,
      'Fecha Registro':       l.created_at ? new Date(l.created_at).toLocaleDateString('es-AR') : '',
    }))

    const ws = XLSX.utils.json_to_sheet(filas)

    // Ancho de columnas automático
    const colWidths = Object.keys(filas[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Legajos')
    XLSX.writeFile(wb, 'Legajos_Grafologia_' + new Date().toISOString().split('T')[0] + '.xlsx')
  }

  const now = new Date()
  const filtered = legajos.filter(l => {
    const idMatch = !filterId || padId(l.num).includes(filterId)
    const fechaMatch = !filterFecha || (l.fecha_escritura || '').startsWith(filterFecha)
    return idMatch && fechaMatch
  })
  const thisMonth = legajos.filter(l => {
    if (!l.created_at) return false
    const d = new Date(l.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const totalImgs = legajos.reduce((s, l) =>
    s + (Array.isArray(l.images) ? l.images.filter(Boolean).length : 0), 0)

  return (
    <>
      <header className="hdr">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img
            src={LOGO_URL}
            alt="Logo"
            style={{ height:38, width:38, objectFit:'contain', borderRadius:'50%' }}
            onError={e => { e.target.style.display='none' }}
          />
          <div>
            <div className="hdr-title">Legajos Grafológicos</div>
            <div className="hdr-sub">Sistema de Registro Digital</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-outline" onClick={exportarExcel}>⬇ Excel</button>
          <button className="btn btn-gold" onClick={() => navigate('/legajo/nuevo')}>+ Nuevo Legajo</button>
          <button className="btn btn-outline" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <main className="main">
        <h1 style={{
          fontFamily:'Cormorant Garamond, serif', fontSize:26,
          color:'var(--gold)', fontWeight:300, fontStyle:'italic', marginBottom:'1.2rem'
        }}>Registro de Legajos</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{legajos.length}</div>
            <div className="stat-lbl">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{thisMonth}</div>
            <div className="stat-lbl">Este mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{totalImgs}</div>
            <div className="stat-lbl">Imágenes</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:'1.2rem', flexWrap:'wrap' }}>
          <input
            style={{ width:200 }}
            placeholder="🔍 Filtrar por ID..."
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
          />
          <input
            type="date"
            style={{ width:200 }}
            value={filterFecha}
            onChange={e => setFilterFecha(e.target.value)}
          />
        </div>

        {loading && (
          <p style={{ color:'var(--text3)', textAlign:'center', padding:'2rem' }}>Cargando...</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize:42, marginBottom:'.8rem' }}>📂</div>
            <div>No hay legajos registrados</div>
            <div style={{ fontSize:12, marginTop:5 }}>
              Hacé click en "+ Nuevo Legajo" para comenzar
            </div>
          </div>
        )}

        {filtered.map(l => {
          const fStr = l.fecha_escritura
            ? new Date(l.fecha_escritura + 'T12:00:00').toLocaleDateString('es-AR') : '—'
          const cStr = l.created_at
            ? new Date(l.created_at).toLocaleDateString('es-AR') : ''
          const nImgs = (l.images || []).filter(Boolean).length
          const isOpen = openCard === l.id

          return (
            <div key={l.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'13px 16px', cursor:'pointer', userSelect:'none'
                }}
                onClick={() => setOpenCard(isOpen ? null : l.id)}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="leg-badge">Legajo {padId(l.num)}</div>
                  <div>
                    <div style={{ color:'var(--text2)', fontSize:12 }}>
                      Fecha muestra: {fStr}
                      {l.diagnostico ? ' · ' + l.diagnostico : ''}
                    </div>
                    <div style={{ color:'var(--text3)', fontSize:11 }}>
                      Registrado: {cStr}
                      {nImgs ? ` · ${nImgs} imagen${nImgs > 1 ? 'es' : ''}` : ''}
                      {l.c_acepta ? ' · ✓ Consentimiento' : ''}
                    </div>
                  </div>
                </div>
                <span style={{
                  color:'var(--gold)', fontSize:18,
                  transition:'transform .2s',
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  display:'inline-block'
                }}>›</span>
              </div>

              {isOpen && (
                <div style={{
                  borderTop:'1px solid var(--border)',
                  padding:'14px 16px',
                  display:'flex', flexDirection:'column', gap:10
                }}>
                  <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
                    {l.edad && <span><span style={{color:'var(--text3)'}}>Edad:</span> {l.edad} &nbsp;</span>}
                    {l.sexo && <span><span style={{color:'var(--text3)'}}>Sexo:</span> {l.sexo} &nbsp;</span>}
                    {l.lateralidad && <span><span style={{color:'var(--text3)'}}>Lateralidad:</span> {l.lateralidad} &nbsp;</span>}
                    {l.instrumento && <span><span style={{color:'var(--text3)'}}>Instrumento:</span> {l.instrumento}</span>}
                    {l.fase && <div><span style={{color:'var(--text3)'}}>Fase:</span> {l.fase}</div>}
                    {l.medicamentos && (
                      <div>
                        <span style={{color:'var(--text3)'}}>Medicamentos:</span> {l.medicamentos}
                        {l.medicamentos_detalle ? ' (' + l.medicamentos_detalle + ')' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => navigate(`/legajo/${l.id}`)}
                    >✏ Editar / Ver</button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/legajo/${l.id}?pdf=1`)}
                    >📄 PDF</button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteLegajo(l.id)}
                    >✕ Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </main>
    </>
  )
}