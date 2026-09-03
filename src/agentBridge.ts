import type { PreparedTask } from './taskFlow'

export const HOORA_AGENT_TASK_EVENT = 'hoora:agent-task-prepared'

let agentPreparedTask: PreparedTask | null = null

export function publishAgentPreparedTask(task: PreparedTask): void {
  agentPreparedTask = task

  window.dispatchEvent(
    new CustomEvent<PreparedTask>(HOORA_AGENT_TASK_EVENT, {
      detail: task,
    }),
  )
}

export function getAgentPreparedTask(): PreparedTask | null {
  return agentPreparedTask
    ? {
        ...agentPreparedTask,
        nexus: {
          ...agentPreparedTask.nexus,
        },
      }
    : null
}

export function clearAgentPreparedTask(): void {
  agentPreparedTask = null
}