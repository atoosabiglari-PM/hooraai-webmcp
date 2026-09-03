import type { TalentProfile } from './hooraState'

export type TaskStatus = 'draft' | 'approved'

export type PreparedTask = {
  id: string
  title: string
  request: string
  nexus: {
    id: string
    name: string
    headline: string
  }
  status: TaskStatus
  humanApprovalRequired: boolean
  approvedAt: string | null
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

    approvedAt: null,
  }
}

export function approveTask(task: PreparedTask): PreparedTask {
  return {
    ...task,

    status: 'approved',

    humanApprovalRequired: false,

    approvedAt: new Date().toISOString(),
  }
}