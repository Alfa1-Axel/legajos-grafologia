import { useRef, useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

const CLOCK_POSITIONS = [
  { h:12, x:50,  y:4    },
  { h:1,  x:72,  y:9.5  },
  { h:2,  x:90,  y:27   },
  { h:3,  x:96,  y:50   },
  { h:4,  x:90,  y:73   },
  { h:5,  x:72,  y:90.5 },
  { h:6,  x:50,  y:96   },
  { h:7,  x:28,  y:90.5 },
  { h:8,  x:10,  y:73   },
  { h:9,  x:4,   y:50   },
  { h:10, x:10,  y:27   },
  { h:11, x:28,  y:9.5  },
]

const EYE_SIZE     = 400
const TOOLTIP_SIZE = 220   // un poco más grande para mejor detalle

export default function ImagenesOjo({ form, update }) {
  const [activeSlot, setActiveSlot]   = useState(null)
  const [zoomLevel, setZoomLevel]     = useState(5)
  const [zoomSrc, setZoomSrc]         = useState(null)
  const [colorCodes, setColorCodes]   = useState([])
  const [loadingCC, setLoadingCC]     = useState(true)
  const [savingCC, setSavingCC]       = useState(false)

  const [imgOffset, setImgOffset]     = useState({ x: 0, y: 0 })
  const [imgScale, setImgScale]       = useState(1)
  const [isDragging, setIsDragging]   = useState(false)
  const dragStart                     = useRef(null)
  const offsetRef                     = useRef({ x: 0, y: 0 })

  const [imgNatural, setImgNatural]   = useState({ w: 0, h: 0 })
  const [cursorPos, setCursorPos]     = useState(null)
  const [tooltipPos, setTooltipPos]   = useState({ left: 0, top: 0 })

  const wrapRef      = useRef(null)
  const imgRef       = useRef(null)
  const canvasRef    = useRef(null)   // canvas del tooltip
  const bitmapRef    = useRef(null)   // ImageBitmap de alta calidad
  const fileImgRef   = useRef(null)
  const fileZoomRef  = useRef(null)
  const ccPickerRef  = useRef(null)
  const activeCCIdx  = useRef(null)

  // Refs para leer en callbacks sin stale closures
  const imgOffsetRef  = useRef({ x: 0, y: 0 })
  const imgScaleRef   = useRef(1)
  const imgNaturalRef = useRef({ w: 0, h: 0 })
  const zoomLevelRef  = useRef(5)
  const cursorPosRef  = useRef(null)

  useEffect(() => { imgOffsetRef.current  = imgOffset  }, [imgOffset])
  useEffect(() => { imgScaleRef.current   = imgScale   }, [imgScale])
  useEffect(() => { imgNaturalRef.current = imgNatural }, [imgNatural])
  useEffect(() => { zoomLevelRef.current  = zoomLevel  }, [zoomLevel])

  const images = form.images || []

  // ── COLORES SUPABASE ─────────────────────────────────────────
  const fetchColorCodes = useRef(async () => {
    setLoadingCC(true)
    const { data } = await supabase.from('color_codes').select('*').order('orden')
    setColorCodes(data || [])
    setLoadingCC(false)
  })
  useEffect(() => { fetchColorCodes.current() }, [])

  async function addCC() {
    const maxOrden = colorCodes.length ? Math.max(...colorCodes.map(c => c.orden)) : 0
    const { data } = await supabase
      .from('color_codes')
      .insert({ color: '#888888', meaning: '', orden: maxOrden + 1 })
      .select().single()
    if (data) setColorCodes(prev => [...prev, data])
  }
  async function removeCC(id) {
    await supabase.from('color_codes').delete().eq('id', id)
    setColorCodes(prev => prev.filter(c => c.id !== id))
  }
  function updateCC(id, field, value) {
    setColorCodes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }
  async function saveCC(id, field, value) {
    setSavingCC(true)
    await supabase.from('color_codes').update({ [field]: value }).eq('id', id)
    setSavingCC(false)
  }
  function openCCPicker(id, currentColor) {
    activeCCIdx.current = id
    ccPickerRef.current.value = currentColor
    ccPickerRef.current.click()
  }
  function onCCPickerChange(e) {
    const id = activeCCIdx.current
    if (!id) return
    updateCC(id, 'color', e.target.value)
    saveCC(id, 'color', e.target.value)
  }

  // ── IMAGE SLOTS ──────────────────────────────────────────────
  function addSlot() {
    if (images.length >= 20) return
    update('images', [...images, null])
  }
  function openPicker(i) { setActiveSlot(i); fileImgRef.current.click() }
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

  // ── ZOOM FILE ────────────────────────────────────────────────
  function loadFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setZoomSrc(ev.target.result)
      setImgOffset({ x: 0, y: 0 })
      setImgScale(1)
      setImgNatural({ w: 0, h: 0 })
      bitmapRef.current = null
    }
    reader.readAsDataURL(file)
  }
  function onZoomFileSelected(e) { loadFile(e.target.files[0]); e.target.value = '' }
  function handleZoomDrop(e) { e.preventDefault(); loadFile(e.dataTransfer.files[0]) }

  // Cuando la imagen carga: guardamos dimensiones y creamos ImageBitmap
  function onImgLoad() {
    if (!imgRef.current) return
    const nat = { w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight }
    setImgNatural(nat)
    imgNaturalRef.current = nat
    // createImageBitmap da acceso a los píxeles originales sin degradación
    createImageBitmap(imgRef.current).then(bm => { bitmapRef.current = bm })
  }

  // ── MATEMÁTICAS DE RENDERIZADO ────────────────────────────────
  // La imagen en el ojo se posiciona explícitamente (sin objectFit):
  //   coverScale = max(EYE_SIZE/natW, EYE_SIZE/natH)
  //   baseW = natW * coverScale    baseH = natH * coverScale
  //   top  = EYE_SIZE/2 - baseH/2 + offset.y
  //   left = EYE_SIZE/2 - baseW/2 + offset.x
  //   transform: scale(imgScale) desde el centro

  function getCoverScale(nat) {
    if (!nat.w || !nat.h) return 1
    return Math.max(EYE_SIZE / nat.w, EYE_SIZE / nat.h)
  }

  function getImgStyle(nat, offset, scale, dragging) {
    const cs    = getCoverScale(nat)
    const baseW = nat.w * cs
    const baseH = nat.h * cs
    return {
      position: 'absolute',
      width:    baseW,
      height:   baseH,
      top:      EYE_SIZE / 2 - baseH / 2 + offset.y,
      left:     EYE_SIZE / 2 - baseW / 2 + offset.x,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      pointerEvents: 'none',
      transition: dragging ? 'none' : 'transform .1s',
    }
  }

  // Dibuja el recorte en el canvas del tooltip usando drawImage (interpolación bicúbica del browser)
  function drawTooltipCanvas(cx, cy) {
    const canvas  = canvasRef.current
    const bitmap  = bitmapRef.current
    if (!canvas || !bitmap) return

    const nat    = imgNaturalRef.current
    const offset = imgOffsetRef.current
    const scale  = imgScaleRef.current
    const zoom   = zoomLevelRef.current
    if (!nat.w || !nat.h) return

    const cs      = Math.max(EYE_SIZE / nat.w, EYE_SIZE / nat.h)
    const baseW   = nat.w * cs
    const baseH   = nat.h * cs
    const imgLeft = EYE_SIZE / 2 - baseW / 2 + offset.x
    const imgTop  = EYE_SIZE / 2 - baseH / 2 + offset.y

    // Coordenada en píxeles naturales bajo el cursor
    const bx   = cx - imgLeft - baseW / 2
    const by   = cy - imgTop  - baseH / 2
    const natX = bx / (scale * cs) + nat.w / 2
    const natY = by / (scale * cs) + nat.h / 2

    // El canvas tiene resolución 2× para pantallas HiDPI
    const dpr  = window.devicePixelRatio || 1
    const size = TOOLTIP_SIZE * dpr
    canvas.width  = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Región de la imagen original que queremos mostrar
    // (TOOLTIP_SIZE píxeles CSS / zoom == cuántos píxeles naturales caben)
    const regionW = TOOLTIP_SIZE / (cs * zoom)
    const regionH = TOOLTIP_SIZE / (cs * zoom)
    const srcX    = natX - regionW / 2
    const srcY    = natY - regionH / 2

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(
      bitmap,
      srcX, srcY, regionW, regionH,   // fuente: región de píxeles naturales
      0, 0, size, size,               // destino: todo el canvas
    )
  }

  // ── ARRASTRE ─────────────────────────────────────────────────
  function onMouseDown(e) {
    if (!zoomSrc) return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetRef.current = { ...imgOffsetRef.current }
  }

  const onMouseMove = useCallback((e) => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const cx   = e.clientX - rect.left
    const cy   = e.clientY - rect.top

    if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setImgOffset({ x: offsetRef.current.x + dx, y: offsetRef.current.y + dy })
    }

    if (zoomSrc) {
      const absX = rect.left + cx
      const absY = rect.top  + cy
      setTooltipPos({
        left: absX + TOOLTIP_SIZE + 20 < window.innerWidth ? absX + 20 : absX - TOOLTIP_SIZE - 20,
        top:  Math.max(10, absY - TOOLTIP_SIZE - 20),
      })
      setCursorPos({ x: cx, y: cy })
      cursorPosRef.current = { x: cx, y: cy }
      drawTooltipCanvas(cx, cy)
    }
  }, [zoomSrc])  // eslint-disable-line react-hooks/exhaustive-deps

  // Redibuja el canvas cuando cambia el zoom (sin mover el mouse)
  useEffect(() => {
    if (cursorPosRef.current) {
      drawTooltipCanvas(cursorPosRef.current.x, cursorPosRef.current.y)
    }
  }, [zoomLevel, imgOffset, imgScale])  // eslint-disable-line react-hooks/exhaustive-deps

  function onMouseUp() { setIsDragging(false); dragStart.current = null }
  function onMouseLeave() {
    setCursorPos(null)
    cursorPosRef.current = null
    if (isDragging) { setIsDragging(false); dragStart.current = null }
  }
  function onWheel(e) {
    if (!zoomSrc) return
    e.preventDefault()
    setImgScale(prev => Math.max(0.5, Math.min(5, prev - e.deltaY * 0.002)))
  }

  const slotCount = Math.max(images.length, 3)
  const slots     = Array.from({ length: slotCount }, (_, i) => images[i] ?? null)
  const imgStyle  = zoomSrc && imgNatural.w
    ? getImgStyle(imgNatural, imgOffset, imgScale, isDragging)
    : null

  return (
    <>
      {/* COLOR CODES */}
      <div className="panel">
        <div className="panel-title">
          <span>Códigos de Color {savingCC && <span style={{ fontSize:10, color:'var(--text3)' }}>· guardando...</span>}</span>
          <button className="btn btn-outline btn-sm" onClick={addCC}>+ Color</button>
        </div>
        <p style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>
          Los cambios se guardan automáticamente y aplican a todos los legajos
        </p>
        <input type="color" ref={ccPickerRef}
          style={{ position:'absolute', opacity:0, width:0, height:0 }}
          onChange={onCCPickerChange}
        />
        {loadingCC && <p style={{ color:'var(--text3)', fontSize:12 }}>Cargando colores...</p>}
        {!loadingCC && colorCodes.map(cc => (
          <div key={cc.id} className="cc-row">
            <div onClick={() => openCCPicker(cc.id, cc.color)}
              style={{ width:22, height:22, borderRadius:'50%', background:cc.color, border:'2px solid rgba(255,255,255,.12)', flexShrink:0, cursor:'pointer' }}
            />
            <input type="text" value={cc.color}
              style={{ width:90, fontFamily:'monospace', fontSize:11 }}
              onChange={e => updateCC(cc.id, 'color', e.target.value)}
              onBlur={e => saveCC(cc.id, 'color', e.target.value)}
              placeholder="#000000"
            />
            <input type="text" value={cc.meaning}
              style={{ flex:1 }}
              onChange={e => updateCC(cc.id, 'meaning', e.target.value)}
              onBlur={e => saveCC(cc.id, 'meaning', e.target.value)}
              placeholder="Significado del color..."
            />
            <button onClick={() => removeCC(cc.id)}
              style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:15, padding:'2px 5px' }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* VISOR OJO */}
      <div className="panel">
        <div className="panel-title">
          <span>🔍 Visor de Análisis — Posición del Ojo (Reloj)</span>
          <span style={{ background:'rgba(201,168,76,.1)', border:'1px solid var(--border2)', color:'var(--gold)', fontSize:10, padding:'2px 9px', borderRadius:10, letterSpacing:'.07em', textTransform:'uppercase' }}>
            Solo Profesional — No se incluye en PDF
          </span>
        </div>

        <input type="file" ref={fileZoomRef} accept="image/*" style={{ display:'none' }} onChange={onZoomFileSelected} />

        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
          <button className="btn btn-outline btn-sm" onClick={() => fileZoomRef.current.click()}>
            {zoomSrc ? '↺ Cambiar imagen' : '👁 Cargar imagen'}
          </button>
          {zoomSrc && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:160 }}>
                <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>Zoom lupa:</span>
                <input type="range" min="2" max="14" value={zoomLevel}
                  onChange={e => setZoomLevel(+e.target.value)} style={{ flex:1 }} />
                <span style={{ fontSize:12, color:'var(--gold)', minWidth:28 }}>{zoomLevel}x</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:160 }}>
                <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>Escala img:</span>
                <input type="range" min="0.5" max="5" step="0.05" value={imgScale}
                  onChange={e => setImgScale(+e.target.value)} style={{ flex:1 }} />
                <span style={{ fontSize:12, color:'var(--gold)', minWidth:38 }}>{imgScale.toFixed(1)}x</span>
              </div>
              <button className="btn btn-outline btn-sm"
                onClick={() => { setImgOffset({ x:0, y:0 }); setImgScale(1) }}>↺ Reset</button>
              <button className="btn btn-outline btn-sm"
                onClick={() => { setZoomSrc(null); setImgOffset({ x:0, y:0 }); setImgScale(1); setImgNatural({ w:0, h:0 }); bitmapRef.current = null }}>✕ Quitar</button>
            </>
          )}
        </div>

        {/* OJO */}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div
            ref={wrapRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
            onDragOver={e => e.preventDefault()}
            onDrop={handleZoomDrop}
            onClick={() => !zoomSrc && fileZoomRef.current.click()}
            style={{
              position: 'relative',
              width: EYE_SIZE, height: EYE_SIZE,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--border2)',
              background: 'var(--dark)',
              cursor: zoomSrc ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {zoomSrc && imgStyle && (
              <img ref={imgRef} src={zoomSrc} alt="Fondo ojo"
                draggable={false} onLoad={onImgLoad} style={imgStyle} />
            )}
            {zoomSrc && !imgStyle && (
              <img ref={imgRef} src={zoomSrc} alt="" draggable={false}
                onLoad={onImgLoad}
                style={{ position:'absolute', opacity:0, pointerEvents:'none' }} />
            )}

            {!zoomSrc && (
              <div style={{
                position:'absolute', inset:0,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                color:'var(--text3)', gap:8, pointerEvents:'none',
              }}>
                <div style={{ fontSize:36 }}>👁</div>
                <div style={{ fontSize:13 }}>Click o arrastrá la imagen aquí</div>
                <div style={{ fontSize:11 }}>Después podés moverla y hacer zoom</div>
              </div>
            )}

            <svg viewBox="0 0 100 100" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(201,168,76,.4)"  strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(201,168,76,.25)" strokeWidth="0.3"/>
              <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(201,168,76,.2)"  strokeWidth="0.3"/>
              <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(201,168,76,.15)" strokeWidth="0.3"/>
              <circle cx="50" cy="50" r="5"  fill="rgba(0,0,0,.6)" stroke="rgba(201,168,76,.4)" strokeWidth="0.4"/>
              <g stroke="rgba(201,168,76,.3)" strokeWidth="0.3">
                <line x1="50" y1="1"  x2="50"  y2="99"/>
                <line x1="1"  y1="50" x2="99"  y2="50"/>
                <line x1="8"  y1="8"  x2="92"  y2="92"/>
                <line x1="92" y1="8"  x2="8"   y2="92"/>
                <line x1="29" y1="2"  x2="71"  y2="98"/>
                <line x1="2"  y1="71" x2="98"  y2="29"/>
                <line x1="71" y1="2"  x2="29"  y2="98"/>
                <line x1="98" y1="71" x2="2"   y2="29"/>
              </g>
              {CLOCK_POSITIONS.map(p => (
                <text key={p.h} x={p.x} y={p.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="5.5" fontWeight="700" fontFamily="DM Sans, sans-serif"
                  fill="rgba(201,168,76,.95)">{p.h}</text>
              ))}
            </svg>

            {cursorPos && zoomSrc && (
              <div style={{
                position:'absolute',
                left: cursorPos.x - 35, top: cursorPos.y - 35,
                width:70, height:70,
                border:'1.5px solid var(--gold)',
                borderRadius:'50%',
                pointerEvents:'none',
                boxShadow:'0 0 0 1px rgba(0,0,0,.5)',
              }}/>
            )}
          </div>
        </div>

        {/* TOOLTIP — canvas en lugar de <img> escalada */}
        {cursorPos && zoomSrc && (
          <div style={{
            position:'fixed',
            left: tooltipPos.left,
            top:  tooltipPos.top,
            width: TOOLTIP_SIZE, height: TOOLTIP_SIZE,
            border:'2px solid var(--gold)',
            borderRadius:'var(--r)',
            overflow:'hidden',
            background:'var(--dark2)',
            pointerEvents:'none',
            zIndex:9999,
            boxShadow:'0 8px 32px rgba(0,0,0,.6)',
          }}>
            <canvas
              ref={canvasRef}
              style={{ width: TOOLTIP_SIZE, height: TOOLTIP_SIZE, display:'block' }}
            />
            <div style={{
              position:'absolute', bottom:4, right:6,
              background:'rgba(201,168,76,.85)',
              color:'#111', fontSize:10, fontWeight:700,
              padding:'1px 6px', borderRadius:3,
            }}>{zoomLevel}x</div>
          </div>
        )}

        {zoomSrc && (
          <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:10 }}>
            🖱 Arrastrá para mover · Rueda del mouse para escalar · Lupa aparece sobre el cursor
          </p>
        )}
      </div>

      {/* IMÁGENES DEL ANÁLISIS */}
      <div className="panel">
        <div className="panel-title">
          <span>Imágenes del Análisis</span>
          <span style={{ fontSize:11, color:'var(--text3)' }}>{slots.length} de 20</span>
        </div>
        <input type="file" ref={fileImgRef} accept="image/*" style={{ display:'none' }} onChange={onImgSelected} />
        <div className="img-grid">
          {slots.map((src, i) => (
            <div key={i} className={`img-slot${src ? ' has-img' : ''}`}
              onClick={() => { if (!src) openPicker(i) }}>
              <div style={{ position:'absolute', top:7, left:7, background:'var(--dark)', color:'var(--gold)', fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:3, border:'1px solid var(--border)', zIndex:2 }}>
                {i + 1}
              </div>
              {src && (
                <button onClick={e => { e.stopPropagation(); removeImg(i) }}
                  style={{ position:'absolute', top:7, right:7, background:'var(--danger)', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, fontSize:13, cursor:'pointer', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}
                >✕</button>
              )}
              {src
                ? <img src={src} alt={`Imagen ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', top:0, left:0 }} />
                : <>
                    <div style={{ fontSize:20, color:'var(--text3)', marginBottom:5 }}>🖼</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Click para cargar</div>
                  </>
              }
            </div>
          ))}
          {slots.length < 20 && (
            <button onClick={addSlot}
              style={{ background:'var(--surface)', border:'2px dashed var(--border)', borderRadius:'var(--r2)', color:'var(--gold)', fontSize:22, cursor:'pointer', aspectRatio:'3/4', display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}
            >+</button>
          )}
        </div>
      </div>

      {/* OBSERVACIONES */}
      <div className="panel">
        <div className="panel-title">Observaciones sobre las imágenes</div>
        <textarea rows={3}
          value={form.obs_img || ''}
          onChange={e => update('obs_img', e.target.value)}
          placeholder="Notas sobre las imágenes analizadas..."
        />
      </div>
    </>
  )
}