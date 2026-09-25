import { test } from 'node:test'
import assert from 'node:assert/strict'
import { benchmarkPer, conteggioPer, creaCsv, creaJson, medie, preparaRisposte, COLONNE_CSV } from './risultati.js'
import { tuttiIdDomande } from './scoring.js'

const tutte = (v) => Object.fromEntries(tuttiIdDomande().map((id) => [id, v]))

function risposta(id, settore, valore, extra = {}) {
  return {
    id,
    creato_at: '2026-09-29T10:00:00.000Z',
    anagrafica: { nome: `Persona ${id}`, azienda: 'ACME', email: `${id}@a.it`, ruolo: 'COO', settore, dimensione: 'Fino a 50 dipendenti' },
    consenso: { privacy: true, benchmark_aggregato: true, contatto_bpr: false, versione_testo: 'v1' },
    risposte: tutte(valore),
    ...extra,
  }
}

const SETTORI = ['Arredo e legno', 'Altro', 'Servizi e consulenza']

test('preparaRisposte ricalcola i punteggi e ignora quelli salvati', () => {
  const [r] = preparaRisposte([{ ...risposta('a', 'Altro', 5), punteggi: { totale: 3 } }])
  assert.equal(r.valida, true)
  assert.equal(r.punteggi.totale, 100)
})

test('risposte incomplete: non valide, escluse dalle medie', () => {
  const incompleta = risposta('x', 'Altro', 3)
  delete incompleta.risposte.d7q3
  const lista = preparaRisposte([incompleta, risposta('a', 'Altro', 5)])
  assert.equal(lista[0].valida, false)
  assert.equal(lista[0].punteggi, null)
  assert.equal(medie(lista).totale, 100)
})

test('medie su tutte le aziende, null se nessuna risposta', () => {
  const lista = preparaRisposte([risposta('a', 'Altro', 1), risposta('b', 'Altro', 5), risposta('c', 'Arredo e legno', 3)])
  const m = medie(lista)
  assert.equal(m.totale, 50)
  assert.equal(m.d4, 50)
  assert.equal(medie([]), null)
})

test('conteggio e benchmark per settore, compresi i settori senza risposte', () => {
  const lista = preparaRisposte([risposta('a', 'Altro', 1), risposta('b', 'Altro', 5), risposta('c', 'Arredo e legno', 3)])
  assert.deepEqual(conteggioPer(lista, 'settore', SETTORI), [
    { valore: 'Arredo e legno', n: 1 },
    { valore: 'Altro', n: 2 },
    { valore: 'Servizi e consulenza', n: 0 },
  ])
  const b = benchmarkPer(lista, 'settore', SETTORI)
  assert.equal(b[1].n, 2)
  assert.equal(b[1].medie.totale, 50)
  assert.equal(b[0].medie.totale, 50)
  assert.equal(b[2].medie, null)
})

test('CSV: BOM, separatore ;, intestazione, escape di ; e virgolette', () => {
  const r = risposta('a', 'Altro', 3)
  r.anagrafica.azienda = 'Rossi; Bianchi "Srl"'
  const csv = creaCsv(preparaRisposte([r]))
  assert.ok(csv.startsWith('﻿id;creato_at;nome;'))
  const [intestazione, riga] = csv.slice(1).trim().split('\r\n')
  assert.equal(intestazione.split(';').length, COLONNE_CSV.length)
  assert.ok(riga.includes('"Rossi; Bianchi ""Srl"""'))
  assert.ok(riga.includes(';50;Strutturato;'))
})

test('JSON: punteggi ricalcolati e date ISO', () => {
  const dati = JSON.parse(creaJson(preparaRisposte([risposta('a', 'Altro', 5)]), 'camp'))
  assert.equal(dati.campagna, 'camp')
  assert.equal(dati.numero_risposte, 1)
  assert.equal(dati.documenti[0].punteggi_ricalcolati.totale, 100)
  assert.equal(dati.documenti[0].creato_at, '2026-09-29T10:00:00.000Z')
  assert.equal('valida' in dati.documenti[0], false)
})
