import { describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { vi } from 'vitest'
import { averages, concentrationLabel, concentrationValue, concentrationUnit, durations, durationUnits, phases, rootsAtDay, stepDescriptions, type StepId } from './data'
import { beginPruning, cancelPruning, canSelectPhase, canSelectStep, createSession, finishPruning, moveGroup, phaseComplete, setProgress, stepComplete, type PhaseState } from './model'
import { useAuxinExperiment } from './useAuxinExperiment'

describe('视频原始数据', () => {
  it('两张第四天平均值和原视频数据表一致', () => {
    expect(averages(phases[0])).toEqual([2, 3, 5, 4, 2.3, 0.7, 0])
    expect(averages(phases[1])).toEqual([3, 3.3, 5, 5.7, 4])
    for (const phase of phases) {
      expect(phase.days).toHaveLength(4)
      for (const day of phase.days) {
        expect(day).toHaveLength(3)
        for (const row of day) {
          expect(row).toHaveLength(phase.concentrations.length)
          expect(row.every(value => Number.isInteger(value) && value >= 0)).toBe(true)
        }
      }
    }
  })

  it('逐日生根使用对应枝条记录，正式实验最高组为0.5mg/mL', () => {
    expect(rootsAtDay(phases[0], 2, 0)).toEqual([0, 0, 0])
    expect(rootsAtDay(phases[0], 2, 1)).toEqual([1, 1, 0])
    expect(rootsAtDay(phases[0], 2, 4)).toEqual([4, 6, 5])
    expect(rootsAtDay(phases[1], 3, 4)).toEqual([5, 6, 6])
    expect(phases[1].concentrations[averages(phases[1]).indexOf(Math.max(...averages(phases[1])))]).toBe(0.5)
  })

  it('两阶段浓度和所有显示共用mg/mL，保留1.0的小数位及零浓度', () => {
    expect(phases[0].concentrations).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1, 1.2])
    expect(phases[1].concentrations).toEqual([0.2, 0.3, 0.4, 0.5, 0.6])
    expect(concentrationUnit).toBe('mg/mL')
    expect(phases[0].concentrations.map(concentrationValue)).toEqual(['0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2'])
    expect(phases[0].concentrations.map(concentrationLabel)).toEqual(['0mg/mL', '0.2mg/mL', '0.4mg/mL', '0.6mg/mL', '0.8mg/mL', '1.0mg/mL', '1.2mg/mL'])
    expect(phases[1].concentrations.map(concentrationLabel)).toEqual(['0.2mg/mL', '0.3mg/mL', '0.4mg/mL', '0.5mg/mL', '0.6mg/mL'])
  })
})

function pruneAll(state: PhaseState) {
  for (let group = 0; group < 7; group++) {
    expect(beginPruning(state, group, group + 1)).toBe(true)
    expect(finishPruning(state, group, group + 1)).toBe(true)
  }
}

function completePruning(lab: ReturnType<typeof useAuxinExperiment>) {
  for (let group = 0; group < 7; group++) {
    lab.beginPruning(group)
    lab.finishPruning(group, lab.state.value.activePruning!.token)
  }
}

function completeTimedStep(lab: ReturnType<typeof useAuxinExperiment>, step: 'soak' | 'dry' | 'culture') {
  lab.selectStep(step)
  for (let group = 0; group < lab.phase.value.concentrations.length; group++) lab.transfer(group)
  lab.seek(100)
}

describe('正式实验前置条件', () => {
  it('预实验各步均需全部操作和计时完成，回看不丢失完成状态', () => {
    const sessions = createSession()
    const state = sessions.preliminary
    expect(canSelectPhase(sessions, 'preliminary')).toBe(true)
    expect(canSelectPhase(sessions, 'formal')).toBe(false)
    expect(canSelectPhase(sessions, 'missing' as 'formal')).toBe(false)
    pruneAll(state)
    expect(canSelectPhase(sessions, 'formal')).toBe(false)
    for (const step of ['soak', 'dry', 'culture'] as const) {
      state.step = step
      for (let group = 0; group < 6; group++) moveGroup(state, group)
      expect(canSelectPhase(sessions, 'formal')).toBe(false)
      moveGroup(state, 6)
      setProgress(state, 99)
      expect(canSelectPhase(sessions, 'formal')).toBe(false)
      setProgress(state, 100)
      expect(canSelectPhase(sessions, 'formal')).toBe(step === 'culture')
    }
    state.step = 'prune'
    expect(phaseComplete(state)).toBe(true)
    expect(canSelectPhase(sessions, 'formal')).toBe(true)
    state.progress.dry = 99
    expect(canSelectPhase(sessions, 'formal')).toBe(false)
  })

  it('切换方法拒绝绕过，失败不取消当前修剪或改变播放状态', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const lab = scope.run(() => useAuxinExperiment(ref(false)))!
    try {
      lab.beginPruning(0)
      const token = lab.state.value.activePruning!.token
      lab.playing.value = false
      lab.selectPhase('formal')
      expect(lab.phaseId.value).toBe('preliminary')
      expect(lab.state.value.activePruning?.token).toBe(token)
      expect(lab.playing.value).toBe(false)
      expect(lab.notice.value).toContain('请先完成预实验')
    } finally { scope.stop(); vi.useRealTimers() }
  })

  it('完成后解锁、保留阶段记录，回拨重新锁定，重置清空并锁定', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const lab = scope.run(() => useAuxinExperiment(ref(false)))!
    try {
      completePruning(lab)
      for (const step of ['soak', 'dry', 'culture'] as const) completeTimedStep(lab, step)
      expect(lab.canSelectPhase('formal')).toBe(true)
      lab.selectPhase('formal')
      expect(lab.phaseId.value).toBe('formal')
      lab.transfer(0)
      lab.selectPhase('preliminary')
      expect(lab.canSelectPhase('formal')).toBe(true)
      lab.seek(99)
      expect(lab.canSelectPhase('formal')).toBe(false)
      lab.selectPhase('formal')
      expect(lab.phaseId.value).toBe('preliminary')
      lab.seek(100)
      lab.selectPhase('formal')
      expect(lab.state.value.moved.soak[0]).toBe(true)
      lab.reset()
      expect(lab.phaseId.value).toBe('preliminary')
      expect(lab.canSelectPhase('formal')).toBe(false)
      lab.selectPhase('formal')
      expect(lab.phaseId.value).toBe('preliminary')
    } finally { scope.stop(); vi.useRealTimers() }
  })
})

describe('修剪完成校验', () => {
  it('开始不计完成，6组不解锁，7组结束才解锁浸泡', () => {
    const state = createSession().preliminary
    expect(state.pruned).toHaveLength(7)
    expect(state.step).toBe('prune')
    expect(moveGroup(state, 0)).toBe(false)
    expect(setProgress(state, 100)).toBe(false)
    for (let group = 0; group < 6; group++) {
      expect(beginPruning(state, group, group + 1)).toBe(true)
      expect(state.pruned[group]).toBe(false)
      expect(finishPruning(state, group, group + 1)).toBe(true)
    }
    expect(stepComplete(state, 'prune')).toBe(false)
    expect(canSelectStep(state, 'soak')).toBe(false)
    expect(beginPruning(state, 6, 7)).toBe(true)
    expect(canSelectStep(state, 'soak')).toBe(false)
    expect(finishPruning(state, 6, 7)).toBe(true)
    expect(stepComplete(state, 'prune')).toBe(true)
    expect(canSelectStep(state, 'soak')).toBe(true)
    expect(canSelectStep(state, 'dry')).toBe(false)
  })

  it('允许任选未完成组，拒绝非法目标、并发、重复和不匹配的完成事件', () => {
    const state = createSession().preliminary
    for (const group of [-1, 7, 0.5, Number.NaN]) expect(beginPruning(state, group, 1)).toBe(false)
    for (const token of [0, -1, 0.5, Number.NaN]) expect(beginPruning(state, 0, token)).toBe(false)
    expect(finishPruning(state, 0, 1)).toBe(false)
    expect(beginPruning(state, 0, 1)).toBe(true)
    expect(beginPruning(state, 1, 2)).toBe(false)
    expect(finishPruning(state, 1, 1)).toBe(false)
    expect(finishPruning(state, 0, 2)).toBe(false)
    expect(finishPruning(state, 0, 1)).toBe(true)
    expect(finishPruning(state, 0, 1)).toBe(false)
    expect(beginPruning(state, 0, 2)).toBe(false)
    expect(state.pruned.filter(Boolean)).toHaveLength(1)
    expect(beginPruning(state, 1, 3)).toBe(true)
    expect(finishPruning(state, 1, 3)).toBe(true)
  })

  it('可先修剪第7组再修剪第2组，完成记录分别保存', () => {
    const state = createSession().preliminary
    expect(beginPruning(state, 6, 1)).toBe(true)
    expect(finishPruning(state, 6, 1)).toBe(true)
    expect(beginPruning(state, 1, 2)).toBe(true)
    expect(finishPruning(state, 1, 2)).toBe(true)
    expect(state.pruned).toEqual([false, true, false, false, false, false, true])
    expect(beginPruning(state, 6, 3)).toBe(false)
    expect(canSelectStep(state, 'soak')).toBe(false)
  })

  it('取消使旧事件失效，正式实验没有修剪步骤', () => {
    const session = createSession()
    const state = session.preliminary
    beginPruning(state, 0, 1)
    cancelPruning(state)
    expect(finishPruning(state, 0, 1)).toBe(false)
    beginPruning(state, 0, 2)
    expect(finishPruning(state, 0, 1)).toBe(false)
    expect(finishPruning(state, 0, 2)).toBe(true)
    expect(session.formal.step).toBe('soak')
    expect(session.formal.pruned).toEqual([])
    expect(canSelectStep(session.formal, 'prune')).toBe(false)
    expect(beginPruning(session.formal, 0, 3)).toBe(false)
    expect(stepComplete(session.formal, 'prune')).toBe(false)
    expect(session.formal.moved.soak).toEqual([false, false, false, false, false])
  })
})

describe('操作前置条件与阶段隔离', () => {
  it('全部枝条修剪、入杯且计时完成后才可进入晾干', () => {
    const state = createSession().preliminary
    expect(canSelectStep(state, 'dry')).toBe(false)
    state.step = 'soak'
    expect(moveGroup(state, 0)).toBe(false)
    state.step = 'prune'
    pruneAll(state)
    state.step = 'soak'
    expect(setProgress(state, 100)).toBe(false)
    expect(moveGroup(state, 0)).toBe(true)
    expect(moveGroup(state, 0)).toBe(false)
    for (const group of [-1, 7, 0.5, Number.NaN]) expect(moveGroup(state, group)).toBe(false)
    for (let group = 1; group < 7; group++) moveGroup(state, group)
    expect(canSelectStep(state, 'dry')).toBe(false)
    setProgress(state, 99)
    expect(stepComplete(state, 'soak')).toBe(false)
    setProgress(state, 100)
    expect(canSelectStep(state, 'dry')).toBe(true)
    expect(canSelectStep(state, 'culture')).toBe(false)
    expect(canSelectStep(state, 'missing' as StepId)).toBe(false)
  })

  it('阶段和步骤状态独立保存，时长及显示编号顺序不变', () => {
    const session = createSession()
    pruneAll(session.preliminary)
    session.preliminary.step = 'soak'
    moveGroup(session.preliminary, 1)
    expect(session.formal.moved.soak).toEqual([false, false, false, false, false])
    expect(session.preliminary.moved.dry.every(value => !value)).toBe(true)
    expect(createSession().preliminary.pruned.every(value => !value)).toBe(true)
    expect(setProgress(session.preliminary, Number.NaN)).toBe(false)
    expect(phases[0].steps).toEqual(['prune', 'soak', 'dry', 'culture'])
    expect(phases[1].steps).toEqual(['soak', 'dry', 'culture'])
    expect(stepDescriptions(phases[0])).toHaveLength(4)
    expect(stepDescriptions(phases[1])).toHaveLength(3)
    expect(durations).toEqual({ soak: 24, dry: 4, culture: 4 })
    expect(durationUnits).toEqual({ soak: '小时', dry: '小时', culture: '天' })
  })
})

describe('计时与动画生命周期', () => {
  it('修剪不运行计时，暂停、切换和重置后旧计时器不再写入', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const paused = ref(false)
    const lab = scope.run(() => useAuxinExperiment(paused))!
    try {
      lab.transfer(0)
      lab.seek(100)
      vi.advanceTimersByTime(10000)
      expect(lab.progress.value).toBe(0)
      expect(lab.allMoved.value).toBe(false)
      completePruning(lab)
      lab.selectStep('soak')
      for (let group = 0; group < 7; group++) lab.transfer(group)
      vi.advanceTimersByTime(1000)
      expect(lab.progress.value).toBeGreaterThan(0)
      paused.value = true
      const stoppedAt = lab.progress.value
      vi.advanceTimersByTime(2000)
      expect(lab.progress.value).toBe(stoppedAt)
      paused.value = false
      for (const step of ['soak', 'dry', 'culture'] as const) completeTimedStep(lab, step)
      paused.value = true
      lab.selectPhase('formal')
      vi.advanceTimersByTime(1000)
      expect(lab.progress.value).toBe(0)
      paused.value = false
      for (let group = 0; group < 5; group++) lab.transfer(group)
      vi.advanceTimersByTime(500)
      expect(lab.progress.value).toBeGreaterThan(0)
      lab.seek(100)
      lab.selectStep('dry')
      for (let group = 0; group < 5; group++) lab.transfer(group)
      vi.advanceTimersByTime(500)
      expect(lab.state.value.progress.dry).toBeGreaterThan(0)
      lab.reset()
      vi.advanceTimersByTime(10000)
      expect(lab.phaseId.value).toBe('preliminary')
      expect(lab.state.value.step).toBe('prune')
      expect(lab.progress.value).toBe(0)
      expect(lab.state.value.moved.soak.every(value => !value)).toBe(true)
    } finally { scope.stop(); vi.useRealTimers() }
  })

  it('暂停保留当前动画，步骤回看、重置、卸载阻止旧回调', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const paused = ref(false)
    const lab = scope.run(() => useAuxinExperiment(paused))!
    try {
      lab.beginPruning(0)
      const firstToken = lab.state.value.activePruning!.token
      paused.value = true
      lab.finishPruning(0, firstToken)
      expect(lab.state.value.pruned[0]).toBe(false)
      expect(lab.state.value.activePruning?.token).toBe(firstToken)
      paused.value = false
      lab.finishPruning(0, firstToken)
      expect(lab.state.value.pruned[0]).toBe(true)
      lab.beginPruning(1)
      const cancelledToken = lab.state.value.activePruning!.token
      lab.selectStep('prune')
      lab.finishPruning(1, cancelledToken)
      expect(lab.state.value.pruned[0]).toBe(true)
      expect(lab.state.value.pruned[1]).toBe(false)
      lab.beginPruning(1)
      const beforeReset = lab.state.value.activePruning!.token
      lab.reset()
      lab.beginPruning(0)
      const afterReset = lab.state.value.activePruning!.token
      expect(afterReset).toBeGreaterThan(beforeReset)
      lab.finishPruning(1, beforeReset)
      expect(lab.state.value.pruned[0]).toBe(false)
      scope.stop()
      lab.finishPruning(0, afterReset)
      lab.beginPruning(2)
      expect(lab.state.value.activePruning).toBeNull()
      expect(lab.state.value.pruned.every(value => !value)).toBe(true)
    } finally { scope.stop(); vi.useRealTimers() }
  })
})
