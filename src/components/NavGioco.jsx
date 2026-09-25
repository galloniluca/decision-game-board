import { Link } from 'react-router-dom'

// Navigazione comune alle viste di gestione (Home, Config, Regia, Dashboard):
// ogni pagina mostra i link a tutte le altre, compresi il survey e i suoi risultati (riservati).
const VOCI = [
  { to: '/', etichetta: 'Home' },
  { to: '/config', etichetta: 'Config' },
  { to: '/regia', etichetta: 'Regia' },
  { to: '/dashboard', etichetta: 'Dashboard TV' },
  { to: '/survey', etichetta: 'Survey' },
  { to: '/survey-risultati', etichetta: 'Risultati survey' },
]

function NavGioco({ corrente }) {
  return (
    <span className="nav-links">
      {VOCI.filter((v) => v.to !== corrente).map((v) => (
        <Link key={v.to} to={v.to}>
          {v.etichetta}
        </Link>
      ))}
    </span>
  )
}

export default NavGioco
