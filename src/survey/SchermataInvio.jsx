function SchermataInvio({ inCorso, errore, onRiprova, onIndietro }) {
  if (errore) {
    return (
      <>
        <h1>Invio non riuscito</h1>
        <div className="card">
          <p className="status-error survey-errore" role="alert">
            {errore}
          </p>
        </div>
        <div className="survey-nav">
          <button type="button" className="btn" onClick={onIndietro}>
            Indietro
          </button>
          <button type="button" className="btn btn-primary" onClick={onRiprova}>
            Riprova
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <h1>Invio in corso</h1>
      <div className="card">
        <p className="status-muted" aria-live="polite">
          {inCorso ? 'Stiamo salvando le tue risposte...' : 'Preparazione invio...'}
        </p>
      </div>
      {!inCorso && (
        <div className="survey-nav">
          <span />
          <button type="button" className="btn btn-primary" onClick={onRiprova}>
            Invia
          </button>
        </div>
      )}
    </>
  )
}

export default SchermataInvio
