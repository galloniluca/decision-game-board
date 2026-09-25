import { ROUNDS } from '../lib/costanti'
import { KPI_BASE_DEFAULT, calcolaKpiTavolo } from '../lib/kpi'
import IstogrammaRound from './IstogrammaRound'

function TavoloScheda({ tavolo, scelteTavolo, opzioniMap, kpiBaseline = KPI_BASE_DEFAULT, ultimoRoundRivelato = 0 }) {
  const sceltePerRound = {}
  scelteTavolo.forEach((s) => {
    if (s.opzione) sceltePerRound[s.round] = s
  })

  return (
    <div className="dash-card">
      <h3 className="dash-card__nome">{tavolo.nome}</h3>

      <div className="dash-card__rounds">
        {ROUNDS.map((r) => {
          const scelta = sceltePerRound[r]
          // Il box KPI del round compare solo se quel round è già stato chiuso: quello
          // attuale (ultimoRoundRivelato) è mostrato a parte, grande, sotto alla griglia.
          const rivelato = r < ultimoRoundRivelato
          return (
            <div key={r} className="dash-round-colonna">
              <div className="dash-round-chip">
                <span className="dash-round-chip__label">R{r}</span>
                <span className="dash-round-chip__valore">{scelta ? scelta.opzione : '–'}</span>
              </div>
              {rivelato && (
                <IstogrammaRound
                  totali={calcolaKpiTavolo(
                    scelteTavolo.filter((s) => s.round <= r),
                    opzioniMap,
                    kpiBaseline
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="dash-card__grafico">
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
    </div>
  )
}

export default TavoloScheda
