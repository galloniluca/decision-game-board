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
  'azienda_raggruppata',
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
      r.aziendaNome ?? a.azienda,
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
  const documenti = risposte.map(({ valida: _v, punteggi, aziendaChiave: _k, aziendaNome, ...resto }) => ({
    ...resto,
    azienda_raggruppata: aziendaNome ?? resto.anagrafica?.azienda,
    creato_at: dataIso(resto.creato_at),
    punteggi_ricalcolati: punteggi,
  }))
  return JSON.stringify(
    { campagna, esportato_at: new Date().toISOString(), numero_risposte: documenti.length, documenti },
    null,
    2
  )
}

// ---- Filtri della pagina riservata (campagna, periodo, settore, dimensione, testo) ----

export const FILTRI_VUOTI = { campagna: '', da: '', a: '', settore: '', dimensione: '', azienda: '', testo: '' }

export function millisecondi(valore) {
  if (!valore) return null
  if (typeof valore.toMillis === 'function') return valore.toMillis()
  const t = new Date(valore).getTime()
  return Number.isNaN(t) ? null : t
}

// 'AAAA-MM-GG' in ora locale: inizio del giorno (fine = inizio del giorno dopo).
function inizioGiorno(testo) {
  const [a, m, g] = String(testo).split('-').map(Number)
  if (!a || !m || !g) return null
  return new Date(a, m - 1, g).getTime()
}

export function dataInput(d) {
  const due = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`
}

// Scorciatoie di periodo: restituiscono le date da/a da mettere nei filtri.
export function periodoRapido(giorni, oggi = new Date()) {
  const da = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - giorni + 1)
  return { da: dataInput(da), a: dataInput(oggi) }
}

export function filtriAttivi(filtri) {
  return Object.values(filtri).some((v) => String(v ?? '').trim() !== '')
}

// Le risposte senza data (timestamp non ancora arrivato) passano solo se il periodo è libero.
export function filtraRisposte(risposte, filtri) {
  const da = filtri.da ? inizioGiorno(filtri.da) : null
  const aInizio = filtri.a ? inizioGiorno(filtri.a) : null
  const a = aInizio === null ? null : aInizio + 24 * 60 * 60 * 1000
  const testo = String(filtri.testo ?? '').trim().toLowerCase()
  return risposte.filter((r) => {
    const an = r.anagrafica ?? {}
    if (filtri.campagna && r.campagna !== filtri.campagna) return false
    if (filtri.settore && an.settore !== filtri.settore) return false
    if (filtri.dimensione && an.dimensione !== filtri.dimensione) return false
    if (filtri.azienda && r.aziendaChiave !== filtri.azienda) return false
    if (da !== null || a !== null) {
      const t = millisecondi(r.creato_at)
      if (t === null || (da !== null && t < da) || (a !== null && t >= a)) return false
    }
    if (testo) {
      const campi = [...['nome', 'azienda', 'email', 'settore', 'ruolo'].map((k) => an[k]), r.aziendaNome].map((v) =>
        String(v ?? '').toLowerCase()
      )
      if (!campi.some((c) => c.includes(testo))) return false
    }
    return true
  })
}

// Campagne presenti nei dati, dalla più recente.
export function elencoCampagne(risposte) {
  const ultima = new Map()
  for (const r of risposte) {
    const c = r.campagna ?? ''
    ultima.set(c, Math.max(ultima.get(c) ?? 0, millisecondi(r.creato_at) ?? 0))
  }
  return [...ultima].sort((x, y) => y[1] - x[1]).map(([c]) => c)
}

// ---- Ordinamento dell'elenco partecipanti (clic sull'intestazione di colonna) ----

const collatore = new Intl.Collator('it', { sensitivity: 'base', numeric: true })

const CHIAVI_ORDINAMENTO = {
  data: (r) => millisecondi(r.creato_at) ?? 0,
  nome: (r) => r.anagrafica?.nome ?? '',
  azienda: (r) => r.aziendaNome ?? r.anagrafica?.azienda ?? '',
  settore: (r) => r.anagrafica?.settore ?? '',
  totale: (r) => (r.valida ? r.punteggi.totale : -1),
  contatto: (r) => (r.consenso?.contatto_bpr ? 1 : 0),
}

export const CAMPI_ORDINAMENTO = Object.keys(CHIAVI_ORDINAMENTO)

// verso: 'asc' | 'desc'. A parità si mette prima la risposta più recente.
export function ordinaRisposte(risposte, campo = 'data', verso = 'desc') {
  const chiave = CHIAVI_ORDINAMENTO[campo] ?? CHIAVI_ORDINAMENTO.data
  const segno = verso === 'asc' ? 1 : -1
  const confronta = (x, y) => {
    const a = chiave(x)
    const b = chiave(y)
    return typeof a === 'string' ? collatore.compare(a, b) : a - b
  }
  return [...risposte].sort(
    (x, y) => segno * confronta(x, y) || CHIAVI_ORDINAMENTO.data(y) - CHIAVI_ORDINAMENTO.data(x)
  )
}

// ---- Paginazione dell'elenco partecipanti ----

export const RIGHE_PER_PAGINA = [20, 50, 100]

// perPagina 0 = tutte. La pagina richiesta viene riportata nei limiti (es. dopo una cancellazione).
export function pagina(lista, numero, perPagina) {
  const totale = lista.length
  if (!perPagina || perPagina <= 0) {
    return { righe: lista, numero: 1, pagine: 1, da: totale ? 1 : 0, a: totale }
  }
  const pagine = Math.max(1, Math.ceil(totale / perPagina))
  const n = Math.min(Math.max(1, numero), pagine)
  const inizio = (n - 1) * perPagina
  const righe = lista.slice(inizio, inizio + perPagina)
  return { righe, numero: n, pagine, da: righe.length ? inizio + 1 : 0, a: inizio + righe.length }
}
