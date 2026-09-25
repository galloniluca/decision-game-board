import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// QR code verso la pagina pubblica del survey, per la schermata di fine gioco in Dashboard.
function QrSurvey() {
  const url = `${window.location.origin}/survey`
  const [immagine, setImmagine] = useState(null)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then(setImmagine)
      .catch(() => setImmagine(null))
  }, [url])

  return (
    <div className="qr-survey">
      {immagine && <img src={immagine} alt={`QR code verso ${url}`} className="qr-survey__img" />}
      <p className="qr-survey__testo">Inquadra il QR code e compila il questionario</p>
      <p className="qr-survey__url">{url.replace(/^https?:\/\//, '')}</p>
    </div>
  )
}

export default QrSurvey
