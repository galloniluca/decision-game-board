import { ROUNDS } from '../lib/costanti'
import { KPI_BASE_DEFAULT, KPI_CHIAVI } from '../lib/kpi'
import GraficoKpiSingolo from './GraficoKpiSingolo'

function TavoloScheda({ tavolo, scelteTavolo, opzioniMap, kpiBaseline = KPI_BASE_DEFAULT }) {
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
          return (
            <div key={r} className="dash-round-chip">
              <span className="dash-round-chip__label">R{r}</span>
              <span className="dash-round-chip__valore">{scelta ? scelta.opzione : '–'}</span>
            </div>
          )
        })}
      </div>

      <div className="dash-card__grafico">
        <div className="grafico-kpi-griglia grafico-kpi-griglia--riempi">
          {KPI_CHIAVI.map((kpi) => (
            <GraficoKpiSingolo
              key={kpi}
              chiave={kpi}
              scelteTavolo={scelteTavolo}
              opzioniMap={opzioniMap}
              kpiBaseline={kpiBaseline}
              riempi
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TavoloScheda
