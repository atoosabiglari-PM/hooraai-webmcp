import './App.css'

function App() {
  return (
    <main className="app">
      <section className="hero">
        <div className="brand">HooraAI</div>

        <div className="hero-content">
          <p className="eyebrow">HUMAN TALENT × AI</p>

          <h1>What brings you to Hoora right now?</h1>

          <div className="choices">
            <button className="choice-card" type="button">
              <span className="sparkle">✨</span>
              <span className="choice-title">I need something</span>
              <span className="choice-description">
                Tell Hoora what you need.
              </span>
            </button>

            <button className="choice-card" type="button">
              <span className="sparkle">✨</span>
              <span className="choice-title">I can do something</span>
              <span className="choice-description">
                Show Hoora what you can do.
              </span>
            </button>

            <button className="choice-card" type="button">
              <span className="sparkle">✨</span>
              <span className="choice-title">Surprise me</span>
              <span className="choice-description">
                Tell Hoora what you like.
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App