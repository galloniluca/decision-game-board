function Topbar({ right }) {
  return (
    <div className="topbar">
      <span className="brand">
        <span className="brand-mark" />
        Lean Trade-off Game
      </span>
      {right}
    </div>
  )
}

export default Topbar
