import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  benchmarkPer,
  conteggioPer,
  creaCsv,
  creaJson,
  elencoCampagne,
  filtraRisposte,
  filtriAttivi,
  FILTRI_VUOTI,
  medie,
  periodoRapido,
  preparaRisposte,
  COLONNE_CSV,
} from './risultati.js'
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

test('filtraRisposte: campagna, settore, dimensione e testo', () => {
  const lista = [
    risposta('a', 'Altro', 3, { campagna: 'c1' }),
    risposta('b', 'Arredo e legno', 3, { campagna: 'c1', anagrafica: { nome: 'Bruno Verdi', azienda: 'Legni Spa', settore: 'Arredo e legno', dimensione: '51-250 dipendenti' } }),
    risposta('c', 'Altro', 3, { campagna: 'c2' }),
  ]
  const ids = (f) => filtraRisposte(lista, { ...FILTRI_VUOTI, ...f }).map((r) => r.id)
  assert.deepEqual(ids({}), ['a', 'b', 'c'])
  assert.deepEqual(ids({ campagna: 'c1' }), ['a', 'b'])
  assert.deepEqual(ids({ settore: 'Altro' }), ['a', 'c'])
  assert.deepEqual(ids({ dimensione: '51-250 dipendenti' }), ['b'])
  assert.deepEqual(ids({ testo: '  legni ' }), ['b'])
})

test('filtraRisposte: periodo con estremi inclusi, in ora locale', () => {
  const alle = (id, ...data) => risposta(id, 'Altro', 3, { creato_at: new Date(...data).toISOString() })
  const lista = [alle('prima', 2026, 8, 28, 23, 59), alle('inizio', 2026, 8, 29, 0, 0), alle('fine', 2026, 8, 30, 23, 59), alle('dopo', 2026, 9, 1, 0, 0), { ...alle('senza', 2026, 8, 29), creato_at: null }]
  const ids = (f) => filtraRisposte(lista, { ...FILTRI_VUOTI, ...f }).map((r) => r.id)
  assert.deepEqual(ids({ da: '2026-09-29', a: '2026-09-30' }), ['inizio', 'fine'])
  assert.deepEqual(ids({ da: '2026-09-30' }), ['fine', 'dopo'])
  assert.deepEqual(ids({}).length, 5)
})

test('periodoRapido e filtriAttivi', () => {
  assert.deepEqual(periodoRapido(365, new Date(2026, 8, 30)), { da: '2025-10-01', a: '2026-09-30' })
  assert.deepEqual(periodoRapido(1, new Date(2026, 8, 30)), { da: '2026-09-30', a: '2026-09-30' })
  assert.equal(filtriAttivi(FILTRI_VUOTI), false)
  assert.equal(filtriAttivi({ ...FILTRI_VUOTI, settore: 'Altro' }), true)
})

test('elencoCampagne dalla più recente', () => {
  const lista = [
    risposta('a', 'Altro', 3, { campagna: 'vecchia', creato_at: '2025-05-01T10:00:00Z' }),
    risposta('b', 'Altro', 3, { campagna: 'nuova', creato_at: '2026-09-29T10:00:00Z' }),
    risposta('c', 'Altro', 3, { campagna: 'vecchia', creato_at: '2025-05-02T10:00:00Z' }),
  ]
  assert.deepEqual(elencoCampagne(lista), ['nuova', 'vecchia'])
})
