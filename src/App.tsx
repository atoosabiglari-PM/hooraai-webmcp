import { useEffect, useState } from 'react'
import './App.css'
import {
  clearAgentPreparedTask,
  getAgentPreparedTask,
  HOORA_AGENT_TASK_EVENT,
} from './agentBridge'
import { understandHumanInput, type HooraInterpretation } from './hooraLogic'
import { discoverTalent, type TalentMatch } from './talentMatching'
import {
  approveTask,
  prepareTask,
  type PreparedTask,
} from './taskFlow'
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
  const [preparedTask, setPreparedTask] = useState<PreparedTask | null>(null)

  const [agentPreparedTask, setAgentPreparedTask] =
    useState<PreparedTask | null>(null)

  useEffect(() => {
    const existingAgentTask = getAgentPreparedTask()

    if (existingAgentTask) {
      setAgentPreparedTask(existingAgentTask)
    }

    function handleAgentPreparedTask(event: Event) {
      const customEvent = event as CustomEvent<PreparedTask>

      setAgentPreparedTask(customEvent.detail)
    }

    window.addEventListener(
      HOORA_AGENT_TASK_EVENT,
      handleAgentPreparedTask,
    )

    return () => {
      window.removeEventListener(
        HOORA_AGENT_TASK_EVENT,
        handleAgentPreparedTask,
      )
    }
  }, [])

  function chooseMode(selectedMode: ActiveMode) {
    setMode(selectedMode)
    setHumanInput('')
    setSubmittedInput('')
    setInterpretation(null)
    setIsConfirmed(false)
    setMatches([])
    setPreparedTask(null)

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
    setPreparedTask(null)

    updateHooraSession({
      humanInput: cleanedInput,
      confirmed: false,
    })
  }

  function confirmInterpretation() {
    setIsConfirmed(true)
    setPreparedTask(null)

    updateHooraSession({
      humanInput: submittedInput,
      confirmed: true,
    })

    if (mode === 'need' || mode === 'surprise') {
      const talentMatches = discoverTalent(submittedInput)
      setMatches(talentMatches)
    }
  }

  function createDraftTask() {
    const nexus = matches[0]

    if (!nexus) {
      return
    }

    const draftTask = prepareTask(submittedInput, nexus.profile)

    setPreparedTask(draftTask)
  }

  function approvePreparedTask() {
    if (!preparedTask || preparedTask.status !== 'draft') {
      return
    }

    const approvedTask = approveTask(preparedTask)

    setPreparedTask(approvedTask)
  }

  function approveAgentPreparedTask() {
    if (
      !agentPreparedTask ||
      agentPreparedTask.status !== 'draft'
    ) {
      return
    }

    const approvedTask = approveTask(agentPreparedTask)

    setAgentPreparedTask(approvedTask)
    clearAgentPreparedTask()
  }

  function editInterpretation() {
    setHumanInput(submittedInput)
    setSubmittedInput('')
    setInterpretation(null)
    setIsConfirmed(false)
    setMatches([])
    setPreparedTask(null)

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
    setPreparedTask(null)

    resetHooraSession()
  }

  function renderAgentTask() {
    if (!agentPreparedTask) {
      return null
    }

    return (
      <div className="confirmation-card">
        <p className="confirmation-label">
          {agentPreparedTask.status === 'draft'
            ? 'AGENT-PREPARED TASK'
            : 'APPROVED AGENT TASK'}
        </p>

        <p className="confirmation-text">
          <strong>{agentPreparedTask.title}</strong>
        </p>

        <p className="confirmation-note">
          Request: {agentPreparedTask.request}
        </p>

        <p className="confirmation-note">
          Nexus: {agentPreparedTask.nexus.name} ·{' '}
          {agentPreparedTask.nexus.headline}
        </p>

        <p className="confirmation-note">
          Status:{' '}
          {agentPreparedTask.status === 'draft'
            ? 'Draft'
            : 'Approved'}
        </p>

        {agentPreparedTask.status === 'draft' ? (
          <>
            <p className="confirmation-note">
              An AI agent prepared this Task for you. Nothing has been
              booked, assigned, charged, or started.
            </p>

            <p className="confirmation-note">
              Your approval is required before Hoora can continue.
            </p>

            <button
              className="continue-button"
              type="button"
              onClick={approveAgentPreparedTask}
            >
              ✓ Approve Agent-Prepared Task
            </button>
          </>
        ) : (
          <p className="confirmation-note">
            ✓ Approved by you. The agent may now continue to the next
            permitted workflow step.
          </p>
        )}
      </div>
    )
  }

  if (mode) {
    const content = modeContent[mode]
    const nexus = matches[0]

    return (
      <main className="app">
        <section className="hero">
          <div className="brand">HooraAI</div>

          <div className="hero-content">
            <button
              className="back-button"
              type="button"
              onClick={goBack}
            >
              ← Back
            </button>

            <p className="eyebrow">HUMAN TALENT × AI</p>

            <h1>{content.title}</h1>

            <p className="mode-description">
              {content.description}
            </p>

            {renderAgentTask()}

            <div className="input-panel">
              <div className="input-methods">
                <span className="input-method active-method">
                  ⌨ Type
                </span>

                <span className="input-method">
                  🎙 Voice
                </span>

                <span className="input-method">
                  📷 Photo
                </span>

                <span className="input-method">
                  🎥 Video
                </span>
              </div>

              <textarea
                className="hoora-input"
                value={humanInput}
                onChange={(event) =>
                  handleInputChange(event.target.value)
                }
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
                <p className="confirmation-label">
                  YOU SAID
                </p>

                <p className="confirmation-text">
                  {submittedInput}
                </p>

                <p className="confirmation-label">
                  HOORA UNDERSTANDS
                </p>

                <p className="confirmation-text">
                  {interpretation.summary}
                </p>

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
                <p className="confirmation-label">
                  YOUR TALENT
                </p>

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
                  <p className="confirmation-label">
                    YOUR NEXUS
                  </p>

                  <p className="confirmation-text">
                    Your Nexus is{' '}
                    <strong>{nexus.profile.name}</strong>.
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

                  {!preparedTask && (
                    <button
                      className="continue-button"
                      type="button"
                      onClick={createDraftTask}
                    >
                      Prepare Task
                    </button>
                  )}
                </div>
              )}

            {preparedTask && (
              <div className="confirmation-card">
                <p className="confirmation-label">
                  {preparedTask.status === 'draft'
                    ? 'DRAFT TASK'
                    : 'APPROVED TASK'}
                </p>

                <p className="confirmation-text">
                  <strong>{preparedTask.title}</strong>
                </p>

                <p className="confirmation-note">
                  Request: {preparedTask.request}
                </p>

                <p className="confirmation-note">
                  Nexus: {preparedTask.nexus.name} ·{' '}
                  {preparedTask.nexus.headline}
                </p>

                <p className="confirmation-note">
                  Status:{' '}
                  {preparedTask.status === 'draft'
                    ? 'Draft'
                    : 'Approved'}
                </p>

                {preparedTask.status === 'draft' ? (
                  <>
                    <p className="confirmation-note">
                      Human approval is required before this Task can
                      continue.
                    </p>

                    <button
                      className="continue-button"
                      type="button"
                      onClick={approvePreparedTask}
                    >
                      ✓ Approve Task
                    </button>
                  </>
                ) : (
                  <p className="confirmation-note">
                    ✓ Approved by you. Hoora may now continue to the
                    next workflow step.
                  </p>
                )}
              </div>
            )}

            {isConfirmed &&
              (mode === 'need' || mode === 'surprise') &&
              matches.length === 0 && (
                <div className="confirmation-card">
                  <p className="confirmation-label">
                    HOORA
                  </p>

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
          <p className="eyebrow">
            HUMAN TALENT × AI
          </p>

          <h1>
            What brings you to Hoora right now?
          </h1>

          {renderAgentTask()}

          <div className="choices">
            <button
              className="choice-card"
              type="button"
              onClick={() => chooseMode('need')}
            >
              <span className="sparkle">✨</span>

              <span className="choice-title">
                I need something
              </span>

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

              <span className="choice-title">
                I can do something
              </span>

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

              <span className="choice-title">
                Surprise me
              </span>

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