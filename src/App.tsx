import { useState } from 'react'
import './App.css'
import { understandHumanInput, type HooraInterpretation } from './hooraLogic'
import { discoverTalent, type TalentMatch } from './talentMatching'
import {
  resetHooraSession,
  updateHooraSession,
  type HooraMode,
} from './hooraState'

type ActiveMode = Exclude<HooraMode, null>

const modeContent: Record<
  ActiveMode,
  {
    title: string
    description: string
    placeholder: string
  }
> = {
  need: {
    title: 'Tell Hoora what you need.',
    description:
      'Describe it naturally. You do not need to know the job title or category.',
    placeholder: 'For example: I need help making this room feel warmer...',
  },

  talent: {
    title: 'Show Hoora what you can do.',
    description:
      'Describe your talent naturally. It does not need to fit inside a traditional job title.',
    placeholder: 'For example: I can customize bicycles with artwork...',
  },

  surprise: {
    title: 'Tell Hoora what you like.',
    description:
      'Share an interest, idea, color, object, curiosity, or anything on your mind.',
    placeholder: 'For example: I love pink...',
  },
}

function App() {
  const [mode, setMode] = useState<HooraMode>(null)
  const [humanInput, setHumanInput] = useState('')
  const [submittedInput, setSubmittedInput] = useState('')
  const [interpretation, setInterpretation] =
    useState<HooraInterpretation | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [matches, setMatches] = useState<TalentMatch[]>([])

  function chooseMode(selectedMode: ActiveMode) {
    setMode(selectedMode)
    setHumanInput('')
    setSubmittedInput('')
    setInterpretation(null)
    setIsConfirmed(false)
    setMatches([])

    updateHooraSession({
      mode: selectedMode,
      humanInput: '',
      confirmed: false,
    })
  }

  function handleInputChange(value: string) {
    setHumanInput(value)
  }

  function submitInput() {
    const cleanedInput = humanInput.trim()

    if (!cleanedInput || !mode) {
      return
    }

    const result = understandHumanInput(mode, cleanedInput)

    setSubmittedInput(cleanedInput)
    setInterpretation(result)
    setHumanInput('')
    setIsConfirmed(false)
    setMatches([])

    updateHooraSession({
      humanInput: cleanedInput,
      confirmed: false,
    })
  }

  function confirmInterpretation() {
    setIsConfirmed(true)

    updateHooraSession({
      humanInput: submittedInput,
      confirmed: true,
    })

    if (mode === 'need' || mode === 'surprise') {
      const talentMatches = discoverTalent(submittedInput)
      setMatches(talentMatches)
    }
  }

  function editInterpretation() {
    setHumanInput(submittedInput)
    setSubmittedInput('')
    setInterpretation(null)
    setIsConfirmed(false)
    setMatches([])

    updateHooraSession({
      humanInput: '',
      confirmed: false,
    })
  }

  function goBack() {
    setMode(null)
    setHumanInput('')
    setSubmittedInput('')
    setInterpretation(null)
    setIsConfirmed(false)
    setMatches([])

    resetHooraSession()
  }

  if (mode) {
    const content = modeContent[mode]
    const nexus = matches[0]

    return (
      <main className="app">
        <section className="hero">
          <div className="brand">HooraAI</div>

          <div className="hero-content">
            <button className="back-button" type="button" onClick={goBack}>
              ← Back
            </button>

            <p className="eyebrow">HUMAN TALENT × AI</p>

            <h1>{content.title}</h1>

            <p className="mode-description">{content.description}</p>

            <div className="input-panel">
              <div className="input-methods">
                <span className="input-method active-method">⌨ Type</span>
                <span className="input-method">🎙 Voice</span>
                <span className="input-method">📷 Photo</span>
                <span className="input-method">🎥 Video</span>
              </div>

              <textarea
                className="hoora-input"
                value={humanInput}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder={content.placeholder}
                rows={6}
              />

              <button
                className="continue-button"
                type="button"
                disabled={!humanInput.trim()}
                onClick={submitInput}
              >
                Continue
              </button>
            </div>

            {interpretation && (
              <div className="confirmation-card">
                <p className="confirmation-label">YOU SAID</p>

                <p className="confirmation-text">{submittedInput}</p>

                <p className="confirmation-label">HOORA UNDERSTANDS</p>

                <p className="confirmation-text">{interpretation.summary}</p>

                {!isConfirmed ? (
                  <>
                    <p className="confirmation-note">
                      Is this understanding correct?
                    </p>

                    <button
                      className="continue-button"
                      type="button"
                      onClick={confirmInterpretation}
                    >
                      ✓ Yes, that&apos;s right
                    </button>

                    <button
                      className="back-button"
                      type="button"
                      onClick={editInterpretation}
                    >
                      ✎ Edit
                    </button>
                  </>
                ) : (
                  <p className="confirmation-note">
                    ✓ Confirmed by you. Hoora can now continue.
                  </p>
                )}
              </div>
            )}

            {isConfirmed && mode === 'talent' && (
              <div className="confirmation-card">
                <p className="confirmation-label">YOUR TALENT</p>

                <p className="confirmation-text">
                  Hoora can now make this talent understandable and
                  discoverable.
                </p>
              </div>
            )}

            {isConfirmed &&
              (mode === 'need' || mode === 'surprise') &&
              nexus && (
                <div className="confirmation-card">
                  <p className="confirmation-label">YOUR NEXUS</p>

                  <p className="confirmation-text">
                    Your Nexus is <strong>{nexus.profile.name}</strong>.
                  </p>

                  <p className="confirmation-text">
                    {nexus.profile.headline}
                  </p>

                  <p className="confirmation-note">
                    {nexus.profile.canDo}
                  </p>

                  <p className="confirmation-note">
                    {nexus.profile.location}
                    {' · '}
                    {nexus.profile.availableNow
                      ? 'Available now'
                      : 'Available by booking'}
                  </p>
                </div>
              )}

            {isConfirmed &&
              (mode === 'need' || mode === 'surprise') &&
              matches.length === 0 && (
                <div className="confirmation-card">
                  <p className="confirmation-label">HOORA</p>

                  <p className="confirmation-text">
                    I don&apos;t have a strong Nexus yet.
                  </p>

                  <p className="confirmation-note">
                    Tell me a little more rather than having me guess.
                  </p>
                </div>
              )}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <section className="hero">
        <div className="brand">HooraAI</div>

        <div className="hero-content">
          <p className="eyebrow">HUMAN TALENT × AI</p>

          <h1>What brings you to Hoora right now?</h1>

          <div className="choices">
            <button
              className="choice-card"
              type="button"
              onClick={() => chooseMode('need')}
            >
              <span className="sparkle">✨</span>

              <span className="choice-title">I need something</span>

              <span className="choice-description">
                Tell Hoora what you need.
              </span>
            </button>

            <button
              className="choice-card"
              type="button"
              onClick={() => chooseMode('talent')}
            >
              <span className="sparkle">✨</span>

              <span className="choice-title">I can do something</span>

              <span className="choice-description">
                Show Hoora what you can do.
              </span>
            </button>

            <button
              className="choice-card"
              type="button"
              onClick={() => chooseMode('surprise')}
            >
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