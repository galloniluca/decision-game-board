const LOCANDINA_URL = '/locandina-evento.webp'

function ScenaLocandina({ titolo, sottotitolo }) {
  return (
    <div className="poster-scena">
      <div className="poster-scena__sfondo" style={{ backgroundImage: `url(${LOCANDINA_URL})` }} />
      <img src={LOCANDINA_URL} alt="" className="poster-scena__immagine" />
      <div className="poster-scena__testo">
        <div className="poster-scena__riquadro">
          <h2 className="poster-scena__titolo">{titolo}</h2>
          {sottotitolo && <p className="poster-scena__sottotitolo">{sottotitolo}</p>}
        </div>
      </div>
    </div>
  )
}

export default ScenaLocandina
