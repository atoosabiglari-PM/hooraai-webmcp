import type { HooraMode } from './hooraState'

export type HooraInterpretation = {
  summary: string
  intent: string
  humanConfirmationRequired: boolean
}

export function understandHumanInput(
  mode: HooraMode,
  input: string,
): HooraInterpretation {
  const cleanedInput = input.trim()

  if (!cleanedInput) {
    return {
      summary: '',
      intent: '',
      humanConfirmationRequired: true,
    }
  }

  if (mode === 'talent') {
    return {
      summary: `Hoora understands that you can: ${cleanedInput}`,
      intent: 'Make this human talent understandable and discoverable.',
      humanConfirmationRequired: true,
    }
  }

  if (mode === 'surprise') {
    return {
      summary: `Hoora understands that you are interested in: ${cleanedInput}`,
      intent:
        'Discover human talent that may connect with this interest or curiosity.',
      humanConfirmationRequired: true,
    }
  }

  return {
    summary: `Hoora understands that you need: ${cleanedInput}`,
    intent: 'Discover relevant human talent that may be able to help.',
    humanConfirmationRequired: true,
  }
}