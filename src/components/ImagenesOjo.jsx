import { useRef, useState } from 'react'

const CLOCK_POSITIONS = [
  { h:12, x:50,  y:6  },
  { h:1,  x:72,  y:11 },
  { h:2,  x:88,  y:28 },
  { h:3,  x:94,  y:50 },
  { h:4,  x:88,  y:72 },
  { h:5,  x:72,  y:89 },
  { h:6,  x:50,  y:94 },
  { h:7,  x:28,  y:89 },
  { h:8,  x:12,  y:72 },
  { h:9,  x:6,   y:50 },
  { h:10, x:12,  y:28 },
  { h:11, x:28,  y:11 },
]

export default function ImagenesOjo({ form, update }) {
  const [activeSlot, setActiveSlot]       = useState(null)
  const [zoomLevel, setZoomLevel]         = useState(5)
  const [mousePos, setMousePos]           = useState(null)
  const [previewStyle, setPreviewStyle]   = useState({})
  const [zoomSrc, setZoomSrc]             = useState(null)
  const [activeCCIdx, setActiveCCIdx]     = useState(null)

  const imgRef      = useRef(null)
  const wrapRef     = useRef(null)
  const fileImgRef  = useRef(null)
  const fileZoomRef = useRef(null)
  const ccPickerRef = useRef(null)

  const images     = form.images      || []
  const colorCodes = form.color_codes || []

  // ── IMAGE SLOTS ──────────────────────────────────────────────

  function addSlot() {
    if (images.length >= 20) return
    update('images', [...images, null])
  }

  function openPicker(i) {
    setActiveSlot(i)
    fileImgRef.current.click()
  }

  function onImgSelected(e) {
    const file = e.target.files[0]
    if (!file || activeSlot === null) return
    const reader = new FileReader()
    reader.onload = ev => {
      const updated = [...images]
      while (updated.length <= activeSlot) updated.push(null)
      updated[activeSlot] = ev.target.result
      update('images', updated)
      e.target.value = ''
      setActiveSlot(null)
    }
    reader.readAsDataURL(file)
  }

  function removeImg(i) {
    const updated = [...images]
    updated[i] = null
    update('images', updated)
  }

  // ── COLOR CODES ──────────────────────────────────────────────

  function addCC() {
    update('color_codes', [...colorCodes, { color:'#888888', meaning:'' }])
  }

  function removeCC(i) {
    update('color_codes', colorCodes.filter((_, idx) => idx !== i))
  }

  function updateCC(i, field, value) {
    const updated = colorCodes.map((cc, idx) => idx === i ? { ...cc, [field]: value } : cc)
    update('color_codes', updated)
  }

  function openCCPicker(i) {
    setActiveCCIdx(i)
    ccPickerRef.current.value = colorCodes[i].color
    ccPickerRef.current.click()
  }

  function onCCPickerChange(e) {
    if (activeCCIdx === null) return
    updateCC(activeCCIdx, 'color', e.target.value)
  }

  // ── ZOOM ─────────────────────────────────────────────────────

  function onZoomFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setZoomSrc(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleZoomDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setZoomSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function onMouseMove(e) {
    if (!imgRef.current || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    const img = imgRef.current
    const scX = img.naturalWidth  / (img.offsetWidth  || 1)
    const scY = img.naturalHeight / (img.offsetHeight || 1)
    const imgX = x * scX
    const imgY = y * scY
    const pw = 240
    setPreviewStyle({
      position: 'absolute',
      transformOrigin: 'top left',
      imageRendering: 'crisp-edges',
      left:   -(imgX * zoomLevel - pw / 2) + 'px',
      top:    -(imgY * zoomLevel - pw / 2) + 'px',
      width:  img.naturalWidth  * zoomLevel + 'px',
      height: img.naturalHeight * zoomLevel + 'px',
    })
  }

  function onMouseLeave() {
    setMousePos(null)
    setPreviewStyle({})
  }

  // ── RENDER ───────────────────────────────────────────────────

  const slotCount = Math.max(images.length, 3)
  const slots = Array.from({ length: slotCount }, (_, i) => images[i] ?? null)

  return (
    <>
      {/* COLOR CODES */}
      <div className="panel">
        <div className="panel-title">
          <span>Códigos de Color</span>
          <button className="btn btn-outline btn-sm" onClick={addCC}>+ Color</button>
        </div>
        <p style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>
          Click en el círculo para cambiar el color
        </p>

        <input
          type="color"
          ref={ccPickerRef}
          style={{ position:'absolute', opacity:0, width:0, height:0 }}
          onChange={onCCPickerChange}
        />

        {colorCodes.map((cc, i) => (
          <div key={i} className="cc-row">
            <div
              onClick={() => openCCPicker(i)}
              style={{
                width:22, height:22, borderRadius:'50%',
                background: cc.color,
                border:'2px solid rgba(255,255,255,.12)',
                flexShrink:0, cursor:'pointer'
              }}
            />
            <input
              type="text"
              value={cc.color}
              style={{ width:90, fontFamily:'monospace', fontSize:11 }}
              onChange={e => updateCC(i, 'color', e.target.value)}
              placeholder="#000000"
            />
            <input
              type="text"
              value={cc.meaning}
              style={{ flex:1 }}
              onChange={e => updateCC(i, 'meaning', e.target.value)}
              placeholder="Significado del color..."
            />
            <button
              onClick={() => removeCC(i)}
              style={{
                background:'none', border:'none',
                color:'var(--text3)', cursor:'pointer',
                fontSize:15, padding:'2px 5px'
              }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* VISOR OJO */}
      <div className="panel">
        <div className="panel-title">
          <span>🔍 Visor de Análisis — Posición del Ojo (Reloj)</span>
          <span style={{
            background:'rgba(201,168,76,.1)', border:'1px solid var(--border2)',
            color:'var(--gold)', fontSize:10, padding:'2px 9px',
            borderRadius:10, letterSpacing:'.07em', textTransform:'uppercase'
          }}>Solo Profesional — No se incluye en PDF</span>
        </div>

        <div style={{ display:'flex', gap:16, marginBottom:14, flexWrap:'wrap', alignItems:'flex-start' }}>
          <div style={{ flexShrink:0 }}>
            <svg width="150" height="150" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(201,168,76,.3)" strokeWidth="1.5"/>
              <circle cx="80" cy="80" r="50" fill="none" stroke="rgba(201,168,76,.2)" strokeWidth="1"/>
              <circle cx="80" cy="80" r="28" fill="none" stroke="rgba(201,168,76,.15)" strokeWidth="1"/>
              <circle cx="80" cy="80" r="10" fill="rgba(0,0,0,.8)"/>
              <g stroke="rgba(201,168,76,.2)" strokeWidth="0.8">
                <line x1="80" y1="4"   x2="80"  y2="156"/>
                <line x1="4"  y1="80"  x2="156" y2="80"/>
                <line x1="22" y1="22"  x2="138" y2="138"/>
                <line x1="138" y1="22" x2="22"  y2="138"/>
                <line x1="51" y1="7"   x2="109" y2="153"/>
                <line x1="7"  y1="109" x2="153" y2="51"/>
                <line x1="109" y1="7"  x2="51"  y2="153"/>
                <line x1="153" y1="109" x2="7"  y2="51"/>
              </g>
              {CLOCK_POSITIONS.map(p => (
                <text
                  key={p.h}
                  x={p.x * 1.6}
                  y={p.y * 1.6}
                  fontFamily="DM Sans, sans-serif"
                  fontSize="9"
                  fontWeight="600"
                  fill="#c9a84c"
                  textAnchor="middle"
                  dominantBaseline="central"
                >{p.h}</text>
              ))}
            </svg>
            <p style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:4 }}>Referencia</p>
          </div>

          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
              Cargá la imagen del ojo. Pasá el mouse sobre la imagen para hacer zoom
              letra por letra. Los números del reloj se superponen para orientar el análisis.
            </p>
          </div>
        </div>

        <input
          type="file"
          ref={fileZoomRef}
          accept="image/*"
          style={{ display:'none' }}
          onChange={onZoomFileSelected}
        />

        {!zoomSrc && (
          <div
            onClick={() => fileZoomRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleZoomDrop}
            style={{
              border:'2px dashed var(--border2)', borderRadius:'var(--r)',
              padding:24, textAlign:'center', color:'var(--text3)', cursor:'pointer'
            }}
          >
            <div style={{ fontSize:32, marginBottom:8 }}>👁</div>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>Cargar imagen del ojo</div>
            <div style={{ fontSize:11 }}>Click o arrastrá aquí · Solo visible en pantalla</div>
          </div>
        )}

        {zoomSrc && (
          <div>
            <div
              ref={wrapRef}
              style={{
                position:'relative', background:'var(--dark)',
                borderRadius:'var(--r)', border:'1px solid var(--border)',
                overflow:'hidden', cursor:'crosshair'
              }}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            >
              <img
                ref={imgRef}
                src={zoomSrc}
                alt="Ojo para análisis"
                style={{ display:'block', width:'100%', height:'auto', userSelect:'none' }}
              />

              {CLOCK_POSITIONS.map(p => (
                <div
                  key={p.h}
                  style={{
                    position:'absolute',
                    left: p.x + '%',
                    top:  p.y + '%',
                    transform:'translate(-50%,-50%)',
                    background:'rgba(201,168,76,.85)',
                    color:'#111', fontSize:11, fontWeight:700,
                    padding:'2px 7px', borderRadius:3,
                    pointerEvents:'none', lineHeight:1.3
                  }}
                >{p.h}</div>
              ))}

              {mousePos && (
                <div style={{
                  position:'absolute',
                  left: mousePos.x - 45,
                  top:  mousePos.y - 45,
                  width:90, height:90,
                  border:'2px solid var(--gold)',
                  borderRadius:'50%',
                  pointerEvents:'none',
                  boxShadow:'0 0 0 1px rgba(0,0,0,.5)'
                }}/>
              )}

              {mousePos && (
                <div style={{
                  position:'absolute', bottom:12, right:12,
                  width:240, height:240,
                  border:'2px solid var(--gold)',
                  borderRadius:'var(--r)',
                  overflow:'hidden',
                  background:'var(--dark2)',
                  pointerEvents:'none'
                }}>
                  <img src={zoomSrc} alt="zoom" style={previewStyle} />
                </div>
              )}
            </div>

            <div style={{
              display:'flex', gap:8, alignItems:'center', marginTop:8,
              padding:'6px 10px', background:'var(--dark2)',
              borderRadius:'var(--r)', border:'1px solid var(--border)'
            }}>
              <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>Zoom:</span>
              <input
                type="range" min="2" max="12"
                value={zoomLevel}
                onChange={e => setZoomLevel(+e.target.value)}
                style={{ flex:1 }}
              />
              <span style={{ fontSize:12, color:'var(--gold)', minWidth:28 }}>{zoomLevel}x</span>
              <button className="btn btn-outline btn-sm" onClick={() => setZoomSrc(null)}>✕ Quitar</button>
            </div>
          </div>
        )}
      </div>

      {/* IMÁGENES DEL ANÁLISIS */}
      <div className="panel">
        <div className="panel-title">
          <span>Imágenes del Análisis</span>
          <span style={{ fontSize:11, color:'var(--text3)' }}>{slots.length} de 20</span>
        </div>

        <input
          type="file"
          ref={fileImgRef}
          accept="image/*"
          style={{ display:'none' }}
          onChange={onImgSelected}
        />

        <div className="img-grid">
          {slots.map((src, i) => (
            <div
              key={i}
              className={`img-slot${src ? ' has-img' : ''}`}
              onClick={() => { if (!src) openPicker(i) }}
            >
              <div style={{
                position:'absolute', top:7, left:7,
                background:'var(--dark)', color:'var(--gold)',
                fontSize:11, fontWeight:500, padding:'2px 7px',
                borderRadius:3, border:'1px solid var(--border)', zIndex:2
              }}>{i + 1}</div>

              {src && (
                <button
                  onClick={e => { e.stopPropagation(); removeImg(i) }}
                  style={{
                    position:'absolute', top:7, right:7,
                    background:'var(--danger)', color:'#fff',
                    border:'none', borderRadius:'50%',
                    width:20, height:20, fontSize:13,
                    cursor:'pointer', zIndex:2,
                    display:'flex', alignItems:'center',
                    justifyContent:'center', lineHeight:1
                  }}
                >✕</button>
              )}

              {src
                ? <img
                    src={src}
                    alt={`Imagen ${i + 1}`}
                    style={{
                      width:'100%', height:'100%',
                      objectFit:'cover',
                      position:'absolute', top:0, left:0
                    }}
                  />
                : <>
                    <div style={{ fontSize:20, color:'var(--text3)', marginBottom:5 }}>🖼</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Click para cargar</div>
                  </>
              }
            </div>
          ))}

          {slots.length < 20 && (
            <button
              onClick={addSlot}
              style={{
                background:'var(--surface)', border:'2px dashed var(--border)',
                borderRadius:'var(--r2)', color:'var(--gold)', fontSize:22,
                cursor:'pointer', aspectRatio:'3/4',
                display:'flex', alignItems:'center', justifyContent:'center',
                width:'100%', transition:'all .2s'
              }}
            >+</button>
          )}
        </div>
      </div>

      {/* OBSERVACIONES IMÁGENES */}
      <div className="panel">
        <div className="panel-title">Observaciones sobre las imágenes</div>
        <textarea
          rows={3}
          value={form.obs_img || ''}
          onChange={e => update('obs_img', e.target.value)}
          placeholder="Notas sobre las imágenes analizadas..."
        />
      </div>
    </>
  )
}