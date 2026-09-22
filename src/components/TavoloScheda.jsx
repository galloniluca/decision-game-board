import { ROUNDS } from '../lib/costanti'
import { KPI_BASE_DEFAULT, calcolaKpiTavolo } from '../lib/kpi'
import BoardKpi from './BoardKpi'
import GraficoKpi from './GraficoKpi'

function TavoloScheda({ tavolo, scelteTavolo, opzioniMap, kpiBaseline = KPI_BASE_DEFAULT }) {
  const sceltePerRound = {}
  scelteTavolo.forEach((s) => {
    if (s.opzione) sceltePerRound[s.round] = s
  })

  const totaliCorrenti = calcolaKpiTavolo(scelteTavolo, opzioniMap, kpiBaseline)

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

      <div className="dash-card__kpi">
        <span className="dash-card__kpi-label">KPI attuali</span>
        <BoardKpi totali={totaliCorrenti} mostraValore={false} />
      </div>

      <div className="dash-card__grafico">
        <GraficoKpi
          scelteTavolo={scelteTavolo}
          opzioniMap={opzioniMap}
          kpiBaseline={kpiBaseline}
          legenda={false}
          riempi
        />
      </div>
    </div>
  )
}

export default TavoloScheda
