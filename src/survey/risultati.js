// Elaborazione delle risposte per la pagina riservata /survey-risultati:
// punteggi ricalcolati, conteggi, medie di benchmark ed export CSV.
// Modulo puro (niente React/Firebase), coperto da risultati.test.js.
import { ID_DIMENSIONI, arrotonda, calcolaPunteggi, livello, risposteComplete, tuttiIdDomande } from './scoring.js'

// Aggiunge a ogni documento i punteggi ricalcolati dalle risposte (quelli salvati dal client
// sono solo di comodo). I documenti con risposte incomplete restano fuori dalle medie.
export function preparaRisposte(documenti) {
  return documenti.map((d) => {
    const valida = risposteComplete(d.risposte)
    return { ...d, valida, punteggi: valida ? calcolaPunteggi(d.risposte) : null }
  })
}

// Media non arrotondata di d1..d7 e totale su un insieme di risposte valide; null se vuoto.
export function medie(risposte) {
  const valide = risposte.filter((r) => r.valida)
  if (valide.length === 0) return null
  const chiavi = [...ID_DIMENSIONI, 'totale']
  const somma = Object.fromEntries(chiavi.map((k) => [k, 0]))
  for (const r of valide) for (const k of chiavi) somma[k] += r.punteggi[k]
  return Object.fromEntries(chiavi.map((k) => [k, somma[k] / valide.length]))
}

// Conteggio per valore di un campo dell'anagrafica, nell'ordine dei valori ammessi
// (quelli a zero compresi), più eventuali valori imprevisti in coda.
export function conteggioPer(risposte, campo, valoriAmmessi) {
  const conteggi = new Map(valoriAmmessi.map((v) => [v, 0]))
  for (const r of risposte) {
    const v = r.anagrafica?.[campo] ?? '(mancante)'
    conteggi.set(v, (conteggi.get(v) ?? 0) + 1)
  }
  return [...conteggi].map(([valore, n]) => ({ valore, n }))
}

// Benchmark: media di tutte le aziende e media per ciascun valore del campo (es. settore).
export function benchmarkPer(risposte, campo, valoriAmmessi) {
  return valoriAmmessi.map((valore) => {
    const gruppo = risposte.filter((r) => r.valida && r.anagrafica?.[campo] === valore)
    return { valore, n: gruppo.length, medie: medie(gruppo) }
  })
}

function dataIso(valore) {
  if (!valore) return ''
  if (typeof valore === 'string') return valore
  if (typeof valore.toDate === 'function') return valore.toDate().toISOString()
  if (valore instanceof Date) return valore.toISOString()
  return ''
}

// Cella CSV: separatore ';' (Excel in italiano), virgolette se servono.
function cella(valore) {
  const s = valore === null || valore === undefined ? '' : String(valore)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const COLONNE_CSV = [
  'id',
  'creato_at',
  'nome',
  'azienda',
  'email',
  'ruolo',
  'settore',
  'dimensione',
  'consenso_privacy',
  'consenso_benchmark',
  'consenso_contatto_bpr',
  'versione_testo',
  ...ID_DIMENSIONI.map((d) => `${d}_pct`),
  'totale_pct',
  'livello',
  ...tuttiIdDomande(),
]

// CSV con BOM (Excel riconosce l'UTF-8) e percentuali intere, come mostrate a video.
export function creaCsv(risposte) {
  const righe = risposte.map((r) => {
    const a = r.anagrafica ?? {}
    const c = r.consenso ?? {}
    const p = r.punteggi
    return [
      r.id,
      dataIso(r.creato_at),
      a.nome,
      a.azienda,
      a.email,
      a.ruolo,
      a.settore,
      a.dimensione,
      c.privacy ? 'sì' : 'no',
      c.benchmark_aggregato ? 'sì' : 'no',
      c.contatto_bpr ? 'sì' : 'no',
      c.versione_testo,
      ...ID_DIMENSIONI.map((d) => (p ? arrotonda(p[d]) : '')),
      p ? arrotonda(p.totale) : '',
      p ? livello(p.totale).nome : 'risposte incomplete',
      ...tuttiIdDomande().map((id) => r.risposte?.[id] ?? ''),
    ]
  })
  return '﻿' + [COLONNE_CSV, ...righe].map((riga) => riga.map(cella).join(';')).join('\r\n') + '\r\n'
}

// JSON leggibile, con i timestamp in ISO (stesso formato dello script di export).
export function creaJson(risposte, campagna) {
  const documenti = risposte.map(({ valida: _v, punteggi, ...resto }) => ({
    ...resto,
    creato_at: dataIso(resto.creato_at),
    punteggi_ricalcolati: punteggi,
  }))
  return JSON.stringify(
    { campagna, esportato_at: new Date().toISOString(), numero_risposte: documenti.length, documenti },
    null,
    2
  )
}
