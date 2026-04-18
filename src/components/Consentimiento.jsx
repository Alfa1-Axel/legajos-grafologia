function padId(n) { return String(n).padStart(3, '0') }

export default function Consentimiento({ form, update, num }) {
  return (
    <>
      <div className="panel">
        <div className="panel-title">Datos del Consentimiento</div>
        <div className="fgrid">
          <div className="fg">
            <label>ID del Legajo</label>
            <input value={`Legajo #${padId(num || 1)}`} readOnly style={{ color: 'var(--gold)', fontWeight: 500 }} />
          </div>
          <div className="fg">
            <label>Fecha</label>
            <input type="date" value={form.c_fecha} onChange={e => update('c_fecha', e.target.value)} />
          </div>
          <div className="fg full">
            <label>Autorizo a</label>
            <input value={form.c_autoriza} onChange={e => update('c_autoriza', e.target.value)} />
          </div>
          <div className="fg full">
            <label>A realizar análisis a</label>
            <input value={form.c_analiza} onChange={e => update('c_analiza', e.target.value)} placeholder="Referencia del consultante..." />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Datos del Firmante</div>
        <div className="fgrid">
          <div className="fg">
            <label>Edad</label>
            <input value={form.c_edad} onChange={e => update('c_edad', e.target.value)} placeholder="Edad del solicitante" />
          </div>
          <div className="fg">
            <label>Sexo</label>
            <input value={form.c_sexo} onChange={e => update('c_sexo', e.target.value)} placeholder="Femenino / Masculino" />
          </div>
          <div className="fg">
            <label>DNI</label>
            <input value={form.c_dni} onChange={e => update('c_dni', e.target.value)} placeholder="Número de documento" />
          </div>
          <div className="fg">
            <label>Fecha de muestra</label>
            <input type="date" value={form.c_fecha_muestra} onChange={e => update('c_fecha_muestra', e.target.value)} />
          </div>
          <div className="fg full">
            <label>Aclaración (nombre completo)</label>
            <input value={form.c_aclaracion} onChange={e => update('c_aclaracion', e.target.value)} placeholder="Nombre y apellido completo" />
          </div>
          <div className="fg full">
            <label>Referencia de firma</label>
            <input value={form.c_firma_desc} onChange={e => update('c_firma_desc', e.target.value)} placeholder="Ej: Firmado el día... / Adjuntar escaneado" />
          </div>
        </div>
      </div>

      <div className="panel" style={{ borderColor: 'var(--border2)' }}>
        <div className="panel-title">Consentimiento Específico para Grafología</div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 14 }}>
          AUTORIZO que mi escritura y los datos clínicos asociados sean utilizados exclusivamente 
          con fines de estudio e investigación. Entiendo que mi identidad permanecerá bajo código 
          ID para garantizar el anonimato y que los resultados se utilizarán para avanzar en el 
          conocimiento de las correspondencias entre rasgos gráficos y procesos de salud.
        </p>
        <div className="fgrid">
          <div className="fg full">
            <label>Firma del Paciente o Tutor — Referencia</label>
            <input value={form.c_firma_paciente} onChange={e => update('c_firma_paciente', e.target.value)} placeholder="Ej: Firmado y entregado en consultorio..." />
          </div>
          <div className="fg full">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.c_acepta} onChange={e => update('c_acepta', e.target.checked)} style={{ width: 'auto' }} />
              El paciente aceptó y firmó el consentimiento informado
            </label>
          </div>
        </div>
      </div>
    </>
  )
}