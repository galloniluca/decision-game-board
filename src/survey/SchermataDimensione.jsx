import { DIMENSIONI } from './content'

function SchermataDimensione({ indice, risposte, onRisposta, onIndietro, onAvanti }) {
  const dimensione = DIMENSIONI[indice]
  const completa = dimensione.domande.every((q) => risposte[q.id])
  const ultima = indice === DIMENSIONI.length - 1

  return (
    <>
      <div className="survey-progresso">
        <div className="survey-progresso-testo">
          Dimensione {indice + 1} di {DIMENSIONI.length}
        </div>
        <div
          className="survey-progresso-barra"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={DIMENSIONI.length}
          aria-valuenow={indice + 1}
        >
          <div style={{ width: `${((indice + 1) / DIMENSIONI.length) * 100}%` }} />
        </div>
      </div>

      <h1>{dimensione.titolo}</h1>
      <p className="status-muted">Scegli la descrizione che rappresenta meglio la tua azienda oggi.</p>

      {dimensione.domande.map((q, n) => (
        <section key={q.id} className="card survey-domanda">
          <div className="section-label">Domanda {n + 1} di {dimensione.domande.length}</div>
          <h2 className="survey-domanda-titolo" id={`titolo-${q.id}`}>
            {q.titolo}
          </h2>
          <div className="option-list" role="radiogroup" aria-labelledby={`titolo-${q.id}`}>
            {q.ancore.map((ancora, a) => {
              const valore = a + 1
              const scelta = risposte[q.id] === valore
              return (
                <button
                  key={valore}
                  type="button"
                  role="radio"
                  aria-checked={scelta}
                  className={`option-btn survey-ancora${scelta ? ' selected' : ''}`}
                  onClick={() => onRisposta(q.id, valore)}
                >
                  <span className="option-letter">{valore}</span>
                  <span>{ancora}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <div className="survey-nav">
        <button type="button" className="btn" onClick={onIndietro}>
          Indietro
        </button>
        <button type="button" className="btn btn-primary" disabled={!completa} onClick={onAvanti}>
          {ultima ? 'Invia e vedi il risultato' : 'Avanti'}
        </button>
      </div>
      {!completa && (
        <p className="status-muted survey-nav-nota">Rispondi a tutte e 3 le domande per proseguire.</p>
      )}
    </>
  )
}

export default SchermataDimensione
