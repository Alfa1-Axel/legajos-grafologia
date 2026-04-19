import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

// ✅ IMPORT SIN LLAVES (porque es default)
import { generarPDFGrafo } from './pdfGrafo.js'

export default function AdminGrafo() {
  const navigate = useNavigate()

  const [evaluaciones, setEvaluaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) setEvaluaciones(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta evaluación?')) return

    await supabase
      .from('evaluaciones')
      .delete()
      .eq('id', id)

    setLoading(true)

    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setEvaluaciones(data || [])
    setLoading(false)
  }

  function exportarExcel() {
    const filas = evaluaciones.map(e => ({
      Nombre: e.nombre,
      Apellido: e.apellido,
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluaciones')

    XLSX.writeFile(wb, 'grafogenesis.xlsx')
  }

  const filtered = evaluaciones.filter(e =>
    `${e.nombre} ${e.apellido}`
      .toLowerCase()
      .includes(filtro.toLowerCase())
  )

  return (
    <>
      <h2>Evaluaciones</h2>

      <button onClick={exportarExcel}>Excel</button>
      <button onClick={() => navigate('/')}>Volver</button>

      <input
        placeholder="Buscar..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
      />

      {loading && <p>Cargando...</p>}

      {!loading && filtered.map(ev => (
        <div key={ev.id}>
          <div onClick={() => setOpenId(openId === ev.id ? null : ev.id)}>
            {ev.nombre} {ev.apellido}
          </div>

          {openId === ev.id && (
            <div>
              <button onClick={() => generarPDFGrafo(ev)}>
                PDF
              </button>

              <button onClick={() => eliminar(ev.id)}>
                Eliminar
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  )
}