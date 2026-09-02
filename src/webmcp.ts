import { getTalentProfiles, type TalentProfile } from './hooraState'

type WebMCPTool = {
  name: string
  title?: string
  description: string
  inputSchema?: Record<string, unknown>
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) => Promise<unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
}

type ModelContext = {
  registerTool: (
    tool: WebMCPTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
}

type WebMCPDocument = Document & {
  modelContext?: ModelContext
}

let registrationController: AbortController | null = null

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function expandQuery(words: string[]): string[] {
  const expansions: Record<string, string[]> = {
    pink: ['color', 'colors', 'creative'],
    bicycle: ['bike', 'bicycles', 'customization'],
    bike: ['bicycle', 'customization'],
    room: ['space', 'home'],
    house: ['home'],
    fix: ['problem', 'practical'],
    food: ['meal', 'meals', 'preparation'],
    cooking: ['food', 'meal', 'preparation'],
  }

  const expanded = new Set(words)

  for (const word of words) {
    const relatedWords = expansions[word] ?? []

    for (const relatedWord of relatedWords) {
      expanded.add(relatedWord)
    }
  }

  return [...expanded]
}

function scoreTalent(query: string, profile: TalentProfile): number {
  const queryWords = expandQuery(normalizeWords(query))

  const searchableText = [
    profile.headline,
    profile.canDo,
    profile.location,
    ...profile.serviceTypes,
  ]
    .join(' ')
    .toLowerCase()

  let score = 0

  for (const word of queryWords) {
    if (searchableText.includes(word)) {
      score += 1
    }
  }

  if (profile.availableNow) {
    score += 0.25
  }

  return score
}

export async function registerHooraWebMCP() {
  const webDocument = document as WebMCPDocument

  if (!webDocument.modelContext) {
    console.info(
      'HooraAI: WebMCP is not available in this browser. The human interface will continue to work normally.',
    )
    return
  }

  registrationController?.abort()
  registrationController = new AbortController()

  try {
    await webDocument.modelContext.registerTool(
      {
        name: 'understand_need',

        title: 'Understand a Hoora Need',

        description:
          'Creates a preliminary structured understanding of what a human needs, likes, wants to explore, or wants help with on HooraAI. The human must confirm the interpretation before meaningful action continues.',

        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'string',
              description:
                'The human’s natural-language description of what they need, want, like, or want to explore.',
            },
          },
          required: ['request'],
          additionalProperties: false,
        },

        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },

        execute: async (input) => {
          const request =
            typeof input.request === 'string' ? input.request.trim() : ''

          if (!request) {
            return {
              success: false,
              message: 'A human request is required.',
            }
          }

          return {
            success: true,
            original_request: request,
            interpretation: {
              intent: request,
              status: 'preliminary',
            },
            human_confirmation_required: true,
            next_step:
              'Show this interpretation to the human and ask them to confirm it before continuing.',
          }
        },
      },
      {
        signal: registrationController.signal,
      },
    )

    await webDocument.modelContext.registerTool(
      {
        name: 'discover_talent',

        title: 'Discover Human Talent',

        description:
          'Searches HooraAI human talent profiles using a natural-language need, interest, or curiosity. Returns relevant people without requiring the human to choose a predefined job category.',

        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'What the human needs, likes, is curious about, or wants another human to help with.',
            },
          },
          required: ['query'],
          additionalProperties: false,
        },

        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },

        execute: async (input) => {
          const query =
            typeof input.query === 'string' ? input.query.trim() : ''

          if (!query) {
            return {
              success: false,
              message: 'A discovery query is required.',
            }
          }

          const matches = getTalentProfiles()
            .map((profile) => ({
              profile,
              relevance: scoreTalent(query, profile),
            }))
            .filter((match) => match.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 3)
            .map((match, index) => ({
              rank: index + 1,
              id: match.profile.id,
              name: match.profile.name,
              headline: match.profile.headline,
              can_do: match.profile.canDo,
              service_types: match.profile.serviceTypes,
              available_now: match.profile.availableNow,
              location: match.profile.location,
            }))

          return {
            success: true,
            query,
            matches,
            match_count: matches.length,
            human_selection_required: true,
            next_step:
              matches.length > 0
                ? 'Present these talent matches to the human. Do not select a person or create a Task without human approval.'
                : 'No strong talent match was found. Ask the human for more detail rather than guessing.',
          }
        },
      },
      {
        signal: registrationController.signal,
      },
    )

    console.info(
      'HooraAI WebMCP: understand_need and discover_talent registered.',
    )
  } catch (error) {
    console.error('HooraAI WebMCP registration failed:', error)
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    registrationController?.abort()
  })
}