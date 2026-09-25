import { DIMENSIONI, MESSAGGIO_FINALE } from './content'
import { TITOLO_BLOCCO_AVANTI, TITOLO_BLOCCO_MARGINE, frase } from './frasi'
import { arrotonda, calcolaPunteggi, forzeEAttenzioni, livello } from './scoring'
import Radar from './Radar'

const DIMENSIONE_PER_ID = Object.fromEntries(DIMENSIONI.map((d) => [d.id, d]))

function BloccoDimensioni({ titolo, ids, punteggi }) {
  return (
    <section className="card">
      <h2>{titolo}</h2>
      <div className="survey-letture">
        {ids.map((id) => (
          <div key={id} className="survey-lettura">
            <h3>{DIMENSIONE_PER_ID[id].titolo}</h3>
            <p>{frase(id, livello(punteggi[id]).fascia)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Risultato({ anagrafica, risposte }) {
  const punteggi = calcolaPunteggi(risposte)
  const { forze, attenzioni } = forzeEAttenzioni(punteggi)
  const livelloTotale = livello(punteggi.totale)

  return (
    <>
      <h1>Grazie, {anagrafica.nome}</h1>
      <p className="survey-sottotitolo">Ecco il risultato di {anagrafica.azienda}.</p>

      <section className="card survey-totale">
        <div className="section-label">Maturità complessiva</div>
        <div className="survey-totale-valore">{arrotonda(punteggi.totale)}%</div>
        <div className="survey-totale-livello">{livelloTotale.nome}</div>
      </section>

      <section className="card">
        <h2>Il tuo profilo</h2>
        <Radar
          assi={DIMENSIONI.map((d) => ({ id: d.id, etichetta: d.breve, valore: punteggi[d.id] }))}
        />
        <p className="status-muted survey-radar-nota">Centro 0%, bordo esterno 100%.</p>
      </section>

      <BloccoDimensioni titolo={TITOLO_BLOCCO_AVANTI} ids={forze} punteggi={punteggi} />
      <BloccoDimensioni titolo={TITOLO_BLOCCO_MARGINE} ids={attenzioni} punteggi={punteggi} />

      <section className="card survey-messaggio-finale">
        <p>{MESSAGGIO_FINALE}</p>
      </section>
    </>
  )
}

export default Risultato
