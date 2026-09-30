import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONFIG_AZIENDE_VUOTA,
  chiaveAzienda,
  mappaAziende,
  possibiliDoppioni,
  raggruppaAziende,
  rinomina,
  risolvi,
  segnaDistinte,
  separa,
  somiglianza,
  unisci,
} from './aziende.js'

const r = (id, azienda) => ({ id, anagrafica: { azienda } })

test('chiaveAzienda ignora maiuscole, accenti, punteggiatura e forme societarie', () => {
  const stessa = ['Rossi S.p.A.', 'ROSSI SPA', 'rossi s.p.a', '  Rossi   S. p. A. ', 'Rossi spa.', 'Rossi', 'Rossi Srl', 'Rossi & C. snc', 'Rossi Group']
  for (const n of stessa) assert.equal(chiaveAzienda(n), 'rossi', n)
  assert.equal(chiaveAzienda('Caffè Nero S.r.l.'), 'caffe nero')
  assert.equal(chiaveAzienda('Nuova Simonelli'), 'nuova simonelli')
  assert.equal(chiaveAzienda('A.B.C. Meccanica'), 'abc meccanica')
  assert.equal(chiaveAzienda('Group'), 'group')
  assert.equal(chiaveAzienda('   '), '')
})

test('raggruppaAziende: varianti automatiche nello stesso gruppo, nome più frequente', () => {
  const gruppi = raggruppaAziende([r('1', 'Rossi SpA'), r('2', 'ROSSI S.P.A.'), r('3', 'Rossi SpA'), r('4', 'Bianchi srl')])
  assert.equal(gruppi.length, 2)
  const rossi = gruppi.find((g) => g.chiave === 'rossi')
  assert.equal(rossi.nome, 'Rossi SpA')
  assert.equal(rossi.n, 3)
  assert.deepEqual(rossi.varianti, [{ testo: 'Rossi SpA', n: 2 }, { testo: 'ROSSI S.P.A.', n: 1 }])
  assert.equal(rossi.unioneManuale, false)
  assert.deepEqual(mappaAziende(gruppi).get('4'), { chiave: 'bianchi', nome: 'Bianchi srl' })
})

test('unione manuale, nome scelto e annullamento', () => {
  const risposte = [r('1', 'Simonelli Group'), r('2', 'Nuova Simonelli'), r('3', 'Simonelli')]
  let config = unisci(CONFIG_AZIENDE_VUOTA, ['nuova simonelli', 'simonelli'], 'simonelli', 'Simonelli Group')
  let gruppi = raggruppaAziende(risposte, config)
  assert.equal(gruppi.length, 1)
  assert.equal(gruppi[0].nome, 'Simonelli Group')
  assert.equal(gruppi[0].unioneManuale, true)
  config = separa(config, 'simonelli')
  gruppi = raggruppaAziende(risposte, config)
  assert.equal(gruppi.length, 2)
})

test('unioni a catena ripuntate e cicli senza blocco', () => {
  let config = unisci(CONFIG_AZIENDE_VUOTA, ['a', 'b'], 'b')
  config = unisci(config, ['b', 'c'], 'c')
  assert.equal(risolvi('a', config.unioni), 'c')
  assert.deepEqual(config.unioni, { a: 'c', b: 'c' })
  assert.equal(risolvi('x', { x: 'y', y: 'x' }), 'y')
})

test('possibiliDoppioni: simili o contenute, escluse quelle segnate diverse', () => {
  const gruppi = raggruppaAziende([r('1', 'Simonelli Group'), r('2', 'Nuova Simonelli'), r('3', 'Meccanica Rossi'), r('4', 'Mecanica Rossi'), r('5', 'Bianchi')])
  const coppie = possibiliDoppioni(gruppi).map((c) => [c.a.chiave, c.b.chiave].sort().join('+'))
  assert.ok(coppie.includes('mecanica rossi+meccanica rossi'))
  assert.ok(coppie.includes('nuova simonelli+simonelli'))
  assert.ok(!coppie.some((c) => c.includes('bianchi')))
  const config = segnaDistinte(CONFIG_AZIENDE_VUOTA, 'simonelli', 'nuova simonelli')
  assert.ok(!possibiliDoppioni(gruppi, config).some((c) => c.a.chiave.includes('simonelli')))
})

test('somiglianza e rinomina', () => {
  assert.equal(somiglianza('rossi', 'rossi'), 1)
  assert.ok(somiglianza('meccanica rossi', 'mecanica rossi') > 0.9)
  assert.ok(somiglianza('rossi', 'bianchi') < 0.3)
  assert.deepEqual(rinomina(CONFIG_AZIENDE_VUOTA, 'k', ' Nome ').nomi, { k: 'Nome' })
  assert.deepEqual(rinomina({ ...CONFIG_AZIENDE_VUOTA, nomi: { k: 'X' } }, 'k', '').nomi, {})
})
