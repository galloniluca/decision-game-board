import { ROUNDS } from '../lib/costanti'
import { KPI_NOMI, calcolaKpiTavolo, semaforo } from '../lib/kpi'

const LARGHEZZA = 240
const ALTEZZA = 80
const MARGINE = 12

function GraficoKpiSingolo({ chiave, scelteTavolo, opzioniMap, kpiBaseline, riempi = false }) {
  const sceltePlayed = scelteTavolo.filter((s) => s.opzione)
  const ultimoRound = sceltePlayed.reduce((max, s) => Math.max(max, s.round), 0)
  const roundsMostrati = [0, ...ROUNDS.filter((r) => r <= ultimoRound)]

  const valori = roundsMostrati.map((r) => {
    const totali = calcolaKpiTavolo(
      sceltePlayed.filter((s) => s.round <= r),
      opzioniMap,
      kpiBaseline
    )
    return totali[chiave]
  })

  const valoreAttuale = valori[valori.length - 1]
  const statoAttuale = semaforo(valoreAttuale)

  let yMin = Math.min(...valori)
  let yMax = Math.max(...valori)
  if (yMin === yMax) {
    yMin -= 2
    yMax += 2
  } else {
    yMin -= 1
    yMax += 1
  }

  const larghezzaUtile = LARGHEZZA - MARGINE * 2
  const altezzaUtile = ALTEZZA - MARGINE * 2
  const numPunti = roundsMostrati.length

  function coordX(i) {
    if (numPunti === 1) return MARGINE + larghezzaUtile / 2
    return MARGINE + (i * larghezzaUtile) / (numPunti - 1)
  }

  function coordY(v) {
    return MARGINE + altezzaUtile - ((v - yMin) / (yMax - yMin)) * altezzaUtile
  }

  const punti = valori.map((v, i) => `${coordX(i)},${coordY(v)}`).join(' ')
  const coloreDot = { rosso: 'var(--danger)', giallo: 'var(--warning)', verde: 'var(--success)' }

  return (
    <div
      className="grafico-kpi-box"
      style={riempi ? { height: '100%', display: 'flex', flexDirection: 'column' } : undefined}
    >
      <div className={`grafico-kpi-box__header kpi-${statoAttuale}`}>
        <span>{KPI_NOMI[chiave]}</span>
        <span>{valoreAttuale > 0 ? `+${valoreAttuale}` : valoreAttuale}</span>
      </div>
      <svg
        viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
        preserveAspectRatio="none"
        style={
          riempi
            ? { width: '100%', flex: 1, display: 'block', minHeight: 0 }
            : { width: '100%', height: 'auto', display: 'block' }
        }
      >
        <polyline
          points={punti}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {valori.map((v, i) => (
          <circle key={i} cx={coordX(i)} cy={coordY(v)} r="3.5" fill={coloreDot[semaforo(v)]} />
        ))}
      </svg>
    </div>
  )
}

export default GraficoKpiSingolo
