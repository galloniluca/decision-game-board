import { KPI_CHIAVI, semaforo } from '../lib/kpi'

const CLASSE_LIVELLO = { rosso: 'h-basso', giallo: 'h-medio', verde: 'h-alto' }

function IstogrammaRound({ etichetta, totali, grande = false }) {
  return (
    <div className={`istogramma-round${grande ? ' istogramma-round--grande' : ''}`}>
      <span className="istogramma-round__label">{etichetta}</span>
      <div className="istogramma-round__barre">
        {KPI_CHIAVI.map((kpi) => {
          const stato = semaforo(totali[kpi])
          return (
            <div key={kpi} className="istogramma-round__colonna">
              <div className={`istogramma-round__barra ${CLASSE_LIVELLO[stato]} kpi-${stato}`} />
              <span className="istogramma-round__kpi-label">{kpi}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IstogrammaRound
