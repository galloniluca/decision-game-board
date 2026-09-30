import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import FogliReport from './FogliReport'
import { elencoInvii, nomeFileReport, nomiUnivoci } from './report'

// Generazione dei PDF nel browser: i fogli del report vengono disegnati fuori schermo,
// fotografati ad alta risoluzione e impaginati in A4. Le librerie si caricano solo qui,
// quando serve, per non appesantire il resto dell'app.

const LARGHEZZA_MM = 210

async function librerie() {
  const [{ toJpeg }, { jsPDF }, { zipSync, strToU8 }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
    import('fflate'),
  ])
  return { toJpeg, jsPDF, zipSync, strToU8 }
}

// La cattura non applica i fogli di stile agli elementi interni degli SVG (il radar
// verrebbe nero): prima di fotografare si copiano gli stili calcolati come stili in linea.
const PROPRIETA_SVG = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linejoin', 'font-size', 'font-weight', 'font-family']

export function incollaStiliSvg(radice) {
  for (const el of radice.querySelectorAll('svg, svg *')) {
    const calcolato = getComputedStyle(el)
    for (const prop of PROPRIETA_SVG) el.style.setProperty(prop, calcolato.getPropertyValue(prop))
  }
}

// Contenitore fuori schermo in cui disegnare un report alla volta.
function apriBanco() {
  const contenitore = document.createElement('div')
  contenitore.className = 'report report--cattura'
  document.body.appendChild(contenitore)
  const root = createRoot(contenitore)
  return {
    contenitore,
    chiudi() {
      root.unmount()
      contenitore.remove()
    },
    async disegna(risposta, risposte) {
      flushSync(() => root.render(<FogliReport risposta={risposta} risposte={risposte} />))
      await Promise.all([...contenitore.querySelectorAll('img')].map((img) => img.decode().catch(() => {})))
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
      incollaStiliSvg(contenitore)
    },
  }
}

async function pdfDaBanco(banco, lib) {
  const pdf = new lib.jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const fogli = [...banco.contenitore.querySelectorAll('.report-foglio')]
  for (const [i, foglio] of fogli.entries()) {
    const immagine = await lib.toJpeg(foglio, { pixelRatio: 2, quality: 0.9, backgroundColor: '#ffffff' })
    if (i > 0) pdf.addPage()
    const altezza = (LARGHEZZA_MM * foglio.offsetHeight) / foglio.offsetWidth
    pdf.addImage(immagine, 'JPEG', 0, 0, LARGHEZZA_MM, altezza)
  }
  return pdf
}

export async function creaPdfReport(risposta, risposte) {
  const lib = await librerie()
  const banco = apriBanco()
  try {
    await banco.disegna(risposta, risposte)
    return (await pdfDaBanco(banco, lib)).output('blob')
  } finally {
    banco.chiudi()
  }
}

// ZIP con un PDF per ogni risposta valida più l'elenco per l'invio (nome, email, file).
export async function creaZipReport(persone, risposte, onAvanzamento) {
  const lib = await librerie()
  const nomi = nomiUnivoci(persone.map(nomeFileReport))
  const file = {}
  const banco = apriBanco()
  try {
    for (const [i, persona] of persone.entries()) {
      onAvanzamento?.(i, persone.length)
      await banco.disegna(persona, risposte)
      const pdf = await pdfDaBanco(banco, lib)
      file[nomi[i]] = new Uint8Array(pdf.output('arraybuffer'))
    }
  } finally {
    banco.chiudi()
  }
  onAvanzamento?.(persone.length, persone.length)
  file['elenco-invii.csv'] = lib.strToU8(
    elencoInvii(persone.map((risposta, i) => ({ risposta, file: nomi[i] })))
  )
  // I PDF sono gia' compressi: level 0 evita lavoro inutile.
  return new Blob([lib.zipSync(file, { level: 0 })], { type: 'application/zip' })
}

export function scaricaBlob(nomeFile, blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeFile
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
