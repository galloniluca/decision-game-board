// Raggruppamento dei nomi azienda scritti a mano dai partecipanti (pagina riservata).
// Modulo puro, coperto da aziende.test.js.
//
// 1. Automatico: maiuscole, accenti, spazi, punteggiatura e forme societarie (srl, spa,
//    s.p.a., group, & C. ...) non contano: "ROSSI S.P.A." e "Rossi spa" hanno la stessa chiave.
// 2. Manuale: le unioni decise da BPR (config.unioni: chiave -> chiave di destinazione), i nomi
//    da mostrare (config.nomi) e le coppie simili ma diverse (config.distinte: "a|b").

const FORME_SOCIETARIE = new Set([
  'srl', 'srls', 'spa', 'sapa', 'sas', 'snc', 'ss', 'scarl', 'scrl', 'sc', 'coop', 'soc', 'societa',
  'cooperativa', 'ltd', 'gmbh', 'sa', 'ag', 'inc', 'llc', 'bv', 'group', 'gruppo', 'holding',
  'c', 'ec', 'figli', 'fratelli', 'flli',
])

export const CONFIG_AZIENDE_VUOTA = { unioni: {}, nomi: {}, distinte: [] }

export function chiaveAzienda(nome) {
  const pulito = String(nome ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/\./g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  if (!pulito) return ''
  // "s p a" -> "spa": sequenze di lettere singole diventano una parola sola.
  const parole = []
  let sigla = ''
  for (const p of pulito.split(' ')) {
    if (p.length === 1) {
      sigla += p
      continue
    }
    if (sigla) parole.push(sigla)
    sigla = ''
    parole.push(p)
  }
  if (sigla) parole.push(sigla)
  const senzaForme = parole.filter((p) => !FORME_SOCIETARIE.has(p))
  return (senzaForme.length > 0 ? senzaForme : parole).join(' ')
}

// Segue la catena delle unioni (a -> b -> c); si ferma su eventuali cicli.
export function risolvi(chiave, unioni = {}) {
  let attuale = chiave
  const visti = new Set([attuale])
  while (unioni[attuale] && !visti.has(unioni[attuale])) {
    attuale = unioni[attuale]
    visti.add(attuale)
  }
  return attuale
}

function piuFrequente(varianti) {
  return [...varianti].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))[0]?.[0] ?? ''
}

// Gruppi di aziende: { chiave, nome, n, varianti: [{ testo, n }], ids, unioneManuale }.
export function raggruppaAziende(risposte, config = CONFIG_AZIENDE_VUOTA) {
  const unioni = config.unioni ?? {}
  const gruppi = new Map()
  for (const r of risposte) {
    const testo = String(r.anagrafica?.azienda ?? '').trim()
    const base = chiaveAzienda(testo)
    const chiave = risolvi(base, unioni)
    if (!gruppi.has(chiave)) gruppi.set(chiave, { chiave, varianti: new Map(), ids: [], basi: new Set() })
    const g = gruppi.get(chiave)
    g.varianti.set(testo, (g.varianti.get(testo) ?? 0) + 1)
    g.ids.push(r.id)
    g.basi.add(base)
  }
  return [...gruppi.values()]
    .map((g) => ({
      chiave: g.chiave,
      nome: config.nomi?.[g.chiave] || piuFrequente(g.varianti) || '(senza nome)',
      n: g.ids.length,
      varianti: [...g.varianti].map(([testo, n]) => ({ testo, n })).sort((a, b) => b.n - a.n),
      ids: g.ids,
      unioneManuale: [...g.basi].some((b) => b !== g.chiave),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))
}

// id risposta -> { chiave, nome } del suo gruppo.
export function mappaAziende(gruppi) {
  const mappa = new Map()
  for (const g of gruppi) for (const id of g.ids) mappa.set(id, { chiave: g.chiave, nome: g.nome })
  return mappa
}

// Somiglianza 0-1 tra due chiavi (coefficiente di Dice sulle coppie di lettere).
export function somiglianza(a, b) {
  const coppie = (s) => {
    const t = s.replace(/ /g, '')
    const m = new Map()
    for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) ?? 0) + 1)
    return m
  }
  const ca = coppie(a)
  const cb = coppie(b)
  const tot = [...ca.values(), ...cb.values()].reduce((s, n) => s + n, 0)
  if (tot === 0) return a === b ? 1 : 0
  let comuni = 0
  for (const [k, n] of ca) comuni += Math.min(n, cb.get(k) ?? 0)
  return (2 * comuni) / tot
}

// Una chiave contenuta per parole nell'altra ("simonelli" in "nuova simonelli").
function contenuta(a, b) {
  const pa = a.split(' ')
  const pb = new Set(b.split(' '))
  return pa.some((p) => p.length >= 4) && pa.every((p) => pb.has(p))
}

export const idCoppia = (a, b) => [a, b].sort().join('|')

// Coppie di gruppi probabilmente uguali, dalla più simile, escluse quelle segnate come diverse.
export function possibiliDoppioni(gruppi, config = CONFIG_AZIENDE_VUOTA, soglia = 0.75) {
  const distinte = new Set(config.distinte ?? [])
  const coppie = []
  for (let i = 0; i < gruppi.length; i++) {
    for (let j = i + 1; j < gruppi.length; j++) {
      const a = gruppi[i]
      const b = gruppi[j]
      if (!a.chiave || !b.chiave || distinte.has(idCoppia(a.chiave, b.chiave))) continue
      const s = somiglianza(a.chiave, b.chiave)
      if (s >= soglia || contenuta(a.chiave, b.chiave) || contenuta(b.chiave, a.chiave)) {
        coppie.push({ a, b, somiglianza: s })
      }
    }
  }
  return coppie.sort((x, y) => y.somiglianza - x.somiglianza)
}

// Unisce i gruppi indicati in `destinazione`; le unioni precedenti vengono ripuntate.
export function unisci(config, chiavi, destinazione, nome) {
  const unioni = { ...(config.unioni ?? {}) }
  for (const k of Object.keys(unioni)) {
    if (chiavi.includes(risolvi(k, unioni)) && k !== destinazione) unioni[k] = destinazione
  }
  for (const k of chiavi) if (k !== destinazione) unioni[k] = destinazione
  delete unioni[destinazione]
  const nomi = { ...(config.nomi ?? {}) }
  for (const k of chiavi) if (k !== destinazione) delete nomi[k]
  if (nome && nome.trim()) nomi[destinazione] = nome.trim()
  return { ...config, unioni, nomi }
}

// Annulla le unioni manuali verso questo gruppo: le varianti tornano gruppi a sé.
export function separa(config, chiave) {
  const unioni = { ...(config.unioni ?? {}) }
  for (const k of Object.keys(config.unioni ?? {})) {
    if (risolvi(k, config.unioni) === chiave) delete unioni[k]
  }
  return { ...config, unioni }
}

export function rinomina(config, chiave, nome) {
  const nomi = { ...(config.nomi ?? {}) }
  if (nome && nome.trim()) nomi[chiave] = nome.trim()
  else delete nomi[chiave]
  return { ...config, nomi }
}

export function segnaDistinte(config, a, b) {
  const distinte = new Set(config.distinte ?? [])
  distinte.add(idCoppia(a, b))
  return { ...config, distinte: [...distinte].sort() }
}
