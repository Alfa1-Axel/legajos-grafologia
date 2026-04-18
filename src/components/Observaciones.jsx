export default function Observaciones({ form, update }) {
  const campos = [
    { key: 'obs_general', label: 'Análisis general', rows: 5, placeholder: 'Descripción completa del estudio grafológico realizado...' },
    { key: 'obs_escritura', label: 'Características de la escritura', rows: 4, placeholder: 'Tamaño, inclinación, presión, velocidad, forma de las letras...' },
    { key: 'obs_psico', label: 'Aspectos psicológicos / clínicos observados', rows: 4, placeholder: 'Rasgos de personalidad, estado emocional, tendencias...' },
    { key: 'obs_corr', label: 'Correspondencia con diagnóstico médico', rows: 3, placeholder: 'Relación entre rasgos gráficos y la fase/estadio del diagnóstico...' },
    { key: 'obs_concl', label: 'Conclusiones y recomendaciones', rows: 4, placeholder: 'Conclusiones finales del análisis...' },
    { key: 'obs_notas', label: 'Notas internas del equipo (no se incluyen en PDF)', rows: 3, placeholder: 'Notas internas para el equipo grafológico...' },
  ]

  return (
    <div className="panel">
      <div className="panel-title">Observaciones Completas del Estudio Grafológico</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {campos.map(c => (
          <div className="fg full" key={c.key}>
            <label>{c.label}</label>
            <textarea rows={c.rows} value={form[c.key] || ''} onChange={e => update(c.key, e.target.value)} placeholder={c.placeholder} />
          </div>
        ))}
      </div>
    </div>
  )
}