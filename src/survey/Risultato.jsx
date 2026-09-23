// Segnaposto: la schermata del risultato completa arriva nel passo successivo.
function Risultato({ anagrafica }) {
  return (
    <>
      <h1>Grazie, {anagrafica.nome}</h1>
      <div className="card">
        <p>Le tue risposte sono state inviate.</p>
      </div>
    </>
  )
}

export default Risultato
