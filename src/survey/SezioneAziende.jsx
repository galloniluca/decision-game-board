import { useState } from 'react'
import { possibiliDoppioni, rinomina, segnaDistinte, separa, unisci } from './aziende'

// Pulizia dei nomi azienda: doppioni da verificare ed elenco con unioni manuali.
// Le varianti di maiuscole, punteggiatura e forma societaria sono già unite in automatico.

const MAX_SUGGERIMENTI = 20

function Varianti({ gruppo, soloSeDiverse = false }) {
  if (soloSeDiverse && gruppo.varianti.length === 1 && gruppo.varianti[0].testo === gruppo.nome) return null
  return (
    <span className="status-muted">
      {gruppo.varianti.map((v) => (v.n > 1 ? `${v.testo} (${v.n})` : v.testo)).join(' · ')}
    </span>
  )
}

function SezioneAziende({ gruppi, config, onSalva, errore, onVediRisposte }) {
  const [selezione, setSelezione] = useState(() => new Set())
  const [inCorso, setInCorso] = useState(false)
  const [erroreSalvataggio, setErroreSalvataggio] = useState(null)

  const doppioni = possibiliDoppioni(gruppi, config)
  const selezionati = gruppi.filter((g) => selezione.has(g.chiave))

  async function salva(nuovo) {
    setInCorso(true)
    setErroreSalvataggio(null)
    try {
      await onSalva(nuovo)
      setSelezione(new Set())
    } catch (err) {
      setErroreSalvataggio(
        err?.code === 'permission-denied'
          ? 'Firestore non permette di salvare: pubblica dalla console la versione aggiornata di firestore.rules.'
          : err.message
      )
    }
    setInCorso(false)
  }

  function unisciGruppi(lista) {
    // Nome proposto: quello più usato; a parità il più lungo, di solito il più completo.
    const destinazione = [...lista].sort((a, b) => b.n - a.n || b.nome.length - a.nome.length)[0]
    const nome = window.prompt(
      `Unisci ${lista.length} aziende (${lista.map((g) => g.nome).join(', ')}).\n\nNome da usare:`,
      destinazione.nome
    )
    if (nome === null) return
    salva(unisci(config, lista.map((g) => g.chiave), destinazione.chiave, nome))
  }

  function rinominaGruppo(g) {
    const nome = window.prompt(`Nome da mostrare per "${g.nome}" (vuoto = nome più usato):`, g.nome)
    if (nome === null) return
    salva(rinomina(config, g.chiave, nome))
  }

  function commuta(chiave) {
    setSelezione((prima) => {
      const dopo = new Set(prima)
      if (dopo.has(chiave)) dopo.delete(chiave)
      else dopo.add(chiave)
      return dopo
    })
  }

  return (
    <section className="card">
      <h2>Aziende ({gruppi.length})</h2>
      <p className="status-muted">
        I nomi scritti con maiuscole, spazi, punti o forma societaria diversi (srl, spa, s.p.a., group…) sono
        già uniti in automatico. Qui sotto verifichi i nomi simili e unisci a mano quelli che sono la stessa
        azienda: le scelte valgono per tutte le risposte, anche future, e finiscono nella colonna
        “azienda_raggruppata” del CSV.
      </p>
      {(errore || erroreSalvataggio) && <p className="status-error">{erroreSalvataggio ?? errore}</p>}

      <h3>Possibili doppioni da verificare ({doppioni.length})</h3>
      {doppioni.length === 0 ? (
        <p className="status-muted">Nessun nome simile da verificare.</p>
      ) : (
        <ul className="aziende-doppioni">
          {doppioni.slice(0, MAX_SUGGERIMENTI).map(({ a, b }) => (
            <li key={`${a.chiave}|${b.chiave}`} className="aziende-doppione">
              <div className="aziende-doppione__nomi">
                <div>
                  <strong>{a.nome}</strong> <span className="status-muted">({a.n})</span>
                  <br />
                  <Varianti gruppo={a} soloSeDiverse />
                </div>
                <span className="aziende-doppione__vs" aria-hidden="true">
                  ↔
                </span>
                <div>
                  <strong>{b.nome}</strong> <span className="status-muted">({b.n})</span>
                  <br />
                  <Varianti gruppo={b} soloSeDiverse />
                </div>
              </div>
              <div className="aziende-doppione__azioni">
                <button type="button" className="btn btn-primary btn-sm" disabled={inCorso} onClick={() => unisciGruppi([a, b])}>
                  Unisci
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={inCorso}
                  onClick={() => salva(segnaDistinte(config, a.chiave, b.chiave))}
                >
                  Sono diverse
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {doppioni.length > MAX_SUGGERIMENTI && (
        <p className="status-muted">Altre {doppioni.length - MAX_SUGGERIMENTI} coppie compariranno man mano.</p>
      )}

      <details className="aziende-elenco">
        <summary>Elenco completo delle aziende ({gruppi.length})</summary>
        <div className="risultati-selezione">
          <span className="status-muted">Selezionate: {selezionati.length}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={selezionati.length < 2 || inCorso}
            onClick={() => unisciGruppi(selezionati)}
          >
            Unisci selezionate ({selezionati.length})
          </button>
        </div>
        <div className="risultati-scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="risultati-spunta" />
                <th>Azienda</th>
                <th>Risposte</th>
                <th>Scritta come</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {gruppi.map((g) => (
                <tr key={g.chiave}>
                  <td className="risultati-spunta">
                    <input
                      type="checkbox"
                      aria-label={`Seleziona ${g.nome}`}
                      checked={selezione.has(g.chiave)}
                      onChange={() => commuta(g.chiave)}
                    />
                  </td>
                  <td>
                    <button type="button" className="aziende-link" onClick={() => onVediRisposte(g.chiave)}>
                      {g.nome}
                    </button>
                  </td>
                  <td>{g.n}</td>
                  <td>
                    <Varianti gruppo={g} />
                  </td>
                  <td className="aziende-azioni">
                    <button type="button" className="btn btn-sm" disabled={inCorso} onClick={() => rinominaGruppo(g)}>
                      Rinomina
                    </button>
                    {g.unioneManuale && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={inCorso}
                        onClick={() => salva(separa(config, g.chiave))}
                      >
                        Annulla unione
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}

export default SezioneAziende
