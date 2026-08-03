import { ROUNDS } from '../lib/costanti'
import { calcolaKpiTavolo } from '../lib/kpi'
import MiniSemaforo from './MiniSemaforo'
import BoardKpi from './BoardKpi'

function TavoloScheda({ tavolo, scelteTavolo, opzioniMap }) {
  const sceltePerRound = {}
  scelteTavolo.forEach((s) => {
    sceltePerRound[s.round] = s
  })

  const totaliCorrenti = calcolaKpiTavolo(scelteTavolo, opzioniMap)

  return (
    <div className="dash-card">
      <h3 className="dash-card__nome">{tavolo.nome}</h3>

      <div className="dash-card__rounds">
        {ROUNDS.map((r) => {
          const scelta = sceltePerRound[r]
          const totaliFinoQui = calcolaKpiTavolo(
            scelteTavolo.filter((s) => s.round <= r),
            opzioniMap
          )
          return (
            <div key={r} className="dash-round-chip">
              <span className="dash-round-chip__label">R{r}</span>
              <span className="dash-round-chip__valore">{scelta ? scelta.opzione : '–'}</span>
              {scelta && <MiniSemaforo totali={totaliFinoQui} />}
            </div>
          )
        })}
      </div>

      <div className="dash-card__kpi">
        <BoardKpi totali={totaliCorrenti} mostraValore={false} />
      </div>
    </div>
  )
}

export default TavoloScheda
