// Supporto al test manuale dello script di export sull'emulatore: scrive 3 risposte
// (2 della campagna indicata, 1 di un'altra) passando dalle regole, come farebbe il browser.
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { costruisciDocumento } from '../src/survey/documento.js'
import { tuttiIdDomande } from '../src/survey/scoring.js'

const env = await initializeTestEnvironment({
  projectId: process.env.GCLOUD_PROJECT,
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
})
const db = env.unauthenticatedContext().firestore()
const risposta = (settore, v) =>
  costruisciDocumento({
    consenso: { privacy: true, benchmark_aggregato: true, contatto_bpr: v > 2 },
    anagrafica: { nome: 'Test', azienda: 'ACME', email: 't@acme.it', ruolo: 'COO', settore, dimensione: 'Fino a 50 dipendenti' },
    risposte: Object.fromEntries(tuttiIdDomande().map((id) => [id, v])),
  })
await setDoc(doc(db, 'survey_risposte', 'a'), risposta('Arredo e legno', 2))
await setDoc(doc(db, 'survey_risposte', 'b'), risposta('Altro', 4))
const altra = risposta('Altro', 3)
await env.withSecurityRulesDisabled((ctx) =>
  setDoc(doc(ctx.firestore(), 'survey_risposte', 'c'), { ...altra, campagna: 'altra-campagna', creato_at: new Date() })
)
await env.cleanup()
