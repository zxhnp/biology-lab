import { onScopeDispose, shallowRef, watch } from 'vue'

interface PruningAnimationProps {
  active: { group: number; token: number } | null
  paused: boolean
  reducedMotion: boolean
}

const duration = 3200
const tick = 40

export function usePruningAnimation(props: PruningAnimationProps, finish: (group: number, token: number) => void) {
  const elapsed = shallowRef(0)
  const needsResume = shallowRef(false)
  let timer: ReturnType<typeof setInterval> | undefined
  let disposed = false

  function stop() {
    clearInterval(timer)
    timer = undefined
  }

  function start() {
    const active = props.active
    if (disposed || !active || props.paused || elapsed.value >= duration) return
    const { group, token } = active
    stop()
    timer = setInterval(() => {
      // 捕获本次操作的标识；取消或换组后，旧片段不能提交完成。
      if (disposed || props.active?.token !== token || props.active.group !== group) {
        stop()
        return
      }
      if (props.paused || needsResume.value) return
      elapsed.value = Math.min(duration, elapsed.value + (props.reducedMotion ? 160 : tick))
      if (elapsed.value < duration) return
      stop()
      finish(group, token)
    }, tick)
  }

  watch([() => props.active?.group, () => props.active?.token], () => {
    stop()
    elapsed.value = 0
    needsResume.value = Boolean(props.active && props.paused)
    if (props.active && !props.paused) start()
  }, { immediate: true, flush: 'sync' })

  watch(() => props.paused, paused => {
    if (!paused || !props.active || elapsed.value >= duration) return
    stop()
    needsResume.value = true
  }, { flush: 'sync' })

  function resume() {
    if (disposed || !props.active || props.paused || elapsed.value >= duration) return
    needsResume.value = false
    start()
  }

  onScopeDispose(() => {
    disposed = true
    stop()
  })

  return { elapsed, needsResume, resume }
}
