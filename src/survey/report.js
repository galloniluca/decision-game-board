// Dati del report personale con benchmark (da salvare in PDF e inviare a mano).
// Modulo puro, coperto da report.test.js.
import { medie } from './risultati.js'
import { arrotonda, forzeEAttenzioni, livello } from './scoring.js'

// Sotto questa soglia il settore non si mostra: la media sarebbe poco significativa e, con
// pochissime risposte, permetterebbe di ricavare i punteggi degli altri partecipanti.
export const MIN_RISPOSTE_SETTORE_REPORT = 5

// `risposte` e `risposta` sono nel formato di preparaRisposte (con valida e punteggi).
// Le medie includono anche la persona stessa, come ogni altra risposta valida.
export function datiReport(risposta, risposte) {
  const valide = risposte.filter((r) => r.valida)
  const nomeSettore = risposta.anagrafica?.settore ?? ''
  const delSettore = valide.filter((r) => r.anagrafica?.settore === nomeSettore)
  const settoreMostrato = delSettore.length >= MIN_RISPOSTE_SETTORE_REPORT

  return {
    punteggi: risposta.punteggi,
    livello: livello(risposta.punteggi.totale),
    ...forzeEAttenzioni(risposta.punteggi),
    tutte: { n: valide.length, medie: medie(valide) },
    settore: {
      nome: nomeSettore,
      n: delSettore.length,
      medie: settoreMostrato ? medie(delSettore) : null,
    },
  }
}

// Differenza tra i valori mostrati (interi), così la colonna torna con le altre due.
export function scarto(valore, riferimento) {
  if (valore == null || riferimento == null) return null
  return arrotonda(valore) - arrotonda(riferimento)
}

// Nome del PDF: "Report BPR - Nome Cognome - Azienda.pdf", senza caratteri vietati nei nomi file.
export function nomeFileReport(risposta) {
  const a = risposta.anagrafica ?? {}
  const parti = ['Report BPR', a.nome, a.azienda]
    .map((p) => String(p ?? '').replace(/[\\/:*?"<>|]|\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().replace(/\.+$/, ''))
    .filter(Boolean)
  return `${parti.join(' - ').slice(0, 150)}.pdf`
}

// Nomi univoci dentro lo ZIP: a parità di nome si aggiunge " (2)", " (3)"...
export function nomiUnivoci(nomi) {
  const visti = new Map()
  return nomi.map((nome) => {
    const chiave = nome.toLowerCase()
    const n = (visti.get(chiave) ?? 0) + 1
    visti.set(chiave, n)
    return n === 1 ? nome : nome.replace(/\.pdf$/, ` (${n}).pdf`)
  })
}

function cellaCsv(valore) {
  const s = String(valore ?? '')
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Elenco per l'invio: a chi mandare quale file (CSV per Excel italiano, separatore ';').
export function elencoInvii(righe) {
  const intestazione = ['nome', 'azienda', 'email', 'contatto_bpr', 'file']
  const corpo = righe.map(({ risposta, file }) => {
    const a = risposta.anagrafica ?? {}
    return [a.nome, a.azienda, a.email, risposta.consenso?.contatto_bpr ? 'sì' : 'no', file]
  })
  return '﻿' + [intestazione, ...corpo].map((r) => r.map(cellaCsv).join(';')).join('\r\n') + '\r\n'
}
