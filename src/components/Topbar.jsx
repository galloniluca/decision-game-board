function Topbar({ right }) {
  return (
    <div className="topbar">
      <span className="brand">
        <img src="/logo-bpr.png" alt="BPR Group" className="brand-logo" />
        Lean Trade-off Game
      </span>
      {right}
    </div>
  )
}

export default Topbar
