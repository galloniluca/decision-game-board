import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROUNDS = [1, 2, 3, 4]
const LETTERE = ['A', 'B', 'C']
const SHIFT_VALORI = [-1, 0, 1]

function chiaveOpzione(round, opzione) {
  return `${round}-${opzione}`
}

function Config() {
  const [opzioni, setOpzioni] = useState({})
  const [tavoli, setTavoli] = useState([])
  const [statoRiga, setStatoRiga] = useState({})
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(true)
  const [resetInCorso, setResetInCorso] = useState(false)

  useEffect(() => {
    caricaDati()
  }, [])

  async function caricaDati() {
    setCaricamento(true)
    setErrore(null)

    const [{ data: opzioniData, error: opzioniErr }, { data: tavoliData, error: tavoliErr }] =
      await Promise.all([
        supabase.from('opzioni').select('*').order('round').order('opzione'),
        supabase.from('tavoli').select('*').order('id'),
      ])

    if (opzioniErr || tavoliErr) {
      setErrore((opzioniErr || tavoliErr).message)
      setCaricamento(false)
      return
    }

    const mappaOpzioni = {}
    for (const riga of opzioniData) {
      mappaOpzioni[chiaveOpzione(riga.round, riga.opzione)] = riga
    }
    setOpzioni(mappaOpzioni)
    setTavoli(tavoliData)
    setCaricamento(false)
  }

  function aggiornaCampoOpzione(round, opzione, campo, valore) {
    const chiave = chiaveOpzione(round, opzione)
    setOpzioni((prev) => ({
      ...prev,
      [chiave]: { ...prev[chiave], [campo]: valore },
    }))
  }

  async function salvaOpzione(round, opzione) {
    const chiave = chiaveOpzione(round, opzione)
    const riga = opzioni[chiave]
    setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvataggio' }))

    const { error } = await supabase
      .from('opzioni')
      .update({
        nome: riga.nome,
        shift_q: riga.shift_q,
        shift_s: riga.shift_s,
        shift_c: riga.shift_c,
        shift_p: riga.shift_p,
      })
      .eq('round', round)
      .eq('opzione', opzione)

    setStatoRiga((prev) => ({ ...prev, [chiave]: error ? `errore: ${error.message}` : 'salvato' }))
  }

  function aggiornaNomeTavolo(id, nome) {
    setTavoli((prev) => prev.map((t) => (t.id === id ? { ...t, nome } : t)))
  }

  async function salvaTavolo(id) {
    const tavolo = tavoli.find((t) => t.id === id)
    const chiave = `tavolo-${id}`
    setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvataggio' }))

    const { error } = await supabase.from('tavoli').update({ nome: tavolo.nome }).eq('id', id)

    setStatoRiga((prev) => ({ ...prev, [chiave]: error ? `errore: ${error.message}` : 'salvato' }))
  }

  async function resetPartita() {
    const confermato = window.confirm(
      'Reset partita: verranno cancellate tutte le scelte inviate e la sessione tornerà al Round 1 (chiuso). Continuare?'
    )
    if (!confermato) return

    setResetInCorso(true)
    setErrore(null)

    const { error: errScelte } = await supabase.from('scelte').delete().gte('id', 0)
    const { error: errSessione } = await supabase
      .from('sessione')
      .update({ round_attivo: 1, stato: 'chiuso', timer_avvio: null })
      .eq('id', 1)

    setResetInCorso(false)

    if (errScelte || errSessione) {
      setErrore((errScelte || errSessione).message)
    } else {
      window.alert('Partita resettata.')
    }
  }

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento...</p>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 900 }}>
      <p>
        <Link to="/">← Home</Link>
      </p>
      <h1>Config</h1>

      {errore && <p style={{ color: 'crimson' }}>❌ {errore}</p>}

      <h2>Matrice punteggi</h2>
      <table cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th>Round</th>
            <th>Opz.</th>
            <th>Nome opzione</th>
            <th>Q</th>
            <th>S</th>
            <th>C</th>
            <th>P</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ROUNDS.map((round) =>
            LETTERE.map((opzione) => {
              const chiave = chiaveOpzione(round, opzione)
              const riga = opzioni[chiave]
              if (!riga) return null
              return (
                <tr key={chiave} style={{ borderBottom: '1px solid #ddd' }}>
                  <td>{round}</td>
                  <td>{opzione}</td>
                  <td>
                    <input
                      type="text"
                      value={riga.nome ?? ''}
                      onChange={(e) => aggiornaCampoOpzione(round, opzione, 'nome', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  {['shift_q', 'shift_s', 'shift_c', 'shift_p'].map((campo) => (
                    <td key={campo}>
                      <select
                        value={riga[campo]}
                        onChange={(e) =>
                          aggiornaCampoOpzione(round, opzione, campo, Number(e.target.value))
                        }
                      >
                        {SHIFT_VALORI.map((v) => (
                          <option key={v} value={v}>
                            {v > 0 ? `+${v}` : v}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td>
                    <button type="button" onClick={() => salvaOpzione(round, opzione)}>
                      Salva
                    </button>{' '}
                    <span>{statoRiga[chiave]}</span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <h2>Tavoli</h2>
      <table cellPadding="6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th>ID</th>
            <th>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tavoli.map((tavolo) => {
            const chiave = `tavolo-${tavolo.id}`
            return (
              <tr key={tavolo.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{tavolo.id}</td>
                <td>
                  <input
                    type="text"
                    value={tavolo.nome}
                    onChange={(e) => aggiornaNomeTavolo(tavolo.id, e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => salvaTavolo(tavolo.id)}>
                    Salva
                  </button>{' '}
                  <span>{statoRiga[chiave]}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h2>Reset partita</h2>
      <p>Cancella tutte le scelte inviate e riporta la sessione al Round 1 (chiuso).</p>
      <button type="button" onClick={resetPartita} disabled={resetInCorso}>
        {resetInCorso ? 'Reset in corso...' : 'Reset partita'}
      </button>
    </div>
  )
}

export default Config
