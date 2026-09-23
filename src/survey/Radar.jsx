// Radar a 7 assi in SVG scritto a mano (nessuna libreria di grafici).
// Una sola serie, scala 0-100%: centro = 0%, bordo esterno = 100%.
// Per scelta della specifica non mostra valori numerici per dimensione.

const LARGHEZZA = 460
const ALTEZZA = 280
const CX = 230
const CY = 138
const RAGGIO = 100
const ANELLI = [20, 40, 60, 80, 100] // confini delle fasce di maturità

// Asse i: si parte dall'alto (-90°) e si procede in senso orario.
function punto(i, n, pct, raggio = RAGGIO) {
  const angolo = -Math.PI / 2 + (2 * Math.PI * i) / n
  const r = (raggio * pct) / 100
  return [CX + r * Math.cos(angolo), CY + r * Math.sin(angolo)]
}

function poligono(valori) {
  return valori.map((v, i) => punto(i, valori.length, v).map((c) => c.toFixed(1)).join(',')).join(' ')
}

// Etichette lunghe su due righe, spezzate all'ultimo spazio.
function righeEtichetta(testo) {
  if (testo.length <= 14 || !testo.includes(' ')) return [testo]
  const i = testo.lastIndexOf(' ')
  return [testo.slice(0, i), testo.slice(i + 1)]
}

function Radar({ assi }) {
  const n = assi.length
  const valori = assi.map((a) => Math.max(0, Math.min(100, a.valore)))

  return (
    <svg
      className="survey-radar"
      viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
      role="img"
      aria-label={`Profilo di maturità sulle ${n} dimensioni: ${assi.map((a) => a.etichetta).join(', ')}`}
    >
      <g className="survey-radar-griglia">
        {ANELLI.map((pct) => (
          <polygon key={pct} points={poligono(Array(n).fill(pct))} />
        ))}
        {assi.map((a, i) => {
          const [x, y] = punto(i, n, 100)
          return <line key={a.id} x1={CX} y1={CY} x2={x.toFixed(1)} y2={y.toFixed(1)} />
        })}
      </g>

      <polygon className="survey-radar-area" points={poligono(valori)} />
      {valori.map((v, i) => {
        const [x, y] = punto(i, n, v)
        return <circle key={assi[i].id} className="survey-radar-punto" cx={x} cy={y} r={4.5} />
      })}

      {assi.map((a, i) => {
        const [x, y] = punto(i, n, 100, RAGGIO + 12)
        const righe = righeEtichetta(a.etichetta)
        const ancoraggio = Math.abs(x - CX) < 8 ? 'middle' : x > CX ? 'start' : 'end'
        // Sopra il centro le righe crescono verso l'alto, sotto verso il basso.
        const dy0 = y < CY - 8 ? -(righe.length - 1) * 17 : y > CY + 8 ? 12 : -((righe.length - 1) * 17) / 2 + 5
        return (
          <text key={a.id} className="survey-radar-etichetta" x={x} y={y} textAnchor={ancoraggio}>
            {righe.map((r, k) => (
              <tspan key={k} x={x} dy={k === 0 ? dy0 : 17}>
                {r}
              </tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

export default Radar
