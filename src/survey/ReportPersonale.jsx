import { useEffect, useState } from 'react'
import FogliReport from './FogliReport'
import { creaPdfReport, scaricaBlob } from './pdfReport'
import { nomeFileReport } from './report'

// Vista del report di un partecipante nella pagina riservata, con download del PDF.

function ReportPersonale({ risposta, risposte, onChiudi }) {
  const nome = risposta.anagrafica?.nome ?? ''
  const [stato, setStato] = useState(null)

  // Il titolo della pagina diventa il nome proposto se si salva dalla finestra di stampa.
  useEffect(() => {
    const precedente = document.title
    document.title = `Report survey BPR - ${nome}`.trim()
    window.scrollTo(0, 0)
    return () => {
      document.title = precedente
    }
  }, [nome])

  async function scaricaPdf() {
    setStato('Generazione PDF...')
    try {
      const pdf = await creaPdfReport(risposta, risposte)
      scaricaBlob(nomeFileReport(risposta), pdf)
      setStato(null)
    } catch (err) {
      setStato(`Errore nella generazione del PDF: ${err.message}`)
    }
  }

  return (
    <div className="report">
      <div className="report-barra">
        <button type="button" className="btn" onClick={onChiudi}>
          ← Torna ai risultati
        </button>
        <button type="button" className="btn btn-primary" onClick={scaricaPdf} disabled={stato === 'Generazione PDF...'}>
          Scarica PDF
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          Stampa
        </button>
        {stato && <span className="report-barra__nota">{stato}</span>}
      </div>

      <FogliReport risposta={risposta} risposte={risposte} />
    </div>
  )
}

export default ReportPersonale
