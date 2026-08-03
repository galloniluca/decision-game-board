import { KPI_CHIAVI, semaforo } from '../lib/kpi'

function BoardKpi({ totali, mostraValore = true }) {
  return (
    <div className="kpi-row">
      {KPI_CHIAVI.map((kpi) => {
        const valore = totali[kpi]
        const stato = semaforo(valore)
        return (
          <div key={kpi} className={`kpi-badge kpi-${stato}`}>
            <span className="kpi-label">{kpi}</span>
            {mostraValore && (
              <span className="kpi-value">{valore > 0 ? `+${valore}` : valore}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default BoardKpi
