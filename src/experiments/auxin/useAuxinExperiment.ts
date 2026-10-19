import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { phases, type PhaseId, type StepIndex } from './data'
import { canSelectStep, createSession, moveGroup, setProgress, stepComplete } from './model'

export function useAuxinExperiment(paused: Ref<boolean>) {
  const sessions = ref(createSession())
  const phaseId = shallowRef<PhaseId>('preliminary')
  const phase = computed(() => phases.find(item => item.id === phaseId.value)!)
  const state = computed(() => sessions.value[phaseId.value])
  const playing = shallowRef(true)
  const notice = shallowRef('')
  let noticeTimer: ReturnType<typeof setTimeout> | undefined
  let timer: ReturnType<typeof setInterval> | undefined

  function inform(message: string) {
    notice.value = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { notice.value = '' }, 2600)
  }

  const allMoved = computed(() => state.value.moved[state.value.step].every(Boolean))
  const complete = computed(() => stepComplete(state.value, state.value.step))
  const progress = computed(() => state.value.progress[state.value.step])

  function selectPhase(id: PhaseId) {
    phaseId.value = id
    playing.value = true
    notice.value = ''
  }

  function selectStep(step: StepIndex) {
    if (!canSelectStep(state.value, step)) {
      inform('请先完成前一步的枝条操作和计时')
      return
    }
    state.value.step = step
    playing.value = true
  }

  function transfer(group: number) {
    if (paused.value) return
    if (moveGroup(state.value, group)) playing.value = true
  }

  function seek(value: number) {
    if (paused.value) return
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

  watch(paused, value => { if (value) playing.value = false })

  function reset() {
    clearInterval(timer)
    clearTimeout(noticeTimer)
    playing.value = false
    sessions.value = createSession()
    phaseId.value = 'preliminary'
    notice.value = ''
    inform('实验已重新开始')
  }

  onScopeDispose(() => { clearInterval(timer); clearTimeout(noticeTimer) })
  return { phase, phaseId, state, progress, allMoved, complete, playing, notice, selectPhase, selectStep, transfer, seek, reset }
}
