import { describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { vi } from 'vitest'
import { averages, phases, rootsAtDay } from './data'
import { canSelectStep, createSession, moveGroup, setProgress, stepComplete } from './model'
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

  it('逐日生根使用对应枝条记录，正式实验最高组为5ppm', () => {
    expect(rootsAtDay(phases[0], 2, 0)).toEqual([0, 0, 0])
    expect(rootsAtDay(phases[0], 2, 1)).toEqual([1, 1, 0])
    expect(rootsAtDay(phases[0], 2, 4)).toEqual([4, 6, 5])
    expect(rootsAtDay(phases[1], 3, 4)).toEqual([5, 6, 6])
    expect(phases[1].concentrations[averages(phases[1]).indexOf(Math.max(...averages(phases[1])))]).toBe(5)
  })
})

describe('操作前置条件与阶段隔离', () => {
  it('全部枝条入杯且计时完成后才可进入晾干', () => {
    const state = createSession().preliminary
    expect(canSelectStep(state, 1)).toBe(false)
    expect(setProgress(state, 100)).toBe(false)
    expect(moveGroup(state, 0)).toBe(true)
    expect(moveGroup(state, 0)).toBe(false)
    expect(moveGroup(state, -1)).toBe(false)
    expect(moveGroup(state, 7)).toBe(false)
    for (let group = 1; group < 7; group++) moveGroup(state, group)
    expect(canSelectStep(state, 1)).toBe(false)
    setProgress(state, 99)
    expect(stepComplete(state, 0)).toBe(false)
    setProgress(state, 100)
    expect(canSelectStep(state, 1)).toBe(true)
    expect(canSelectStep(state, 2)).toBe(false)
  })

  it('两阶段分别保存操作，重新创建会话不会继承旧状态', () => {
    const session = createSession()
    moveGroup(session.preliminary, 1)
    expect(session.formal.moved[0]).toEqual([false, false, false, false, false])
    expect(session.preliminary.moved[1].every(value => !value)).toBe(true)
    expect(createSession().preliminary.moved[0].every(value => !value)).toBe(true)
    expect(setProgress(session.preliminary, Number.NaN)).toBe(false)
  })
})

describe('计时生命周期', () => {
  it('暂停、切换阶段和重置后旧计时器不会继续写入', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const paused = ref(false)
    const lab = scope.run(() => useAuxinExperiment(paused))!
    try {
      for (let group = 0; group < 7; group++) lab.transfer(group)
      vi.advanceTimersByTime(1000)
      expect(lab.progress.value).toBeGreaterThan(0)
      paused.value = true
      const stoppedAt = lab.progress.value
      vi.advanceTimersByTime(2000)
      expect(lab.progress.value).toBe(stoppedAt)
      lab.selectPhase('formal')
      vi.advanceTimersByTime(1000)
      expect(lab.progress.value).toBe(0)
      paused.value = false
      for (let group = 0; group < 5; group++) lab.transfer(group)
      vi.advanceTimersByTime(500)
      lab.reset()
      vi.advanceTimersByTime(10000)
      expect(lab.phaseId.value).toBe('preliminary')
      expect(lab.progress.value).toBe(0)
      expect(lab.state.value.moved[0].every(value => !value)).toBe(true)
    } finally { scope.stop(); vi.useRealTimers() }
  })
})
