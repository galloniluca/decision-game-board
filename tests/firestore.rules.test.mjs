// Test delle regole firestore.rules contro l'emulatore Firestore (serve Java).
// Si lancia con: npm run test:rules
import { after, before, beforeEach, describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { costruisciDocumento } from '../src/survey/documento.js'
import { tuttiIdDomande } from '../src/survey/scoring.js'

let env
let db

const valido = () =>
  costruisciDocumento({
    consenso: { privacy: true, benchmark_aggregato: true, contatto_bpr: false },
    anagrafica: {
      nome: 'Mario Rossi',
      azienda: 'ACME Srl',
      email: 'mario.rossi@acme.it',
      ruolo: 'Direttore operations',
      settore: 'Arredo e legno',
      dimensione: '51-250 dipendenti',
    },
    risposte: Object.fromEntries(tuttiIdDomande().map((id, i) => [id, (i % 5) + 1])),
  })

// Applica una modifica a una copia del documento valido.
function con(modifica) {
  const d = valido()
  modifica(d)
  return d
}

let n = 0
const nuovoRif = () => doc(db, 'survey_risposte', `r${++n}`)

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-survey-rules',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
  db = env.unauthenticatedContext().firestore()
})

beforeEach(async () => {
  await env.clearFirestore()
})

after(async () => {
  await env?.cleanup()
})

describe('game: comportamento invariato', () => {
  for (const nome of ['tavoli', 'opzioni', 'sessione', 'scelte']) {
    test(`${nome}: lettura, scrittura, modifica e cancellazione aperte`, async () => {
      const rif = doc(db, nome, 'x')
      await assertSucceeds(setDoc(rif, { a: 1 }))
      await assertSucceeds(getDoc(rif))
      await assertSucceeds(getDocs(collection(db, nome)))
      await assertSucceeds(updateDoc(rif, { a: 2 }))
      await assertSucceeds(deleteDoc(rif))
    })
  }

  test('altre collezioni restano chiuse', async () => {
    await assertFails(setDoc(doc(db, 'altro', 'x'), { a: 1 }))
    await assertFails(getDoc(doc(db, 'altro', 'x')))
  })
})

describe('survey_risposte: creazione', () => {
  test('documento completo costruito dal client: consentito', async () => {
    await assertSucceeds(setDoc(nuovoRif(), valido()))
  })

  test('contatto_bpr true: consentito', async () => {
    await assertSucceeds(setDoc(nuovoRif(), con((d) => (d.consenso.contatto_bpr = true))))
  })

  const rifiutati = {
    'campo in più': (d) => (d.extra = 'x'),
    'campo mancante (punteggi)': (d) => delete d.punteggi,
    'campagna vuota': (d) => (d.campagna = ''),
    'creato_at scritto dal client': (d) => (d.creato_at = new Date()),
    'privacy false': (d) => (d.consenso.privacy = false),
    'benchmark_aggregato false': (d) => (d.consenso.benchmark_aggregato = false),
    'contatto_bpr non booleano': (d) => (d.consenso.contatto_bpr = 'sì'),
    'versione_testo mancante': (d) => delete d.consenso.versione_testo,
    'consenso con campo in più': (d) => (d.consenso.altro = true),
    'nome vuoto': (d) => (d.anagrafica.nome = ''),
    'nome troppo lungo (201)': (d) => (d.anagrafica.nome = 'x'.repeat(201)),
    'azienda non stringa': (d) => (d.anagrafica.azienda = 12),
    'email non valida': (d) => (d.anagrafica.email = 'mario.acme.it'),
    'settore fuori elenco': (d) => (d.anagrafica.settore = 'Tessile'),
    'dimensione fuori elenco': (d) => (d.anagrafica.dimensione = '1000+'),
    'anagrafica con campo in più': (d) => (d.anagrafica.telefono = '123'),
    'risposta mancante (d7q3)': (d) => delete d.risposte.d7q3,
    'risposta in più (d8q1)': (d) => (d.risposte.d8q1 = 3),
    'risposta 0': (d) => (d.risposte.d1q1 = 0),
    'risposta 6': (d) => (d.risposte.d4q2 = 6),
    'risposta non intera (3.5)': (d) => (d.risposte.d2q2 = 3.5),
    'risposta stringa': (d) => (d.risposte.d3q3 = '3'),
    'punteggio oltre 100': (d) => (d.punteggi.totale = 101),
    'punteggio negativo': (d) => (d.punteggi.d1 = -1),
    'punteggi senza totale': (d) => delete d.punteggi.totale,
  }
  for (const [nome, modifica] of Object.entries(rifiutati)) {
    test(`rifiutato: ${nome}`, async () => {
      await assertFails(setDoc(nuovoRif(), con(modifica)))
    })
  }
})

describe('survey_risposte: nessuna lettura, modifica o cancellazione', () => {
  let rif
  beforeEach(async () => {
    rif = doc(db, 'survey_risposte', 'esistente')
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'survey_risposte', 'esistente'), { campagna: 'x' })
    )
  })

  test('lettura del singolo documento vietata', async () => {
    await assertFails(getDoc(rif))
  })

  test('lettura della collezione vietata', async () => {
    await assertFails(getDocs(collection(db, 'survey_risposte')))
    await assertFails(
      getDocs(query(collection(db, 'survey_risposte'), where('campagna', '==', 'x')))
    )
  })

  test('modifica vietata (anche riscrivendo lo stesso id con dati validi)', async () => {
    await assertFails(updateDoc(rif, { campagna: 'y' }))
    await assertFails(setDoc(rif, valido()))
  })

  test('cancellazione vietata', async () => {
    await assertFails(deleteDoc(rif))
  })
})
