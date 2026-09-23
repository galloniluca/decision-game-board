// Verifica che content.js e frasi.js corrispondano alla specifica. Si lancia con: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DIMENSIONI, ID_DOMANDE } from './content.js'
import FRASI from './frasi.js'
import { ID_DIMENSIONI, tuttiIdDomande } from './scoring.js'

// Estrae dimensioni, domande e ancore dalla sezione 3 di SURVEY_SPEC.md.
function leggiSpecifica() {
  const testo = readFileSync(new URL('../../SURVEY_SPEC.md', import.meta.url), 'utf8')
  const dimensioni = []
  let dim = null
  let domanda = null
  for (const riga of testo.split('\n')) {
    let m
    if ((m = riga.match(/^### Dimensione \d — (.+) \(`(d\d)`\)$/))) {
      dim = { id: m[2], titolo: m[1], domande: [] }
      dimensioni.push(dim)
      domanda = null
    } else if (dim && (m = riga.match(/^\*\*(d\dq\d) — (.+)\*\*$/))) {
      domanda = { id: m[1], titolo: m[2], ancore: [] }
      dim.domande.push(domanda)
    } else if (domanda && (m = riga.match(/^\d\. (.+)$/))) {
      domanda.ancore.push(m[1])
    } else if (riga.startsWith('### ') || riga.startsWith('## ')) {
      dim = riga.startsWith('### Dimensione') ? dim : null
      domanda = null
    }
  }
  return dimensioni
}

test('content.js trascrive fedelmente domande e ancore della specifica', () => {
  const spec = leggiSpecifica()
  assert.equal(spec.length, 7)
  const daContent = DIMENSIONI.map((d) => ({
    id: d.id,
    titolo: d.titolo,
    domande: d.domande.map((q) => ({ id: q.id, titolo: q.titolo, ancore: q.ancore })),
  }))
  assert.deepEqual(daContent, spec)
})

test('struttura: 7 dimensioni × 3 domande × 5 ancore, id allineati a scoring.js', () => {
  assert.deepEqual(DIMENSIONI.map((d) => d.id), ID_DIMENSIONI)
  assert.deepEqual(ID_DOMANDE, tuttiIdDomande())
  for (const d of DIMENSIONI) {
    assert.equal(d.domande.length, 3)
    for (const q of d.domande) assert.equal(q.ancore.length, 5)
  }
})

test('frasi.js: una frase per ogni dimensione e fascia', () => {
  for (const d of ID_DIMENSIONI) {
    for (let f = 1; f <= 5; f++) {
      assert.equal(typeof FRASI[d]?.[f], 'string', `${d} fascia ${f}`)
      assert.ok(FRASI[d][f].length > 0, `${d} fascia ${f}`)
    }
  }
})

test('messaggio finale identico alla specifica', async () => {
  const { MESSAGGIO_FINALE } = await import('./content.js')
  const testo = readFileSync(new URL('../../SURVEY_SPEC.md', import.meta.url), 'utf8')
  assert.ok(testo.includes(`esattamente: "${MESSAGGIO_FINALE}"`))
})
