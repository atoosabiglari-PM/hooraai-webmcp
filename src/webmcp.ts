import { publishAgentPreparedTask } from './agentBridge'
import { getTalentProfiles } from './hooraState'
import { discoverTalent } from './talentMatching'
import { prepareTask } from './taskFlow'

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
          'Searches HooraAI human talent using a natural-language need, interest, or curiosity. The search does not require the human to choose a predefined job category.',

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

          const talentMatches = discoverTalent(query)

          const matches = talentMatches.map((match, index) => ({
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

            nexus: matches[0] ?? null,

            matches,

            match_count: matches.length,

            human_selection_required: true,

            next_step:
              matches.length > 0
                ? 'Present the Nexus and other relevant talent to the human. Do not select a Professional or create a Task without human approval.'
                : 'No strong talent match was found. Ask the human for more detail rather than guessing.',
          }
        },
      },
      {
        signal: registrationController.signal,
      },
    )

    await webDocument.modelContext.registerTool(
      {
        name: 'prepare_task',

        title: 'Prepare a Hoora Task',

        description:
          'Prepares a draft HooraAI Task connecting a human-confirmed request with a selected Nexus and publishes that draft into the HooraAI human interface for review. It does not approve, book, assign, charge, pay, or start the Task.',

        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'string',
              description:
                'The human-confirmed request that the draft Task should address.',
            },

            talent_id: {
              type: 'string',
              description:
                'The HooraAI talent profile ID selected as the proposed Nexus.',
            },
          },
          required: ['request', 'talent_id'],
          additionalProperties: false,
        },

        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false,
        },

        execute: async (input) => {
          const request =
            typeof input.request === 'string' ? input.request.trim() : ''

          const talentId =
            typeof input.talent_id === 'string'
              ? input.talent_id.trim()
              : ''

          if (!request) {
            return {
              success: false,
              message: 'A human-confirmed request is required.',
            }
          }

          if (!talentId) {
            return {
              success: false,
              message: 'A selected talent ID is required.',
            }
          }

          const talent = getTalentProfiles().find(
            (profile) => profile.id === talentId,
          )

          if (!talent) {
            return {
              success: false,
              message: 'The selected HooraAI talent profile was not found.',
            }
          }

          const draftTask = prepareTask(request, talent)

          publishAgentPreparedTask(draftTask)

          return {
            success: true,

            task: draftTask,

            published_to_human_interface: true,

            human_approval_required: true,

            prohibited_without_human_approval: [
              'booking',
              'professional assignment',
              'payment',
              'starting the task',
            ],

            next_step:
              'The draft Task is now available in the HooraAI human interface. The human must review and explicitly approve it before anything continues.',
          }
        },
      },
      {
        signal: registrationController.signal,
      },
    )

    console.info(
      'HooraAI WebMCP: understand_need, discover_talent, and prepare_task registered.',
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