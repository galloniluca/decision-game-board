import { KPI_CHIAVI, semaforo } from '../lib/kpi'

function MiniSemaforo({ totali }) {
  return (
    <div className="mini-semaforo">
      {KPI_CHIAVI.map((kpi) => (
        <span
          key={kpi}
          className={`mini-dot mini-${semaforo(totali[kpi])}`}
          title={`${kpi}: ${totali[kpi] > 0 ? `+${totali[kpi]}` : totali[kpi]}`}
        />
      ))}
    </div>
  )
}

export default MiniSemaforo
