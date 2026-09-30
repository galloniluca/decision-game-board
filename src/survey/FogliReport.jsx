import { DIMENSIONI } from './content'
import { TITOLO_BLOCCO_AVANTI, TITOLO_BLOCCO_MARGINE, frase } from './frasi'
import { LIVELLI, arrotonda, livello } from './scoring'
import { MIN_RISPOSTE_SETTORE_REPORT, datiReport, scarto } from './report'
import Radar from './Radar'

// Report personale con benchmark, impaginato in due fogli A4 (schermo, stampa e PDF).

const EVENTO = '29 settembre 2026 · Simonelli Group Campus, Belforte del Chienti'
const DIMENSIONE_PER_ID = Object.fromEntries(DIMENSIONI.map((d) => [d.id, d]))
const ASSI = DIMENSIONI.map((d) => ({ id: d.id, etichetta: d.breve }))

const pct = (v) => (v == null ? '–' : `${arrotonda(v)}%`)

function Scarto({ valore }) {
  if (valore == null) return '–'
  if (valore === 0) return <span className="report-scarto">= 0</span>
  const su = valore > 0
  return (
    <span className={`report-scarto ${su ? 'report-scarto--su' : 'report-scarto--giu'}`}>
      {su ? '▲ +' : '▼ −'}
      {Math.abs(valore)}
    </span>
  )
}

function Lettura({ id, dati, riferimento }) {
  const d = DIMENSIONE_PER_ID[id]
  const tuo = dati.punteggi[id]
  return (
    <div className="report-lettura">
      <div className="report-lettura__testa">
        <h3>{d.titolo}</h3>
        <span className="report-lettura__valori">
          {pct(tuo)} · {livello(tuo).nome}
          <span className="report-muted">
            {' '}
            ({riferimento.etichettaBreve} {pct(riferimento.medie[id])})
          </span>
        </span>
      </div>
      <p>{frase(id, livello(tuo).fascia)}</p>
    </div>
  )
}

function FogliReport({ risposta, risposte }) {
  const a = risposta.anagrafica ?? {}
  const dati = datiReport(risposta, risposte)
  const conSettore = Boolean(dati.settore.medie)
  const riferimento = conSettore
    ? { medie: dati.settore.medie, etichetta: 'il tuo settore', etichettaBreve: 'settore' }
    : { medie: dati.tutte.medie, etichetta: 'tutte le aziende', etichettaBreve: 'media aziende' }

  return (
    <>
      <article className="report-foglio">
        <header className="report-testata">
          <img src="/logo-bpr.png" alt="BPR Group" className="report-testata__logo" />
          <div className="report-testata__testo">
            <strong>Lean nell’era dell’incertezza</strong>
            <span>Report personale · {EVENTO}</span>
          </div>
        </header>

        <div className="report-corpo">
          <section className="report-persona">
            <h1>{a.nome}</h1>
            <p>
              {[a.ruolo, a.azienda].filter(Boolean).join(' · ')}
              <br />
              <span className="report-muted">{[a.settore, a.dimensione].filter(Boolean).join(' · ')}</span>
            </p>
          </section>

          <section className="report-tessere">
            <div className="report-tessera report-tessera--tu">
              <span className="report-tessera__titolo">La tua maturità complessiva</span>
              <span className="report-tessera__valore">{pct(dati.punteggi.totale)}</span>
              <span className="report-tessera__nota">{dati.livello.nome}</span>
            </div>
            <div className="report-tessera">
              <span className="report-tessera__titolo">Media del tuo settore</span>
              {conSettore ? (
                <>
                  <span className="report-tessera__valore">{pct(dati.settore.medie.totale)}</span>
                  <span className="report-tessera__nota">{dati.settore.n} risposte</span>
                </>
              ) : (
                <>
                  <span className="report-tessera__valore report-tessera__valore--vuoto">n.d.</span>
                  <span className="report-tessera__nota">campione insufficiente</span>
                </>
              )}
            </div>
            <div className="report-tessera">
              <span className="report-tessera__titolo">Media di tutte le aziende</span>
              <span className="report-tessera__valore">{pct(dati.tutte.medie?.totale)}</span>
              <span className="report-tessera__nota">{dati.tutte.n} risposte</span>
            </div>
          </section>

          <section className="report-sezione">
            <h2>Il tuo profilo a confronto</h2>
            <div className="report-radar">
              <Radar
                assi={ASSI}
                serie={[
                  { id: 'tutte', valori: dati.tutte.medie ?? {}, classe: 'report-serie-tutte', forma: 'nessuno' },
                  ...(conSettore
                    ? [{ id: 'settore', valori: dati.settore.medie, classe: 'report-serie-settore', forma: 'quadrato' }]
                    : []),
                  { id: 'tu', valori: dati.punteggi, classe: 'report-serie-tu' },
                ]}
              />
              <div className="report-legenda">
                <span className="report-legenda__voce">
                  <span className="report-legenda__segno report-serie-tu" /> Tu
                </span>
                {conSettore && (
                  <span className="report-legenda__voce">
                    <span className="report-legenda__segno report-legenda__segno--quadrato report-serie-settore" />{' '}
                    {dati.settore.nome}
                  </span>
                )}
                <span className="report-legenda__voce">
                  <span className="report-legenda__segno report-legenda__segno--linea report-serie-tutte" /> Tutte le
                  aziende
                </span>
              </div>
            </div>
          </section>

          <section className="report-sezione">
            <h2>Dettaglio per area</h2>
            <table className="report-tabella">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Tu</th>
                  <th>Fascia</th>
                  {conSettore && <th>Settore</th>}
                  <th>Tutte</th>
                  <th>Rispetto a {conSettore ? 'settore' : 'tutte'}</th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONI.map((d) => (
                  <tr key={d.id}>
                    <td>{d.titolo}</td>
                    <td className="report-num report-forte">{pct(dati.punteggi[d.id])}</td>
                    <td>{livello(dati.punteggi[d.id]).nome}</td>
                    {conSettore && <td className="report-num">{pct(dati.settore.medie[d.id])}</td>}
                    <td className="report-num">{pct(dati.tutte.medie?.[d.id])}</td>
                    <td className="report-num">
                      <Scarto valore={scarto(dati.punteggi[d.id], riferimento.medie?.[d.id])} />
                    </td>
                  </tr>
                ))}
                <tr className="report-tabella__totale">
                  <td>Complessivo</td>
                  <td className="report-num">{pct(dati.punteggi.totale)}</td>
                  <td>{dati.livello.nome}</td>
                  {conSettore && <td className="report-num">{pct(dati.settore.medie.totale)}</td>}
                  <td className="report-num">{pct(dati.tutte.medie?.totale)}</td>
                  <td className="report-num">
                    <Scarto valore={scarto(dati.punteggi.totale, riferimento.medie?.totale)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </article>

      <article className="report-foglio">
        <div className="report-corpo">
          <section className="report-sezione">
            <h2>{TITOLO_BLOCCO_AVANTI}</h2>
            {dati.forze.map((id) => (
              <Lettura key={id} id={id} dati={dati} riferimento={riferimento} />
            ))}
          </section>

          <section className="report-sezione">
            <h2>{TITOLO_BLOCCO_MARGINE}</h2>
            {dati.attenzioni.map((id) => (
              <Lettura key={id} id={id} dati={dati} riferimento={riferimento} />
            ))}
          </section>

          <section className="report-sezione report-metodo">
            <h2>Come leggere questo report</h2>
            <p>
              Ogni area è misurata da tre domande con risposte da 1 a 5, trasformate in percentuale: 0% significa
              tutte le risposte al livello più basso, 100% tutte al livello più alto. Il punteggio complessivo è la
              media delle sette aree.
            </p>
            <p>
              Fasce di maturità:{' '}
              {LIVELLI.map((l, i) => `${l.nome} ${i === 0 ? 0 : LIVELLI[i - 1].max + 1}-${l.max}%`).join(' · ')}.
            </p>
            <p>
              Il confronto è calcolato sulle {dati.tutte.n} risposte complete raccolte all’evento, compresa la
              tua, e riportato solo in forma aggregata.
              {conSettore
                ? ` La media del settore “${dati.settore.nome}” si basa su ${dati.settore.n} risposte.`
                : ` Per il settore “${dati.settore.nome}” sono arrivate ${dati.settore.n} risposte: sotto le ${MIN_RISPOSTE_SETTORE_REPORT} non mostriamo la media di settore, perché sarebbe poco significativa e non tutelerebbe la riservatezza degli altri partecipanti.`}
            </p>
            <p>
              Il risultato riflette la percezione di chi ha compilato il questionario: è un punto di partenza per il
              confronto, non una valutazione esterna.
            </p>
          </section>

          <footer className="report-piede">
            <strong>BPR Group</strong> · Per approfondire i tuoi risultati rispondi a questa email: saremo felici di
            parlarne con te.
          </footer>
        </div>
      </article>
    </>
  )
}

export default FogliReport
