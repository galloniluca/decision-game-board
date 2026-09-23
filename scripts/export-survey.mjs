// Export delle risposte del survey per il report (SURVEY_SPEC.md, sezione 8).
// Da lanciare a mano:
//
//   GOOGLE_APPLICATION_CREDENTIALS=/percorso/service-account.json \
//     node scripts/export-survey.mjs 2026-09-29-belforte
//
// Usa l'Admin SDK, che non passa dalle regole di sicurezza. Scrive survey_export.json nella
// cartella corrente: contiene dati personali, non va committato né condiviso (è in .gitignore).
import { writeFileSync } from 'node:fs'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { calcolaPunteggi, risposteComplete } from '../src/survey/scoring.js'

const COLLEZIONE = 'survey_risposte'
const FILE_USCITA = 'survey_export.json'

const campagna = process.argv[2]
if (!campagna) {
  console.error('Uso: node scripts/export-survey.mjs <campagna>   (es. 2026-09-29-belforte)')
  process.exit(1)
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    'Manca GOOGLE_APPLICATION_CREDENTIALS: indica il percorso del file JSON del service account.'
  )
  process.exit(1)
}

// Converte ricorsivamente i Timestamp Firestore in stringhe ISO.
function inChiaro(valore) {
  if (valore instanceof Timestamp) return valore.toDate().toISOString()
  if (Array.isArray(valore)) return valore.map(inChiaro)
  if (valore && typeof valore === 'object') {
    return Object.fromEntries(Object.entries(valore).map(([k, v]) => [k, inChiaro(v)]))
  }
  return valore
}

// Con FIRESTORE_EMULATOR_HOST (solo per i test) non servono credenziali.
const app = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp({ credential: applicationDefault() })
  : initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-survey' })
const db = getFirestore(app)

const snap = await db.collection(COLLEZIONE).where('campagna', '==', campagna).get()
const documenti = snap.docs
  .map((d) => ({ id: d.id, ...inChiaro(d.data()) }))
  .sort((a, b) => String(a.creato_at).localeCompare(String(b.creato_at)))

writeFileSync(
  FILE_USCITA,
  JSON.stringify(
    {
      campagna,
      esportato_at: new Date().toISOString(),
      numero_risposte: documenti.length,
      documenti,
    },
    null,
    2
  ) + '\n'
)

// Riepilogo
const perSettore = {}
for (const d of documenti) {
  const settore = d.anagrafica?.settore ?? '(mancante)'
  perSettore[settore] = (perSettore[settore] ?? 0) + 1
}

console.log(`Campagna: ${campagna}`)
console.log(`Risposte: ${documenti.length}`)
console.log('Per settore:')
for (const [settore, n] of Object.entries(perSettore).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${settore}`)
}

// Controllo di coerenza: i punteggi salvati dal client devono coincidere con quelli
// ricalcolati dalle risposte (il report userà comunque quelli ricalcolati).
const incoerenti = documenti.filter((d) => {
  if (!risposteComplete(d.risposte)) return true
  const ricalcolati = calcolaPunteggi(d.risposte)
  return Object.keys(ricalcolati).some((k) => Math.abs(ricalcolati[k] - d.punteggi?.[k]) > 1e-9)
})
if (incoerenti.length) {
  console.warn(`Attenzione: ${incoerenti.length} documenti con punteggi incoerenti o risposte incomplete:`)
  for (const d of incoerenti) console.warn(`  ${d.id}`)
}

console.log(`Scritto ${FILE_USCITA} (contiene dati personali: non committarlo né condividerlo).`)
