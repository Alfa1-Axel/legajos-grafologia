import { jsPDF } from 'jspdf'

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

const PERFIL_TEXTOS = {
  A: 'PERFIL PREDOMINANTE: El sujeto presenta una tendencia constructiva y de liderazgo marcada.',
  B: 'PERFIL EQUILIBRADO - EMPÁTICO: El sujeto presenta equilibrio emocional y alta capacidad empática.',
  C: 'PERFIL INHIBIDO - CAUTELOSO: El sujeto presenta tendencia a la inhibición y prudencia excesiva.',
  D: 'PERFIL PRAGMÁTICO - PROFESIONAL: El sujeto presenta orientación práctica con tendencia pragmática.'
}

const DINAMICA_TEXTOS = {
  evasion: 'Dinámica de Evasión (+/=): El sujeto utiliza su carisma para compensar una falta de principios morales o de arraigo afectivo. Capacidad para "jugar a dos caras".',
  compensacion: 'Dinámica de Compensación (+/x): Ante la falta de energía vital o acción real, el sujeto se refugia en sueños de potencia e idealismo poético para evadir la frustración.'
}

async function loadImageBase64(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generarPDFGrafo(evaluacion, datos) {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W=210, mL=18, mR=18, cW=W-mL-mR
  let y=0

  const GOLD=[160,110,30], DARK=[30,30,30], SURF=[245,243,238]
  const TEXT=[40,40,40], MUTED=[110,100,85], WHITE=[255,255,255]

  function newPage(){ doc.addPage(); y=22; hdr() }

  function hdr(){
    doc.setFillColor(...DARK); doc.rect(0,0,W,16,'F')
    doc.setFillColor(...GOLD); doc.rect(0,16,W,.4,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5)
    doc.setTextColor(...GOLD)
    doc.text('GRAFOGÉNESIS® — Informe de Evaluación', mL, 10)
    doc.setFont('helvetica','normal'); doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text('Confidencial', W-mR, 10, {align:'right'})
  }

  function chk(n){ if(y+n>272) newPage() }

  function stitle(t){
    chk(14)
    doc.setFillColor(...GOLD); doc.rect(mL,y,3,6,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(10)
    doc.setTextColor(...GOLD); doc.text(t, mL+6, y+4.5)
    y+=9; doc.setFillColor(...GOLD); doc.rect(mL,y,cW,.25,'F'); y+=5
  }

  function block(label, value){
    if(!value) return
    chk(14)
    if(label){
      doc.setFont('helvetica','bold'); doc.setFontSize(8)
      doc.setTextColor(...DARK); doc.text(label, mL, y); y+=5
    }
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(String(value), cW)
    lines.forEach(l=>{ chk(5); doc.text(l,mL,y); y+=4.5 })
    y+=4
  }

  function row2col(fields){
    const valid = fields.filter(([,v])=>v)
    if(!valid.length) return
    const rows = Math.ceil(valid.length/2)
    chk(rows*11+10)
    doc.setFillColor(...SURF); doc.roundedRect(mL,y-2,cW,rows*11+6,3,3,'F')
    valid.forEach(([label,value],i)=>{
      const col=i%2, cx=mL+4+col*(cW/2), ry=y+4+Math.floor(i/2)*11
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...MUTED)
      doc.text(label+':', cx, ry)
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...DARK)
      const val = doc.splitTextToSize(String(value), cW/2-6)
      doc.text(val[0]||'', cx, ry+4.5)
    })
    y+=rows*11+8
  }

  const r = evaluacion.resultados||{}
  const fecha = evaluacion.created_at
    ? new Date(evaluacion.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})
    : ''

  let tA=0,tB=0,tC=0,tD=0
  DIMENSIONES.forEach(dim=>{
    const d=r[dim.id]; if(!d) return
    tA+=d.valores?.A||0; tB+=d.valores?.B||0
    tC+=d.valores?.C||0; tD+=d.valores?.D||0
  })
  const tTotal=tA+tB+tC+tD||1
  const pct=v=>((v/tTotal)*100).toFixed(2)+'%'

  // Cargar logo
  const logoB64 = await loadImageBase64('https://i.imgur.com/ukSxvlb.png')

  // ── TAPA ────────────────────────────────────────────────────
  doc.setFillColor(...WHITE); doc.rect(0,0,W,297,'F')
  doc.setFillColor(...GOLD); doc.rect(0,0,5,297,'F')
  doc.setFillColor(...DARK)
  doc.rect(5,75,W-5,.5,'F')
  doc.rect(5,145,W-5,.5,'F')

  // Logo centrado
  if(logoB64){
    try{ doc.addImage(logoB64,'PNG',W/2-20,18,40,40) } catch {
  // Ignorar error si falla la carga de imagen - el PDF se generará sin logo
}
  // Título — debajo del logo con espacio
  doc.setFont('helvetica','bold'); doc.setFontSize(28)
  doc.setTextColor(...DARK); doc.text('GRAFOGÉNESIS®', 22, 82)
  doc.setFontSize(12); doc.setFont('helvetica','normal')
  doc.setTextColor(...MUTED); doc.text('Informe de Evaluación Integral', 22, 92)

  // Nombre en su propio bloque separado
  doc.setFontSize(16); doc.setFont('helvetica','bold')
  doc.setTextColor(...DARK)
  const nombreCompleto = evaluacion.nombre+' '+evaluacion.apellido
  doc.text(nombreCompleto, 22, 155)

  if(fecha){
    doc.setFontSize(10); doc.setFont('helvetica','normal')
    doc.setTextColor(...MUTED); doc.text('Fecha: '+fecha, 22, 165)
  }

  doc.setFontSize(8.5); doc.setTextColor(...GOLD)
  doc.text('Grafologa Marcela Zapata', 22, 268)
  doc.text('Grafologa Magdalena Martínez', 22, 274)
  doc.text('Grafologo Leonardo Lembo', 22, 280)
  doc.setFontSize(7); doc.setTextColor(...MUTED)
  doc.text('Documento confidencial — Uso exclusivo del profesional evaluador', 22, 288)

  // ── DATOS PERSONALES ────────────────────────────────────────
  newPage()
  stitle('Datos Personales del Evaluado')
  row2col([
    ['Nombre y Apellido', nombreCompleto],
    ['Fecha de Evaluación', fecha],
    ['Edad', datos.edad],
    ['Estado Civil', datos.estadoCivil],
    ['Hijos', datos.hijos],
    ['Convivientes', datos.convivientes],
    ['Ocupación', datos.ocupacion],
    ['Enfermedad', datos.enfermedad],
    ['Medicación', datos.medicacion],
  ])
  if(datos.observaciones) block('Observaciones', datos.observaciones)

  // ── RESUMEN ESTADÍSTICO ──────────────────────────────────────
  stitle('1. Resumen Estadístico de Dimensiones')
  chk(50)
  doc.setFillColor(...SURF); doc.roundedRect(mL,y-2,cW,40,3,3,'F')
  const badges=[
    ['Predominante +',tA,datos.nivelA],
    ['Intermedia x',  tB,datos.nivelB],
    ['Irregular =',   tC,datos.nivelC],
    ['Deficitaria -', tD,datos.nivelD],
  ]
  badges.forEach(([label,val,nivel],i)=>{
    const ry=y+4+i*9
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...MUTED)
    doc.text(label, mL+4, ry)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...DARK)
    doc.text(String(val), mL+80, ry, {align:'right'})
    doc.text(pct(val), mL+105, ry, {align:'right'})
    doc.setFont('helvetica','bold'); doc.setTextColor(...GOLD)
    doc.text(nivel||'', mL+130, ry)
  })
  y+=44

  stitle('Resultados por Dimensión')
  doc.setFillColor(...DARK); doc.rect(mL,y,cW,8,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...GOLD)
  const cols=[mL+2,mL+72,mL+87,mL+102,mL+117,mL+135,mL+155]
  ;['Dimensión','+','x','=','-','Dom.','Rango'].forEach((h,i)=>doc.text(h,cols[i],y+5.5))
  y+=10

  DIMENSIONES.forEach((dim,di)=>{
    chk(9)
    const d=r[dim.id]; if(!d) return
    if(di%2===0){doc.setFillColor(...SURF);doc.rect(mL,y-1,cW,9,'F')}
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...TEXT)
    doc.text(dim.nombre, cols[0], y+5)
    ;['A','B','C','D'].forEach((l,li)=>{
      doc.text(String(d.valores?.[l]||0), cols[li+1], y+5, {align:'right'})
    })
    doc.setFont('helvetica','bold'); doc.setTextColor(...GOLD)
    doc.text(d.dominante||'', cols[5], y+5)
    doc.setFont('helvetica','normal'); doc.setTextColor(...TEXT)
    doc.text(d.rango||'', cols[6], y+5)
    y+=9
  })
  y+=6

  // ── INTERPRETACIÓN ───────────────────────────────────────────
  newPage()
  stitle('2. Interpretación Cualitativa')
  chk(22)
  doc.setFillColor(...SURF); doc.roundedRect(mL,y,cW,18,3,3,'F')
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
  const pLines=doc.splitTextToSize(PERFIL_TEXTOS[datos.perfil]||'', cW-8)
  pLines.forEach((l,i)=>doc.text(l,mL+4,y+6+i*4.5))
  y+=22

  // ── DINÁMICA ─────────────────────────────────────────────────
  stitle('3. Diagnóstico de Dinámicas Combinadas')
  if(datos.tieneDinamica){
    chk(22)
    doc.setFillColor(255,248,225); doc.roundedRect(mL,y,cW,22,3,3,'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT)
    const dLines=doc.splitTextToSize(DINAMICA_TEXTOS[datos.dinamica]||'', cW-8)
    dLines.forEach((l,i)=>doc.text(l,mL+4,y+6+i*4.5))
    y+=26
  } else {
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
    doc.text('No se detectaron dinámicas combinadas significativas.', mL, y); y+=10
  }

  // ── CONCLUSIONES ─────────────────────────────────────────────
  stitle('4. Conclusiones y Sugerencias')
  block('Fortalezas detectadas', datos.fortalezas||'—')
  block('Áreas de mejora', datos.areas||'—')

  // FOOTER
  chk(22)
  doc.setFillColor(...GOLD); doc.rect(mL,y+6,cW,.3,'F'); y+=12
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...GOLD)
  doc.text('Grafologa Marcela Zapata', mL, y)
  doc.text('Grafologa Magdalena Martínez', W/2, y, {align:'center'})
  doc.text('Grafologo Leonardo Lembo', W-mR, y, {align:'right'})
  y+=5; doc.setFontSize(7); doc.setTextColor(...MUTED)
  doc.text('Documento generado el '+new Date().toLocaleDateString('es-AR'), mL, y)

  // DESCARGA
  const blob=doc.output('blob')
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=`Grafogenesis_${evaluacion.nombre}_${evaluacion.apellido}.pdf`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a)
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
}