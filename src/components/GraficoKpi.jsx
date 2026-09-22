import { ROUNDS } from '../lib/costanti'
import { KPI_CHIAVI, KPI_COLORI, KPI_NOMI, calcolaKpiTavolo } from '../lib/kpi'

const LARGHEZZA = 280
const ALTEZZA = 130
const MARGINE_SX = 22
const MARGINE_DX = 10
const MARGINE_TOP = 10
const MARGINE_BASSO = 22

function GraficoKpi({ scelteTavolo, opzioniMap, kpiBaseline, legenda = true, riempi = false }) {
  const sceltePlayed = scelteTavolo.filter((s) => s.opzione)
  const ultimoRound = sceltePlayed.reduce((max, s) => Math.max(max, s.round), 0)
  const roundsMostrati = [0, ...ROUNDS.filter((r) => r <= ultimoRound)]

  const serie = {}
  for (const kpi of KPI_CHIAVI) {
    serie[kpi] = roundsMostrati.map((r) => {
      const totali = calcolaKpiTavolo(
        sceltePlayed.filter((s) => s.round <= r),
        opzioniMap,
        kpiBaseline
      )
      return totali[kpi]
    })
  }

  const tuttiValori = KPI_CHIAVI.flatMap((kpi) => serie[kpi])
  let yMin = Math.min(...tuttiValori)
  let yMax = Math.max(...tuttiValori)
  if (yMin === yMax) {
    yMin -= 2
    yMax += 2
  } else {
    yMin -= 1
    yMax += 1
  }

  const larghezzaUtile = LARGHEZZA - MARGINE_SX - MARGINE_DX
  const altezzaUtile = ALTEZZA - MARGINE_TOP - MARGINE_BASSO
  const numPunti = roundsMostrati.length

  function coordX(i) {
    if (numPunti === 1) return MARGINE_SX + larghezzaUtile / 2
    return MARGINE_SX + (i * larghezzaUtile) / (numPunti - 1)
  }

  function coordY(valore) {
    return MARGINE_TOP + altezzaUtile - ((valore - yMin) / (yMax - yMin)) * altezzaUtile
  }

  const yZero = coordY(0)
  const mostraLineaZero = yZero >= MARGINE_TOP && yZero <= MARGINE_TOP + altezzaUtile

  return (
    <div style={riempi ? { height: '100%', display: 'flex', flexDirection: 'column' } : undefined}>
      <svg
        viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
        preserveAspectRatio="none"
        style={riempi ? { width: '100%', flex: 1, display: 'block', minHeight: 0 } : { width: '100%', height: 'auto', display: 'block' }}
      >
        {mostraLineaZero && (
          <line
            x1={MARGINE_SX}
            x2={LARGHEZZA - MARGINE_DX}
            y1={yZero}
            y2={yZero}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="3 3"
          />
        )}

        {roundsMostrati.map((r, i) => (
          <text
            key={r}
            x={coordX(i)}
            y={ALTEZZA - 4}
            fontSize="9"
            fill="rgba(255,255,255,0.55)"
            textAnchor="middle"
          >
            {r === 0 ? 'Inizio' : `R${r}`}
          </text>
        ))}

        {KPI_CHIAVI.map((kpi) => {
          const punti = serie[kpi].map((v, i) => `${coordX(i)},${coordY(v)}`).join(' ')
          return (
            <g key={kpi}>
              <polyline
                points={punti}
                fill="none"
                stroke={KPI_COLORI[kpi]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {serie[kpi].map((v, i) => (
                <circle key={i} cx={coordX(i)} cy={coordY(v)} r="2.5" fill={KPI_COLORI[kpi]} />
              ))}
            </g>
          )
        })}
      </svg>

      {legenda && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
          {KPI_CHIAVI.map((kpi) => (
            <span
              key={kpi}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: KPI_COLORI[kpi], display: 'inline-block' }}
              />
              {KPI_NOMI[kpi]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default GraficoKpi
