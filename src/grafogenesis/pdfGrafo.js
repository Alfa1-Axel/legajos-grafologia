import { jsPDF } from 'jspdf'

export function generarPDFGrafo(evaluacion) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Grafogénesis — Informe', 20, 20)

  doc.setFontSize(12)
  doc.text(
    `${evaluacion.nombre} ${evaluacion.apellido}`,
    20,
    35
  )

  doc.save(`Grafogenesis_${evaluacion.nombre}.pdf`)
}