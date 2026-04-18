import { jsPDF } from 'jspdf'

function padId(n) { return String(n).padStart(3, '0') }

export async function generarPDF(num, data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, mL = 18, mR = 18, cW = W - mL - mR
  let y = 0

  const GOLD    = [160, 110, 30]
  const DARK    = [30,  30,  30]
  const SURFACE = [245, 243, 238]
  const TEXT    = [40,  40,  40]
  const MUTED   = [110, 100, 85]
  const WHITE   = [255, 255, 255]

  function newPage() {
    doc.addPage()
    y = 22
    pageHeader()
  }

  function pageHeader() {
    doc.setFillColor(...DARK)
    doc.rect(0, 0, W, 16, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, 16, W, 0.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...GOLD)
    doc.text('ESTUDIO GRAFOLÓGICO — Legajo N° ' + padId(num), mL, 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text('Confidencial', W - mR, 10, { align: 'right' })
  }

  function chk(n) { if (y + n > 272) newPage() }

  function sTitle(t) {
    chk(14)
    doc.setFillColor(...GOLD)
    doc.rect(mL, y, 3, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...GOLD)
    doc.text(t, mL + 6, y + 4.5)
    y += 9
    doc.setFillColor(...GOLD)
    doc.rect(mL, y, cW, 0.3, 'F')
    y += 5
  }

  function block(label, value) {
    if (!value) return
    chk(16)
    if (label) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...DARK)
      doc.text(label, mL, y)
      y += 5
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(String(value), cW)
    lines.forEach(l => { chk(5); doc.text(l, mL, y); y += 4.5 })
    y += 4
  }

  function row2col(fields) {
    const validFields = fields.filter(([, v]) => v || v === false)
    if (!validFields.length) return
    const rows = Math.ceil(validFields.length / 2)
    chk(rows * 11 + 10)
    doc.setFillColor(...SURFACE)
    doc.roundedRect(mL, y - 2, cW, rows * 11 + 6, 3, 3, 'F')
    validFields.forEach(([label, value], i) => {
      const col = i % 2
      const cx  = mL + 4 + col * (cW / 2)
      const ry  = y + 4 + Math.floor(i / 2) * 11
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...MUTED)
      doc.text(label + ':', cx, ry)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...DARK)
      const val = doc.splitTextToSize(String(value), cW / 2 - 6)
      doc.text(val[0] || '', cx, ry + 4.5)
    })
    y += rows * 11 + 8
  }

  function pageFooter() {
    chk(22)
    doc.setFillColor(...GOLD)
    doc.rect(mL, y + 6, cW, 0.3, 'F')
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GOLD)
    doc.text('Grafologa Marcela Zapata',      mL,     y)
    doc.text('Grafologa Magdalena Martínez',  W / 2,  y, { align: 'center' })
    doc.text('Grafologo Leonardo Lembo',      W - mR, y, { align: 'right' })
    y += 5
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text('Documento generado el ' + new Date().toLocaleDateString('es-AR'), mL, y)
  }

  // ── TAPA ────────────────────────────────────────────────────
  doc.setFillColor(...WHITE)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 0, 5, 297, 'F')
  doc.setFillColor(...DARK)
  doc.rect(5, 60,  W - 5, 0.5, 'F')
  doc.rect(5, 120, W - 5, 0.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(38)
  doc.setTextColor(...DARK)
  doc.text('LEGAJO', 22, 88)
  doc.setFontSize(54)
  doc.setTextColor(...GOLD)
  doc.text(padId(num), 22, 110)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...MUTED)
  doc.text('Estudio Grafológico — Análisis de Escritura', 22, 130)

  const fechaStr = data.fecha_escritura
    ? new Date(data.fecha_escritura + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : ''

  if (fechaStr) {
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('Fecha de muestra: ' + fechaStr, 22, 140)
  }

  doc.setFontSize(8.5)
  doc.setTextColor(...GOLD)
  doc.text('Grafologa Marcela Zapata',     22, 268)
  doc.text('Grafologa Magdalena Martínez', 22, 274)
  doc.text('Grafologo Leonardo Lembo',     22, 280)
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text('Documento confidencial — Identidad protegida bajo código ID', 22, 288)

  // ── FICHA ────────────────────────────────────────────────────
  newPage()
  sTitle('Ficha de Recolección de Muestras Grafológicas')
  sTitle('1. Perfil Biográfico y Clínico')
  row2col([
    ['Edad',           data.edad],
    ['Sexo Biológico', data.sexo],
    ['Escolaridad',    data.escolaridad],
    ['Lateralidad',    data.lateralidad],
    ['Diagnóstico',    data.diagnostico],
    ['Fase / Estadio', data.fase],
    ['Medicamentos',   data.medicamentos],
    ['Detalle',        data.medicamentos_detalle],
  ])
  sTitle('2. Condiciones de la Toma de Muestra')
  row2col([
    ['Fecha',       fechaStr],
    ['Hora',        data.hora],
    ['Lugar',       data.lugar],
    ['Instrumento', data.instrumento],
    ['Tipo papel',  data.papel],
  ])
  sTitle('3. Clasificación de la Muestra Gráfica')
  row2col([
    ['Tipo de escrito', data.tipo_escrito],
    ['Estado anímico',  data.animo],
    ['Limitaciones',    data.limitaciones],
  ])
  if (data.analisis_correspondencia) {
    sTitle('4. Análisis de Correspondencia')
    block('', data.analisis_correspondencia)
  }

  // ── CONSENTIMIENTO ───────────────────────────────────────────
  newPage()
  sTitle('Consentimiento Informado')
  row2col([
    ['ID Legajo',     'Legajo #' + padId(num)],
    ['Fecha',         data.c_fecha ? new Date(data.c_fecha + 'T12:00:00').toLocaleDateString('es-AR') : ''],
    ['Autoriza a',    data.c_autoriza],
    ['Análisis a',    data.c_analiza],
    ['Edad firmante', data.c_edad],
    ['Sexo firmante', data.c_sexo],
    ['DNI',           data.c_dni],
    ['Fecha muestra', data.c_fecha_muestra ? new Date(data.c_fecha_muestra + 'T12:00:00').toLocaleDateString('es-AR') : ''],
    ['Aclaración',    data.c_aclaracion],
    ['Ref. firma',    data.c_firma_desc],
  ])
  chk(36)
  doc.setFillColor(...SURFACE)
  doc.roundedRect(mL, y, cW, 32, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...DARK)
  doc.text('Consentimiento Específico para Grafología', mL + 4, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT)
  const cLines = doc.splitTextToSize(
    'AUTORIZO que mi escritura y los datos clínicos asociados sean utilizados exclusivamente con fines de estudio e investigación. Mi identidad permanecerá bajo código ID para garantizar el anonimato.',
    cW - 8
  )
  cLines.forEach((l, i) => doc.text(l, mL + 4, y + 13 + i * 4.5))
  y += 36
  block('Firma paciente / tutor', data.c_firma_paciente)
  block('Consentimiento aceptado', data.c_acepta ? '✓ Sí' : 'No')

  // ── COLORES ──────────────────────────────────────────────────
  const codes = data.color_codes || []
  if (codes.length) {
    newPage()
    sTitle('Códigos de Color Utilizados')
    codes.forEach(cc => {
      chk(9)
      const hex = cc.color || '#888888'
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      doc.setFillColor(r, g, b)
      doc.circle(mL + 3.5, y - 1.5, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(r, g, b)
      doc.text(hex.toUpperCase(), mL + 10, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(' = ' + cc.meaning, mL + 10 + doc.getTextWidth(hex.toUpperCase()), y)
      y += 7
    })
  }

  // ── IMÁGENES ─────────────────────────────────────────────────
  const imgs = (data.images || []).filter(Boolean)
  if (imgs.length) {
    newPage()
    sTitle('Imágenes del Análisis')

    const iW = (cW - 8) / 3
    const iH = iW * 1.35
    const gap = 4

    const filas = []
    for (let i = 0; i < imgs.length; i += 3) {
      filas.push(imgs.slice(i, i + 3))
    }

    for (const fila of filas) {
      if (y + iH + 8 > 272) {
        newPage()
        sTitle('Imágenes del Análisis (continuación)')
      }

      const filaY = y

      fila.forEach((src, col) => {
        const ix = mL + col * (iW + gap)
        try {
          doc.addImage(src, 'JPEG', ix, filaY, iW, iH, undefined, 'FAST')
        } catch {
          // imagen inválida, se saltea
        }
        doc.setFillColor(...DARK)
        doc.rect(ix, filaY + iH - 5, iW, 5, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...GOLD)
        const imgNum = imgs.indexOf(src) + 1
        doc.text('Img ' + imgNum, ix + 2, filaY + iH - 1)
      })

      y = filaY + iH + 6
    }

    y += 4

    if (data.obs_img) {
      chk(16)
      sTitle('Observaciones de Imágenes')
      block('', data.obs_img)
    }
  }

  // ── OBSERVACIONES ────────────────────────────────────────────
  newPage()
  sTitle('Observaciones Completas del Estudio')
  block('Análisis General',                       data.obs_general)
  block('Características de la Escritura',        data.obs_escritura)
  block('Aspectos Psicológicos / Clínicos',       data.obs_psico)
  block('Correspondencia con Diagnóstico Médico', data.obs_corr)
  block('Conclusiones y Recomendaciones',         data.obs_concl)

  pageFooter()

  // ── DESCARGA FORZADA ─────────────────────────────────────────
  const blob = doc.output('blob')
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'Legajo_' + padId(num) + '.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}