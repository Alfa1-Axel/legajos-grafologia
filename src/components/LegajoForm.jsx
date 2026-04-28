import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Ficha from './Ficha'
import Consentimiento from './Consentimiento'
import ImagenesOjo from '../components/ImagenesOjo'
import Observaciones from './Observaciones'
import { generarPDF } from '../utils/pdf'

function padId(n) { return String(n).padStart(3, '0') }

const EMPTY_FORM = {
  edad:'', sexo:'', escolaridad:'', lateralidad:'', diagnostico:'', fase:'',
  medicamentos:'', medicamentos_detalle:'',
  fecha_escritura: new Date().toISOString().split('T')[0],
  hora:'', lugar:'', instrumento:'', papel:'', tipo_escrito:'', animo:'',
  limitaciones:'', analisis_correspondencia:'',
  c_fecha: new Date().toISOString().split('T')[0],
  c_autoriza:'Grafologa Marcela Zapata / Grafologa Magdalena Martínez / Grafologo Leonardo Lembo',
  c_analiza:'', c_edad:'', c_sexo:'', c_dni:'',
  c_fecha_muestra: new Date().toISOString().split('T')[0],
  c_aclaracion:'', c_firma_desc:'', c_firma_paciente:'', c_acepta: false,
  color_codes:[
    { color:'#ff0000', meaning:'Brizado' },
    { color:'#0066ff', meaning:'Zona superior' },
    { color:'#00cc44', meaning:'Zona inferior' },
  ],
  images:[],
  obs_img:'', obs_general:'', obs_escritura:'', obs_psico:'',
  obs_corr:'', obs_concl:'', obs_notas:''
}

export default function LegajoForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [tab, setTab] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [num, setNum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })

  useEffect(() => {
    async function init() {
      if (isEdit) {
        setLoading(true)
        const { data, error } = await supabase
          .from('legajos').select('*').eq('id', id).single()
        if (error || !data) { navigate('/'); return }
        setForm(data)
        setNum(data.num)
        setLoading(false)
        if (searchParams.get('pdf') === '1') {
          await generarPDF(data.num, data)
        }
      } else {
        const { data } = await supabase
          .from('legajos')
          .select('num')
          .order('num', { ascending: false })
          .limit(1)
        setNum(data?.length ? data[0].num + 1 : 1)
        setLoading(false)
      }
    }
    init()
  }, [id, isEdit, navigate, searchParams])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function showToast(msg, type) {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3200)
  }

  function compressImage(src, maxW, quality) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(1, maxW / img.width)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(src)
      img.src = src
    })
  }

  async function compressAll(images) {
    return Promise.all(
      (images || []).map(src => src ? compressImage(src, 800, 0.72) : null)
    )
  }

  async function handleSave() {
    setShowConfirm(false)
    setSaving(true)

    const compImages = await compressAll(form.images)
    const payload = { ...form, images: compImages }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    let error, savedData
    if (isEdit) {
      ;({ error, data: savedData } = await supabase
        .from('legajos').update(payload).eq('id', id).select().single())
    } else {
      payload.num = num
      ;({ error, data: savedData } = await supabase
        .from('legajos').insert(payload).select().single())
    }

    if (error) {
      showToast('Error al guardar: ' + error.message, 'error')
      setSaving(false)
      return
    }

    try {
      await generarPDF(num, { ...savedData })
      showToast('Legajo guardado correctamente', 'success')
      setTimeout(() => navigate('/'), 1800)
    } catch (pdfErr) {
      console.error(pdfErr)
      showToast('Guardado, pero error al generar PDF', 'error')
    }
    setSaving(false)
  }

  const tabs = ['📋 Ficha', '📄 Consentimiento', '🔍 Imágenes', '📝 Observaciones']

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <p style={{ color:'var(--text3)' }}>Cargando...</p>
    </div>
  )

  return (
    <>
      <header className="hdr">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="hdr-logo">G</div>
          <div>
            <div className="hdr-title">
              {isEdit ? `Editando Legajo #${padId(num)}` : 'Nuevo Legajo'}
            </div>
            <div className="hdr-sub">
              {isEdit ? 'Modificar datos existentes' : `Legajo #${padId(num || 1)}`}
            </div>
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/')}>← Volver</button>
      </header>

      <main className="main">
        <div className="page-tabs">
          {tabs.map((t, i) => (
            <button
              key={i}
              className={`ptab${tab === i ? ' active' : ''}`}
              onClick={() => setTab(i)}
            >{t}</button>
          ))}
        </div>

        {tab === 0 && <Ficha form={form} update={update} />}
        {tab === 1 && <Consentimiento form={form} update={update} num={num} />}
        {tab === 2 && <ImagenesOjo form={form} update={update} />}
        {tab === 3 && <Observaciones form={form} update={update} />}

        <div className="form-nav">
          {tab > 0
            ? <button className="btn btn-outline" onClick={() => setTab(t => t - 1)}>← Anterior</button>
            : <div />
          }
          {tab < 3
            ? <button className="btn btn-gold" onClick={() => setTab(t => t + 1)}>Siguiente →</button>
            : <button className="btn btn-gold" onClick={() => setShowConfirm(true)} disabled={saving}>
                {saving ? 'Guardando...' : '✓ Guardar y generar PDF'}
              </button>
          }
        </div>
      </main>

      {showConfirm && (
        <div className="modal-ov open">
          <div className="modal">
            <div style={{ fontSize:32, marginBottom:'.8rem' }}>📄</div>
            <div style={{
              fontFamily:'Cormorant Garamond, serif', fontSize:20,
              color:'var(--gold)', marginBottom:'.4rem'
            }}>Confirmar guardado</div>
            <p style={{ color:'var(--text2)', fontSize:13, marginBottom:'1.3rem', lineHeight:1.65 }}>
              ¿Guardar el Legajo {padId(num)}? Se generará un PDF con el número
              de legajo sin nombre del consultante.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleSave}>✓ Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.show ? ' show' : ''}${toast.type ? ' ' + toast.type : ''}`}>
        {toast.msg}
      </div>
    </>
  )
}