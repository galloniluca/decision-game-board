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
    const scelta = sceltePerRound[r]
    // Il box KPI del round compare solo se quel round è già stato chiuso: quello
    // attuale (ultimoRoundRivelato) è mostrato a parte, grande, al centro.
    const rivelato = r < ultimoRoundRivelato
    return (
      <div key={r} className="dash-round-colonna">
        <div className="dash-round-chip">
          <span className="dash-round-chip__label">R{r}</span>
          <span className="dash-round-chip__valore">{scelta ? scelta.opzione : '–'}</span>
        </div>
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
    </div>
  )
}

export default TavoloScheda
