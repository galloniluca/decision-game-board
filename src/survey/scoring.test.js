// Test unitari di scoring.js. Si lanciano con: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ID_DIMENSIONI,
  arrotonda,
  calcolaPunteggi,
  forzeEAttenzioni,
  livello,
  punteggioDimensione,
  risposteComplete,
  tuttiIdDomande,
} from './scoring.js'

// Tutte le 21 risposte allo stesso valore.
function tutte(valore) {
  return Object.fromEntries(tuttiIdDomande().map((id) => [id, valore]))
}

// Risposte con somma complessiva data: parte da tutte 1 e alza una domanda alla volta.
function conSomma(somma) {
  const r = tutte(1)
  let resto = somma - 21
  for (const id of tuttiIdDomande()) {
    const aumento = Math.min(4, resto)
    r[id] += aumento
    resto -= aumento
  }
  assert.equal(resto, 0)
  return r
}

// Risposte con le 3 domande di ogni dimensione al valore indicato.
function perDimensione(valori) {
  const r = {}
  ID_DIMENSIONI.forEach((d, i) => {
    for (let q = 1; q <= 3; q++) r[`${d}q${q}`] = valori[i]
  })
  return r
}

test('21 domande, da d1q1 a d7q3', () => {
  const ids = tuttiIdDomande()
  assert.equal(ids.length, 21)
  assert.equal(ids[0], 'd1q1')
  assert.equal(ids[20], 'd7q3')
})

test('tutte le risposte a 1 → 0%, Iniziale', () => {
  const p = calcolaPunteggi(tutte(1))
  for (const d of ID_DIMENSIONI) assert.equal(p[d], 0)
  assert.equal(p.totale, 0)
  assert.equal(livello(p.totale).nome, 'Iniziale')
  assert.equal(livello(p.d1).fascia, 1)
})

test('tutte le risposte a 5 → 100%, Eccellente', () => {
  const p = calcolaPunteggi(tutte(5))
  for (const d of ID_DIMENSIONI) assert.equal(p[d], 100)
  assert.equal(p.totale, 100)
  assert.equal(livello(p.totale).nome, 'Eccellente')
  assert.equal(livello(p.d7).fascia, 5)
})

test('tutte le risposte a 3 → 50%, Strutturato', () => {
  const p = calcolaPunteggi(tutte(3))
  assert.equal(p.totale, 50)
  assert.equal(livello(p.totale).nome, 'Strutturato')
})

test('punteggio dimensione: media delle 3 risposte, (media-1)/4*100, non arrotondato', () => {
  const r = { ...tutte(1), d1q1: 2, d1q2: 1, d1q3: 1 }
  // media 4/3 → 8,333...%
  assert.equal(punteggioDimensione(r, 'd1'), ((4 / 3 - 1) / 4) * 100)
  assert.equal(arrotonda(punteggioDimensione(r, 'd1')), 8)
  // media 2 → 25%
  assert.equal(punteggioDimensione({ ...r, d1q1: 2, d1q2: 2, d1q3: 2 }, 'd1'), 25)
})

test('totale: media dei 7 punteggi non arrotondati', () => {
  const p = calcolaPunteggi(perDimensione([1, 2, 3, 4, 5, 1, 1]))
  // 0, 25, 50, 75, 100, 0, 0 → 250/7 = 35,714...
  assert.equal(p.totale, 250 / 7)
  assert.equal(arrotonda(p.totale), 36)
  assert.equal(livello(p.totale).nome, 'Emergente')
})

test('confini delle fasce sul valore arrotondato', () => {
  const casi = [
    [0, 1],
    [20, 1],
    [20.49, 1],
    [20.5, 2],
    [21, 2],
    [40, 2],
    [40.49, 2],
    [40.5, 3],
    [41, 3],
    [60, 3],
    [60.49, 3],
    [60.5, 4],
    [61, 4],
    [80, 4],
    [80.49, 4],
    [80.5, 5],
    [81, 5],
    [100, 5],
  ]
  for (const [pct, fascia] of casi) {
    assert.equal(livello(pct).fascia, fascia, `${pct}% → fascia ${fascia}`)
  }
  assert.deepEqual(
    [10, 30, 50, 70, 90].map((p) => livello(p).nome),
    ['Iniziale', 'Emergente', 'Strutturato', 'Consolidato', 'Eccellente']
  )
})

test('confini 20/21, 40/41, 60/61, 80/81 raggiunti da risposte reali', () => {
  // Con somma S delle 21 risposte il totale è (S-21)/84*100.
  const casi = [
    [38, 20, 'Iniziale'], // 20,24%
    [39, 21, 'Emergente'], // 21,43%
    [55, 40, 'Emergente'], // 40,48%
    [56, 42, 'Strutturato'], // 41,67%
    [71, 60, 'Strutturato'], // 59,52%
    [72, 61, 'Consolidato'], // 60,71%
    [88, 80, 'Consolidato'], // 79,76%
    [89, 81, 'Eccellente'], // 80,95%
  ]
  for (const [somma, atteso, nome] of casi) {
    const p = calcolaPunteggi(conSomma(somma))
    assert.equal(arrotonda(p.totale), atteso, `somma ${somma}`)
    assert.equal(livello(p.totale).nome, nome, `somma ${somma}`)
  }
})

test('fascia di dimensione calcolata sul valore arrotondato', () => {
  const r = { ...tutte(1), d2q1: 2, d2q2: 2, d2q3: 2 }
  r.d2q3 = 1 // somma 5, media 5/3 → 16,67% → fascia 1
  assert.equal(livello(punteggioDimensione(r, 'd2')).fascia, 1)
  r.d2q3 = 2 // media 2 → 25% → fascia 2
  assert.equal(livello(punteggioDimensione(r, 'd2')).fascia, 2)
  // somma 8 → media 2,67 → 41,67% → 42 → fascia 3
  const r2 = { ...tutte(1), d3q1: 3, d3q2: 3, d3q3: 2 }
  assert.equal(arrotonda(punteggioDimensione(r2, 'd3')), 42)
  assert.equal(livello(punteggioDimensione(r2, 'd3')).fascia, 3)
})

test('forze e attenzioni senza pari merito', () => {
  const p = calcolaPunteggi(perDimensione([3, 5, 1, 4, 2, 3, 3]))
  const { forze, attenzioni } = forzeEAttenzioni(p)
  assert.deepEqual(forze, ['d2', 'd4'])
  assert.deepEqual(attenzioni, ['d3', 'd5'])
})

test('pari merito: vince l\'ordine d1...d7', () => {
  // Tre dimensioni al massimo (d3, d5, d6): passano d3 e d5.
  // Tre al minimo (d2, d4, d7): passano d2 e d4.
  const p = calcolaPunteggi(perDimensione([3, 1, 5, 1, 5, 5, 1]))
  const { forze, attenzioni } = forzeEAttenzioni(p)
  assert.deepEqual(forze, ['d3', 'd5'])
  assert.deepEqual(attenzioni, ['d2', 'd4'])
})

test('tutte le dimensioni a pari merito: liste distinte (d1,d2 forza; d3,d4 attenzione)', () => {
  const { forze, attenzioni } = forzeEAttenzioni(calcolaPunteggi(tutte(3)))
  assert.deepEqual(forze, ['d1', 'd2'])
  assert.deepEqual(attenzioni, ['d3', 'd4'])
})

test('pari merito deciso sul valore non arrotondato', () => {
  // d1: media 4/3 → 8,33%; d2: media 5/3 → 16,67%. Il resto a 100.
  const r = perDimensione([5, 5, 5, 5, 5, 5, 5])
  Object.assign(r, { d1q1: 2, d1q2: 1, d1q3: 1, d2q1: 2, d2q2: 2, d2q3: 1 })
  const { attenzioni } = forzeEAttenzioni(calcolaPunteggi(r))
  assert.deepEqual(attenzioni, ['d1', 'd2'])
})

test('risposteComplete', () => {
  assert.equal(risposteComplete(tutte(3)), true)
  const manca = tutte(3)
  delete manca.d7q3
  assert.equal(risposteComplete(manca), false)
  assert.equal(risposteComplete({ ...tutte(3), d4q2: 6 }), false)
  assert.equal(risposteComplete({ ...tutte(3), d4q2: '3' }), false)
  assert.equal(risposteComplete(null), false)
})

test('punteggioDimensione rifiuta risposte mancanti', () => {
  assert.throws(() => punteggioDimensione({}, 'd1'))
})
