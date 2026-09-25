import { useState } from 'react'
import { CAMPI_ANAGRAFICA, MAX_LUNGHEZZA_TESTO } from './content'
import { erroriAnagrafica } from './validazione'

function SchermataAnagrafica({ valori, onChange, onIndietro, onAvanti }) {
  const [mostraErrori, setMostraErrori] = useState(false)
  const errori = erroriAnagrafica(valori)
  const valida = Object.keys(errori).length === 0

  function prosegui(e) {
    e.preventDefault()
    if (valida) onAvanti()
    else setMostraErrori(true)
  }

  return (
    <form onSubmit={prosegui} noValidate>
      <h1>I tuoi dati</h1>
      <p className="status-muted">Tutti i campi sono obbligatori.</p>

      <div className="card survey-form">
        {CAMPI_ANAGRAFICA.map((campo) => {
          const errore = mostraErrori ? errori[campo.id] : null
          const idInput = `survey-${campo.id}`
          return (
            <div key={campo.id} className="survey-campo">
              <label htmlFor={idInput}>{campo.etichetta}</label>
              {campo.tipo === 'select' ? (
                <select
                  id={idInput}
                  className="input"
                  value={valori[campo.id]}
                  aria-invalid={Boolean(errore)}
                  onChange={(e) => onChange({ ...valori, [campo.id]: e.target.value })}
                >
                  <option value="">Seleziona...</option>
                  {campo.opzioni.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={idInput}
                  className="input"
                  type={campo.tipo}
                  autoComplete={campo.autocomplete}
                  inputMode={campo.tipo === 'email' ? 'email' : undefined}
                  maxLength={MAX_LUNGHEZZA_TESTO}
                  value={valori[campo.id]}
                  aria-invalid={Boolean(errore)}
                  onChange={(e) => onChange({ ...valori, [campo.id]: e.target.value })}
                />
              )}
              {errore && <span className="status-error">{errore}</span>}
            </div>
          )
        })}
      </div>

      <div className="survey-nav">
        <button type="button" className="btn" onClick={onIndietro}>
          Indietro
        </button>
        <button type="submit" className="btn btn-primary">
          Avanti
        </button>
      </div>
    </form>
  )
}

export default SchermataAnagrafica
