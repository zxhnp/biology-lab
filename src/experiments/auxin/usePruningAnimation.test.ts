import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, reactive } from 'vue'
import { usePruningAnimation } from './usePruningAnimation'

function createAnimation(reducedMotion = false) {
  const props = reactive({ active: null as { group: number; token: number } | null, paused: false, reducedMotion })
  const finish = vi.fn()
  const scope = effectScope()
  const animation = scope.run(() => usePruningAnimation(props, finish))!
  return { props, finish, scope, ...animation }
}

describe('逐组修剪动画生命周期', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('3200毫秒结束时只提交一次当前组', () => {
    const animation = createAnimation()
    try {
      animation.props.active = { group: 3, token: 1 }
      vi.advanceTimersByTime(3160)
      expect(animation.elapsed.value).toBe(3160)
      expect(animation.finish).not.toHaveBeenCalled()
      vi.advanceTimersByTime(40)
      expect(animation.elapsed.value).toBe(3200)
      expect(animation.finish).toHaveBeenCalledExactlyOnceWith(3, 1)
      animation.resume()
      vi.advanceTimersByTime(5000)
      expect(animation.finish).toHaveBeenCalledTimes(1)
    } finally { animation.scope.stop() }
  })

  it('暂停保留进度，关闭暂停后必须手动继续', () => {
    const animation = createAnimation()
    try {
      animation.props.active = { group: 0, token: 2 }
      vi.advanceTimersByTime(800)
      animation.props.paused = true
      expect(animation.needsResume.value).toBe(true)
      animation.resume()
      vi.advanceTimersByTime(2000)
      expect(animation.elapsed.value).toBe(800)
      animation.props.paused = false
      vi.advanceTimersByTime(2000)
      expect(animation.elapsed.value).toBe(800)
      animation.resume()
      expect(animation.needsResume.value).toBe(false)
      vi.advanceTimersByTime(2400)
      expect(animation.finish).toHaveBeenCalledExactlyOnceWith(0, 2)
    } finally { animation.scope.stop() }
  })

  it('替换操作标识后重头操作，旧片段不能提交', () => {
    const animation = createAnimation()
    try {
      animation.props.active = { group: 0, token: 3 }
      vi.advanceTimersByTime(3000)
      animation.props.active = { group: 0, token: 4 }
      expect(animation.elapsed.value).toBe(0)
      vi.advanceTimersByTime(200)
      expect(animation.finish).not.toHaveBeenCalled()
      expect(animation.elapsed.value).toBe(200)
      animation.props.active = { group: 1, token: 5 }
      expect(animation.elapsed.value).toBe(0)
      vi.advanceTimersByTime(3200)
      expect(animation.finish).toHaveBeenCalledExactlyOnceWith(1, 5)
    } finally { animation.scope.stop() }
  })

  it('取消和卸载清理所有计时器且不回调完成', () => {
    const animation = createAnimation()
    animation.props.active = { group: 2, token: 6 }
    vi.advanceTimersByTime(2400)
    animation.props.active = null
    expect(animation.elapsed.value).toBe(0)
    expect(animation.needsResume.value).toBe(false)
    vi.advanceTimersByTime(4000)
    expect(animation.finish).not.toHaveBeenCalled()
    animation.props.active = { group: 2, token: 7 }
    vi.advanceTimersByTime(3000)
    animation.scope.stop()
    animation.resume()
    vi.advanceTimersByTime(4000)
    expect(animation.elapsed.value).toBe(3000)
    expect(animation.finish).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('减少动态效果约800毫秒完成，仍经过剪叶与斜切阶段', () => {
    const animation = createAnimation(true)
    try {
      animation.props.active = { group: 4, token: 8 }
      vi.advanceTimersByTime(200)
      expect(animation.elapsed.value).toBe(800)
      expect(animation.finish).not.toHaveBeenCalled()
      vi.advanceTimersByTime(200)
      expect(animation.elapsed.value).toBe(1600)
      vi.advanceTimersByTime(200)
      expect(animation.elapsed.value).toBe(2400)
      expect(animation.finish).not.toHaveBeenCalled()
      vi.advanceTimersByTime(200)
      expect(animation.elapsed.value).toBe(3200)
      expect(animation.finish).toHaveBeenCalledExactlyOnceWith(4, 8)
    } finally { animation.scope.stop() }
  })

  it('暂停中收到新操作时等待手动继续', () => {
    const animation = createAnimation()
    try {
      animation.props.paused = true
      animation.props.active = { group: 1, token: 9 }
      expect(animation.needsResume.value).toBe(true)
      animation.props.paused = false
      vi.advanceTimersByTime(4000)
      expect(animation.elapsed.value).toBe(0)
      animation.resume()
      vi.advanceTimersByTime(3200)
      expect(animation.finish).toHaveBeenCalledExactlyOnceWith(1, 9)
    } finally { animation.scope.stop() }
  })
})
