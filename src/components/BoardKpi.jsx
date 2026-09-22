import { KPI_CHIAVI, KPI_NOMI, semaforo } from '../lib/kpi'

function BoardKpi({ totali, mostraValore = true, nomiCompleti = false }) {
  return (
    <div className={nomiCompleti ? 'kpi-row kpi-row--nomi' : 'kpi-row'}>
      {KPI_CHIAVI.map((kpi) => {
        const valore = totali[kpi]
        const stato = semaforo(valore)
        return (
          <div key={kpi} className={`kpi-badge kpi-${stato}${nomiCompleti ? ' kpi-badge--nome' : ''}`}>
            <span className="kpi-label">{nomiCompleti ? KPI_NOMI[kpi] : kpi}</span>
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
