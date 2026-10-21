import { shallowRef, watch } from 'vue'
import type { TimedStepId } from './data'

interface TransferVisualProps {
  step: TimedStepId
  moved: boolean
  dryingProgress: number
  paused: boolean
  reducedMotion: boolean
}

export function useBranchTransferVisuals(props: TransferVisualProps) {
  const paperContact = shallowRef(props.step === 'dry' && props.moved)
  const animateWet = shallowRef(false)
  const animateTransfer = shallowRef(false)
  let awaitingLanding = false

  watch([() => props.step, () => props.moved], ([step, moved], [previousStep, previousMoved]) => {
    animateWet.value = false
    animateTransfer.value = step === previousStep && moved && !previousMoved && !props.reducedMotion
    awaitingLanding = step === 'dry' && animateTransfer.value
    paperContact.value = step === 'dry' && moved && !awaitingLanding
  }, { flush: 'sync' })

  function finishLanding(event: TransitionEvent) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !awaitingLanding) return
    awaitingLanding = false
    if (props.step !== 'dry' || !props.moved) return
    paperContact.value = true
    animateWet.value = event.type === 'transitionend'
  }

  watch(() => props.reducedMotion, reduced => {
    if (!reduced) return
    awaitingLanding = false
    paperContact.value = props.step === 'dry' && props.moved
    animateWet.value = false
    animateTransfer.value = false
  }, { flush: 'sync' })

  watch(() => props.dryingProgress, (progress, previousProgress) => {
    // 暂停后调时、回拨或跳到终点时直接恢复目标湿痕，不续播旧的扩散片段。
    if (props.paused || progress < previousProgress || progress >= 100) animateWet.value = false
  }, { flush: 'sync' })

  return { paperContact, animateWet, animateTransfer, finishLanding }
}
