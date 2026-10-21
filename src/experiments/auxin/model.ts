import { phases, type AuxinPhase, type PhaseId, type StepId, type TimedStepId } from './data'

export interface PhaseState {
  phaseId: PhaseId
  step: StepId
  moved: Record<TimedStepId, boolean[]>
  progress: Record<TimedStepId, number>
  pruned: boolean[]
  activePruning: { group: number; token: number } | null
  resultView: 'chart' | 'table'
}

export function createPhaseState(phase: AuxinPhase): PhaseState {
  const groups = () => phase.concentrations.map(() => false)
  return {
    phaseId: phase.id,
    step: phase.steps[0],
    moved: { soak: groups(), dry: groups(), culture: groups() },
    progress: { soak: 0, dry: 0, culture: 0 },
    pruned: phase.id === 'preliminary' ? groups() : [],
    activePruning: null,
    resultView: 'chart',
  }
}

export function createSession(): Record<PhaseId, PhaseState> {
  return { preliminary: createPhaseState(phases[0]), formal: createPhaseState(phases[1]) }
}

export function stepComplete(state: PhaseState, step: StepId): boolean {
  const phase = phases.find(item => item.id === state.phaseId)
  if (!phase?.steps.includes(step)) return false
  if (step === 'prune') return state.pruned.length === phase.concentrations.length && state.pruned.every(Boolean)
  return state.moved[step].every(Boolean) && state.progress[step] >= 100
}

export function canSelectStep(state: PhaseState, step: StepId): boolean {
  const phase = phases.find(item => item.id === state.phaseId)
  const index = phase?.steps.indexOf(step) ?? -1
  // 所有前置步骤均需完成，避免仅凭后一步残留状态越过修剪。
  return index >= 0 && phase!.steps.slice(0, index).every(previous => stepComplete(state, previous))
}

export function beginPruning(state: PhaseState, group: number, token: number): boolean {
  if (state.step !== 'prune' || !canSelectStep(state, 'prune') || state.activePruning) return false
  if (!Number.isInteger(group) || group < 0 || group >= state.pruned.length || state.pruned[group]) return false
  if (!Number.isSafeInteger(token) || token < 1) return false
  state.activePruning = { group, token }
  return true
}

export function finishPruning(state: PhaseState, group: number, token: number): boolean {
  const active = state.activePruning
  if (state.step !== 'prune' || !canSelectStep(state, 'prune') || !active) return false
  if (active.group !== group || active.token !== token || state.pruned[group]) return false
  state.pruned[group] = true
  state.activePruning = null
  return true
}

export function cancelPruning(state: PhaseState): void {
  state.activePruning = null
}

export function moveGroup(state: PhaseState, group: number): boolean {
  if (state.step === 'prune' || !canSelectStep(state, state.step)) return false
  if (!Number.isInteger(group) || group < 0 || group >= state.moved[state.step].length) return false
  if (state.moved[state.step][group]) return false
  state.moved[state.step][group] = true
  return true
}

export function setProgress(state: PhaseState, value: number): boolean {
  if (state.step === 'prune' || !canSelectStep(state, state.step)) return false
  if (!Number.isFinite(value) || !state.moved[state.step].every(Boolean)) return false
  state.progress[state.step] = Math.max(0, Math.min(100, value))
  return true
}
