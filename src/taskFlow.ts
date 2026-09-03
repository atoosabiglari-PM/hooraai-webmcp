import type { TalentProfile } from './hooraState'

export type PreparedTask = {
  id: string
  title: string
  request: string
  nexus: {
    id: string
    name: string
    headline: string
  }
  status: 'draft'
  humanApprovalRequired: true
}

export function prepareTask(
  request: string,
  nexus: TalentProfile,
): PreparedTask {
  const cleanedRequest = request.trim()

  return {
    id: `task-${Date.now()}`,

    title: `Help with: ${cleanedRequest}`,

    request: cleanedRequest,

    nexus: {
      id: nexus.id,
      name: nexus.name,
      headline: nexus.headline,
    },

    status: 'draft',

    humanApprovalRequired: true,
  }
}