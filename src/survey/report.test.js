import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MIN_RISPOSTE_SETTORE_REPORT, datiReport, elencoInvii, nomeFileReport, nomiUnivoci, scarto } from './report.js'
import { preparaRisposte } from './risultati.js'
import { tuttiIdDomande } from './scoring.js'

const tutte = (v) => Object.fromEntries(tuttiIdDomande().map((id) => [id, v]))

function risposta(id, settore, valore) {
  return { id, anagrafica: { nome: id, settore }, risposte: tutte(valore) }
}

function gruppo(settore, n, valore, prefisso) {
  return Array.from({ length: n }, (_, i) => risposta(`${prefisso}${i}`, settore, valore))
}

test('settore sotto soglia: niente media di settore, ma numero di risposte noto', () => {
  const lista = preparaRisposte([
    ...gruppo('Arredo e legno', MIN_RISPOSTE_SETTORE_REPORT - 1, 5, 'a'),
    ...gruppo('Altro', 3, 1, 'b'),
  ])
  const dati = datiReport(lista[0], lista)
  assert.equal(dati.settore.medie, null)
  assert.equal(dati.settore.n, MIN_RISPOSTE_SETTORE_REPORT - 1)
  assert.equal(dati.tutte.n, MIN_RISPOSTE_SETTORE_REPORT + 2)
})

test('settore a soglia: media del settore inclusa la persona, media di tutte le aziende', () => {
  const lista = preparaRisposte([
    ...gruppo('Arredo e legno', MIN_RISPOSTE_SETTORE_REPORT, 5, 'a'),
    ...gruppo('Altro', MIN_RISPOSTE_SETTORE_REPORT, 1, 'b'),
  ])
  const dati = datiReport(lista[0], lista)
  assert.equal(dati.settore.medie.totale, 100)
  assert.equal(dati.tutte.medie.totale, 50)
  assert.equal(dati.livello.nome, 'Eccellente')
})

test('le risposte incomplete non contano né nel settore né in tutte', () => {
  const incompleta = risposta('x', 'Arredo e legno', 1)
  delete incompleta.risposte.d1q1
  const lista = preparaRisposte([...gruppo('Arredo e legno', MIN_RISPOSTE_SETTORE_REPORT, 5, 'a'), incompleta])
  const dati = datiReport(lista[0], lista)
  assert.equal(dati.tutte.n, MIN_RISPOSTE_SETTORE_REPORT)
  assert.equal(dati.settore.medie.totale, 100)
})

test('forze e attenzioni non si sovrappongono', () => {
  const [r] = preparaRisposte([risposta('a', 'Altro', 3)])
  const dati = datiReport(r, [r])
  assert.equal(dati.forze.length, 2)
  assert.equal(dati.attenzioni.length, 2)
  assert.ok(dati.forze.every((id) => !dati.attenzioni.includes(id)))
})

test('scarto calcolato sui valori interi mostrati', () => {
  assert.equal(scarto(58.4, 52.6), 5)
  assert.equal(scarto(40, 47), -7)
  assert.equal(scarto(40, null), null)
})

test('nome file del report pulito dai caratteri vietati', () => {
  const r = { anagrafica: { nome: 'Anna  Rossi', azienda: 'A/B: "Srl"' } }
  assert.equal(nomeFileReport(r), 'Report BPR - Anna Rossi - A B Srl.pdf')
  assert.equal(nomeFileReport({ anagrafica: { nome: 'Anna' } }), 'Report BPR - Anna.pdf')
  assert.equal(nomeFileReport({ anagrafica: { nome: 'Anna', azienda: 'Rossi S.p.A.' } }), 'Report BPR - Anna - Rossi S.p.A.pdf')
})

test('nomi duplicati resi univoci', () => {
  assert.deepEqual(nomiUnivoci(['a.pdf', 'b.pdf', 'A.pdf', 'a.pdf']), ['a.pdf', 'b.pdf', 'A (2).pdf', 'a (3).pdf'])
})

test('elenco invii con email e file', () => {
  const csv = elencoInvii([
    { risposta: { anagrafica: { nome: 'Anna', azienda: 'X;Y', email: 'a@x.it' }, consenso: { contatto_bpr: true } }, file: 'f.pdf' },
  ])
  assert.equal(csv, '﻿nome;azienda;email;contatto_bpr;file\r\nAnna;"X;Y";a@x.it;sì;f.pdf\r\n')
})
