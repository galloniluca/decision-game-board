import { COLORE_SEMAFORO, KPI_CHIAVI, semaforo } from '../lib/kpi'

function BoardKpi({ totali }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {KPI_CHIAVI.map((kpi) => {
        const valore = totali[kpi]
        const stato = semaforo(valore)
        return (
          <div
            key={kpi}
            style={{
              padding: '0.4rem 0.7rem',
              borderRadius: 6,
              background: COLORE_SEMAFORO[stato],
              color: '#111',
              fontWeight: 'bold',
              minWidth: 44,
              textAlign: 'center',
            }}
          >
            {kpi}: {valore > 0 ? `+${valore}` : valore}
          </div>
        )
      })}
    </div>
  )
}

export default BoardKpi
