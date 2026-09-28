import { ROUNDS } from '../lib/costanti'
import { KPI_BASE_DEFAULT, calcolaKpiTavolo } from '../lib/kpi'
import IstogrammaRound from './IstogrammaRound'

const ROUNDS_SINISTRA = [1, 2]
const ROUNDS_DESTRA = [3, 4]

function TavoloScheda({ tavolo, scelteTavolo, opzioniMap, kpiBaseline = KPI_BASE_DEFAULT, ultimoRoundRivelato = 0 }) {
  const sceltePerRound = {}
  scelteTavolo.forEach((s) => {
    if (s.opzione) sceltePerRound[s.round] = s
  })

  function blocco(r) {
    // Il box KPI del round compare solo se quel round è già stato chiuso: quello
    // attuale (ultimoRoundRivelato) è mostrato a parte, grande, al centro. La lettera
    // scelta non sta più qui (risparmia spazio): è tutta insieme sotto, con le altre.
    const rivelato = r < ultimoRoundRivelato
    return (
      <div key={r} className="dash-round-colonna">
        <span className="dash-round-colonna__label">R{r}</span>
        {rivelato && (
          <IstogrammaRound
            totali={calcolaKpiTavolo(scelteTavolo.filter((s) => s.round <= r), opzioniMap, kpiBaseline)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="dash-card">
      <h3 className="dash-card__nome">{tavolo.nome}</h3>

      <div className="dash-card__corpo">
        <div className="dash-card__laterale">{ROUNDS_SINISTRA.map(blocco)}</div>

        <div className="dash-card__centrale">
          {ultimoRoundRivelato >= 1 ? (
            <IstogrammaRound
              etichetta={`Situazione attuale · R${ultimoRoundRivelato}`}
              totali={calcolaKpiTavolo(
                scelteTavolo.filter((s) => s.round <= ultimoRoundRivelato),
                opzioniMap,
                kpiBaseline
              )}
              grande
            />
          ) : (
            <p className="status-muted" style={{ margin: 0 }}>
              In attesa della chiusura del Round 1...
            </p>
          )}
        </div>

        <div className="dash-card__laterale">{ROUNDS_DESTRA.map(blocco)}</div>
      </div>

      <div className="dash-card__risposte">
        {ROUNDS.map((r) => (
          <span key={r} className="dash-card__risposta">
            <span className="dash-card__risposta-round">R{r}</span>
            <span className="dash-card__risposta-valore">{sceltePerRound[r]?.opzione ?? '–'}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default TavoloScheda
