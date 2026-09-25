import { CONSENSI, INFORMATIVA_PRIVACY, VERSIONE_TESTO_CONSENSO } from './content'
import { consensiValidi } from './validazione'

function SchermataConsenso({ valori, onChange, onAvanti }) {
  const puoiProseguire = consensiValidi(valori)

  return (
    <>
      <h1>Benvenuto</h1>
      <p className="survey-intro">
        Questo questionario fotografa la maturità della tua azienda su 7 dimensioni: Lean e
        flussi, miglioramento continuo, governance, decisioni e trade-off, digitalizzazione,
        intelligenza artificiale, persone e leadership. Servono circa 10-12 minuti.
      </p>
      <p className="survey-intro">
        Per ogni domanda scegli la descrizione che rappresenta meglio la tua azienda{' '}
        <strong>oggi</strong>. Alla fine vedrai subito il tuo risultato personale.
      </p>

      <div className="card">
        <div className="section-label">Informativa privacy</div>
        <div className="survey-informativa">{INFORMATIVA_PRIVACY}</div>
        <p className="status-muted">Versione testo: {VERSIONE_TESTO_CONSENSO}</p>

        <div className="survey-consensi">
          {CONSENSI.map((c) => (
            <label key={c.id} className="survey-check">
              <input
                type="checkbox"
                checked={Boolean(valori[c.id])}
                onChange={(e) => onChange({ ...valori, [c.id]: e.target.checked })}
              />
              <span>
                {c.testo}{' '}
                <em className="survey-check-nota">
                  ({c.obbligatorio ? 'obbligatorio' : 'facoltativo'})
                </em>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="survey-nav">
        <span />
        <button className="btn btn-primary" disabled={!puoiProseguire} onClick={onAvanti}>
          Inizia
        </button>
      </div>
      {!puoiProseguire && (
        <p className="status-muted survey-nav-nota">
          Per proseguire servono i due consensi obbligatori.
        </p>
      )}
    </>
  )
}

export default SchermataConsenso
