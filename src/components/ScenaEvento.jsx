function ScenaEvento({ titolo, sottotitolo, children }) {
  return (
    <div className="scena-evento">
      <svg
        className="scena-evento__linea"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M -50,600 C 250,600 250,430 550,430 C 850,430 850,660 1150,660 C 1350,660 1450,540 1650,560"
          fill="none"
          stroke="#ffffff"
          strokeWidth="46"
          strokeLinecap="round"
          opacity="0.16"
        />
        <path
          d="M -50,760 C 300,760 320,860 650,850"
          fill="none"
          stroke="#ffffff"
          strokeWidth="30"
          strokeLinecap="round"
          opacity="0.09"
        />
      </svg>

      <div className="scena-evento__testo">
        <h2 className="scena-evento__titolo">{titolo}</h2>
        {sottotitolo && <p className="scena-evento__sottotitolo">{sottotitolo}</p>}
        {children}
      </div>

      <p className="scena-evento__tagline">
        La Lean nell&rsquo;era dell&rsquo;incertezza
        <span className="scena-evento__tagline-sep">·</span>
        29 Set, Simonelli Group Campus (MC)
      </p>
    </div>
  )
}

export default ScenaEvento
