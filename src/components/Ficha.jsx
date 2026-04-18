export default function Ficha({ form, update }) {
  return (
    <>
      <div className="panel">
        <div className="panel-title">1. Perfil Biográfico y Clínico</div>
        <div className="fgrid">
          <div className="fg">
            <label>Edad al momento de la muestra</label>
            <input type="number" value={form.edad} onChange={e => update('edad', e.target.value)} placeholder="Ej: 45" min="0" max="120" />
          </div>
          <div className="fg">
            <label>Sexo Biológico</label>
            <select value={form.sexo} onChange={e => update('sexo', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option>Femenino</option><option>Masculino</option><option>Intersex</option>
            </select>
          </div>
          <div className="fg">
            <label>Nivel de Escolaridad</label>
            <select value={form.escolaridad} onChange={e => update('escolaridad', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option>Primario</option><option>Secundario</option><option>Terciario</option>
              <option>Universitario</option><option>Posgrado</option><option>Sin escolaridad</option>
            </select>
          </div>
          <div className="fg">
            <label>Lateralidad</label>
            <div className="radio-group">
              {['Diestro','Zurdo','Ambidiestro'].map(v => (
                <label key={v}>
                  <input type="radio" name="lateralidad" value={v} checked={form.lateralidad===v} onChange={() => update('lateralidad', v)} /> {v}
                </label>
              ))}
            </div>
          </div>
          <div className="fg full">
            <label>Diagnóstico Médico</label>
            <input value={form.diagnostico} onChange={e => update('diagnostico', e.target.value)} placeholder="Ej: Cáncer de mama, Diabetes tipo 2..." />
          </div>
          <div className="fg">
            <label>Fase / Estadio</label>
            <input value={form.fase} onChange={e => update('fase', e.target.value)} placeholder="Ej: Fase 2, Estadio III..." />
          </div>
          <div className="fg">
            <label>Medicamentos Actuales</label>
            <div className="radio-group">
              {['Sí','No'].map(v => (
                <label key={v}>
                  <input type="radio" name="medicamentos" value={v} checked={form.medicamentos===v} onChange={() => update('medicamentos', v)} /> {v}
                </label>
              ))}
            </div>
          </div>
          <div className="fg full">
            <label>Especificar medicamentos</label>
            <input value={form.medicamentos_detalle} onChange={e => update('medicamentos_detalle', e.target.value)} placeholder="Nombre de medicamentos..." />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">2. Condiciones de la Toma de Muestra</div>
        <div className="fgrid">
          <div className="fg">
            <label>Fecha de la escritura</label>
            <input type="date" value={form.fecha_escritura} onChange={e => update('fecha_escritura', e.target.value)} />
          </div>
          <div className="fg">
            <label>Hora de la muestra</label>
            <input value={form.hora} onChange={e => update('hora', e.target.value)} placeholder="Ej: 14:30" />
          </div>
          <div className="fg">
            <label>Lugar</label>
            <input value={form.lugar} onChange={e => update('lugar', e.target.value)} placeholder="Ej: Domicilio, Consultorio..." />
          </div>
          <div className="fg">
            <label>Instrumento de escritura</label>
            <select value={form.instrumento} onChange={e => update('instrumento', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option>Bolígrafo</option><option>Lapicera</option><option>Lápiz</option>
              <option>Marcador</option><option>Birrome</option><option>Otro</option>
            </select>
          </div>
          <div className="fg">
            <label>Tipo de papel</label>
            <select value={form.papel} onChange={e => update('papel', e.target.value)}>
              <option value="">— Seleccionar —</option>
              <option>Rayado</option><option>Liso</option><option>Cuadriculado</option><option>Con margen</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">3. Clasificación de la Muestra Gráfica</div>
        <div className="fgrid">
          <div className="fg">
            <label>Tipo de escrito</label>
            <div className="radio-group">
              {['Espontáneo','Dictado','Copiado'].map(v => (
                <label key={v}>
                  <input type="radio" name="tipo_escrito" value={v} checked={form.tipo_escrito===v} onChange={() => update('tipo_escrito', v)} /> {v}
                </label>
              ))}
            </div>
          </div>
          <div className="fg">
            <label>Estado anímico percibido</label>
            <input value={form.animo} onChange={e => update('animo', e.target.value)} placeholder="Ej: Tranquilo, ansioso..." />
          </div>
          <div className="fg full">
            <label>Limitaciones físicas</label>
            <input value={form.limitaciones} onChange={e => update('limitaciones', e.target.value)} placeholder="Ej: Artritis, temblor..." />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">4. Análisis de Correspondencia — Uso del Equipo</div>
        <div className="fgrid">
          <div className="fg full">
            <label>Rasgos clave que coincidan con la fase de la enfermedad</label>
            <textarea rows={5} value={form.analisis_correspondencia} onChange={e => update('analisis_correspondencia', e.target.value)} placeholder="Espacio reservado para el grafólogo..." />
          </div>
        </div>
      </div>
    </>
  )
}