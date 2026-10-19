import { phases, type AuxinPhase, type PhaseId, type StepIndex } from './data'

export interface PhaseState {
  step: StepIndex
  moved: boolean[][]
  progress: number[]
  resultView: 'chart' | 'table'
}

export function createPhaseState(phase: AuxinPhase): PhaseState {
  return {
    step: 0,
    moved: Array.from({ length: 3 }, () => phase.concentrations.map(() => false)),
    progress: [0, 0, 0],
    resultView: 'chart',
  }
}

export function createSession(): Record<PhaseId, PhaseState> {
  return { preliminary: createPhaseState(phases[0]), formal: createPhaseState(phases[1]) }
}

export function stepComplete(state: PhaseState, step: number): boolean {
  return state.moved[step].every(Boolean) && state.progress[step] >= 100
}

export function canSelectStep(state: PhaseState, step: StepIndex): boolean {
  return step === 0 || stepComplete(state, step - 1)
}

export function moveGroup(state: PhaseState, group: number): boolean {
  if (!Number.isInteger(group) || group < 0 || group >= state.moved[state.step].length) return false
  if (!canSelectStep(state, state.step) || state.moved[state.step][group]) return false
  state.moved[state.step][group] = true
  return true
}

export function setProgress(state: PhaseState, value: number): boolean {
  if (!Number.isFinite(value) || !state.moved[state.step].every(Boolean)) return false
  state.progress[state.step] = Math.max(0, Math.min(100, value))
  return true
}
