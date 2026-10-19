import { describe, expect, it } from 'vitest'
import { effectScope, reactive } from 'vue'
import { useBranchTransferVisuals } from './useBranchTransferVisuals'
import type { StepIndex } from './data'

function createVisuals(reducedMotion = false, moved = false) {
  const props = reactive({ step: 1 as StepIndex, moved, dryingProgress: 0, paused: false, reducedMotion })
  const scope = effectScope()
  const visuals = scope.run(() => useBranchTransferVisuals(props))!
  const target = {} as EventTarget
  const event = (type = 'transitionend', propertyName = 'transform') => ({ type, propertyName, target, currentTarget: target }) as TransitionEvent
  return { props, scope, visuals, event }
}

describe('滤纸接触与视觉状态恢复', () => {
  it('移动结束才出现湿痕，回看和重置不接受上一段动画的事件', () => {
    const { props, scope, visuals, event } = createVisuals()
    try {
      props.moved = true
      expect(visuals.paperContact.value).toBe(false)
      visuals.finishLanding(event('transitionend', 'filter'))
      expect(visuals.paperContact.value).toBe(false)
      visuals.finishLanding(event())
      expect(visuals.paperContact.value).toBe(true)
      expect(visuals.animateWet.value).toBe(true)

      props.step = 0
      visuals.finishLanding(event())
      expect(visuals.paperContact.value).toBe(false)
      props.step = 1
      expect(visuals.paperContact.value).toBe(true)
      expect(visuals.animateWet.value).toBe(false)
      expect(visuals.animateTransfer.value).toBe(false)

      props.moved = false
      props.moved = true
      props.step = 0
      props.moved = false
      visuals.finishLanding(event())
      expect(visuals.paperContact.value).toBe(false)
    } finally { scope.stop() }
  })

  it('减少动画时立即反映接触，中途开启也不等待不存在的移动事件', () => {
    const { props, scope, visuals, event } = createVisuals(true)
    try {
      props.moved = true
      expect(visuals.paperContact.value).toBe(true)
      expect(visuals.animateTransfer.value).toBe(false)
      expect(visuals.animateWet.value).toBe(false)
      props.reducedMotion = false
      props.moved = false
      props.moved = true
      expect(visuals.paperContact.value).toBe(false)
      props.reducedMotion = true
      visuals.finishLanding(event())
      expect(visuals.paperContact.value).toBe(true)
      expect(visuals.animateWet.value).toBe(false)
    } finally { scope.stop() }
  })

  it('暂停后调时或回拨时直接恢复湿痕，重新进入已有步骤不重复扩散', () => {
    const { props, scope, visuals, event } = createVisuals()
    try {
      props.moved = true
      visuals.finishLanding(event())
      props.paused = true
      props.dryingProgress = 50
      expect(visuals.paperContact.value).toBe(true)
      expect(visuals.animateWet.value).toBe(false)
      props.paused = false
      props.dryingProgress = 100
      props.dryingProgress = 20
      expect(visuals.animateWet.value).toBe(false)
    } finally { scope.stop() }
    const restored = createVisuals(false, true)
    try {
      expect(restored.visuals.paperContact.value).toBe(true)
      expect(restored.visuals.animateWet.value).toBe(false)
    } finally { restored.scope.stop() }
  })
})
