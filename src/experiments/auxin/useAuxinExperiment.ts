import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { phases, type PhaseId, type StepId } from './data'
import { beginPruning as beginGroup, cancelPruning as cancelGroup, canSelectPhase as canEnterPhase, canSelectStep, createSession, finishPruning as finishGroup, moveGroup, setProgress, stepComplete } from './model'

export function useAuxinExperiment(paused: Ref<boolean>) {
  const sessions = ref(createSession())
  const phaseId = shallowRef<PhaseId>('preliminary')
  const phase = computed(() => phases.find(item => item.id === phaseId.value)!)
  const state = computed(() => sessions.value[phaseId.value])
  const playing = shallowRef(true)
  const notice = shallowRef('')
  let noticeTimer: ReturnType<typeof setTimeout> | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  // 标识在重置后仍递增，旧动画无法命中新会话的同一组枝条。
  let pruningToken = 0
  let disposed = false

  function inform(message: string) {
    notice.value = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { notice.value = '' }, 2600)
  }

  const allMoved = computed(() => state.value.step !== 'prune' && state.value.moved[state.value.step].every(Boolean))
  const complete = computed(() => stepComplete(state.value, state.value.step))
  const progress = computed(() => state.value.step === 'prune' ? 0 : state.value.progress[state.value.step])

  function cancelPruning() {
    cancelGroup(state.value)
  }

  function beginPruning(group: number) {
    if (disposed || paused.value) return
    beginGroup(state.value, group, ++pruningToken)
  }

  function finishPruning(group: number, token: number) {
    if (disposed || paused.value) return
    if (finishGroup(state.value, group, token) && complete.value) inform('全部插条已处理完成')
  }

  function canSelectPhase(id: PhaseId) {
    return canEnterPhase(sessions.value, id)
  }

  function selectPhase(id: PhaseId) {
    if (disposed || !phases.some(item => item.id === id)) return
    if (!canSelectPhase(id)) {
      inform('请先完成预实验的全部操作和计时')
      return
    }
    cancelPruning()
    phaseId.value = id
    playing.value = true
    clearTimeout(noticeTimer)
    notice.value = ''
  }

  function selectStep(step: StepId) {
    if (disposed) return
    if (!canSelectStep(state.value, step)) {
      inform(state.value.step === 'prune' ? '请先处理完全部7组插条' : '请先完成前一步的枝条操作和计时')
      return
    }
    cancelPruning()
    state.value.step = step
    playing.value = true
  }

  function transfer(group: number) {
    if (disposed || paused.value) return
    if (moveGroup(state.value, group)) playing.value = true
  }

  function seek(value: number) {
    if (disposed || paused.value) return
    setProgress(state.value, value)
  }

  // 只运行当前场景的一个计时器；切换步骤、阶段和弹窗时自动清理。
  watch([phaseId, () => state.value.step, allMoved, playing, paused, complete], () => {
    clearInterval(timer)
    timer = undefined
    if (!allMoved.value || complete.value || !playing.value || paused.value) return
    timer = setInterval(() => {
      const wasComplete = stepComplete(state.value, state.value.step)
      setProgress(state.value, progress.value + 1.25)
      if (!wasComplete && stepComplete(state.value, state.value.step)) inform('当前步骤完成')
    }, 100)
  }, { flush: 'sync' })

  watch(paused, value => { if (value) playing.value = false }, { flush: 'sync' })

  function reset() {
    if (disposed) return
    cancelPruning()
    clearInterval(timer)
    clearTimeout(noticeTimer)
    playing.value = false
    sessions.value = createSession()
    phaseId.value = 'preliminary'
    notice.value = ''
    inform('实验已重新开始')
  }

  onScopeDispose(() => {
    disposed = true
    cancelPruning()
    clearInterval(timer)
    clearTimeout(noticeTimer)
  })
  return { phase, phaseId, state, progress, allMoved, complete, playing, notice, canSelectPhase, selectPhase, selectStep, transfer, seek, reset, beginPruning, finishPruning, cancelPruning }
}
