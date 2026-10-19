<script setup lang="ts">
import { computed } from 'vue'
import LabBeaker from '../../components/LabBeaker.vue'
import FilterPaper from '../../components/FilterPaper.vue'
import { concentrationLabel, type StepIndex, type Triplicate } from './data'
import { useBranchTransferVisuals } from './useBranchTransferVisuals'

const props = defineProps<{
  group: number
  branchNumber: number
  concentration: number
  step: StepIndex
  moved: boolean
  roots: Triplicate
  dryingProgress: number
  paused: boolean
  reducedMotion: boolean
}>()
defineEmits<{ transfer: [group: number] }>()
const seated = computed(() => props.step === 1 ? !props.moved : props.moved)
const action = computed(() => props.step === 1 ? '移至滤纸' : props.step === 2 ? '移入完全营养液' : '移入对应溶液')
const { paperContact, animateWet, animateTransfer, finishLanding } = useBranchTransferVisuals(props)

function rootPath(stem: number, root: number) {
  const x = 43 + stem * 29
  const direction = root % 2 === 0 ? -1 : 1
  const y = 219 + Math.floor(root / 2) * 3
  const endX = x + direction * (11 + root * 2)
  return `M${x} ${y} Q${x + direction * 4} ${y + 12} ${endX} ${y + 21 + root * 2}`
}
</script>

<template>
  <div class="branch-group">
    <FilterPaper v-if="step === 1" class="group-paper" :contacted="paperContact" :drying-progress="dryingProgress" :animate="animateWet" :paused="paused" :reduced-motion="reducedMotion" />
    <span v-if="step === 1" class="paper-label">滤纸</span>
    <button class="branches" :class="{ seated, transferred: moved, moving: animateTransfer }" :disabled="moved" :aria-label="`${action}：${concentrationLabel(concentration)}组`" :data-testid="`transfer-${group}`" @click="$emit('transfer', group)" @transitionend="finishLanding" @transitioncancel="finishLanding">
      <img v-for="stem in 3" :key="stem" src="/assets/rose-cutting.png" alt="" draggable="false" :style="{ left: `${(stem - 1) * 29}px` }" />
      <svg class="roots" viewBox="0 0 140 285" aria-hidden="true">
        <g v-for="(count, stem) in roots" :key="stem"><path v-for="root in count" :key="root" :d="rootPath(stem, root - 1)" /></g>
      </svg>
    </button>
    <span v-if="!seated && step !== 1" class="branch-label">{{ step === 0 ? `枝条${branchNumber}` : `${concentrationLabel(concentration)}浸泡过的枝条` }}</span>
    <div class="beaker-art" aria-hidden="true"><LabBeaker decorative /></div>
    <div class="group-label">
      <span v-if="step === 2">完全营养液</span>
      <span>{{ step === 2 ? concentrationLabel(concentration) : concentration === 0 ? '清水' : `${concentration}ppm` }}</span>
      <span v-if="step !== 2 && concentration !== 0">α-萘乙酸溶液</span>
      <span v-if="step === 2 && moved">浸泡过的枝条</span>
      <span v-else-if="seated">枝条</span>
    </div>
  </div>
</template>

<style scoped>
.branch-group { position: relative; flex: 0 0 145px; height: 650px; }
.branches { width: 140px; height: 268px; position: absolute; left: 2px; top: 0; border: 0; padding: 0; background: none; transform: translateY(0); transition: filter 180ms; z-index: 2; }
.branches.moving { transition: transform 850ms ease-in-out, filter 180ms; }
.branches img { position: absolute; top: 0; width: 80px; height: 235px; object-fit: fill; pointer-events: none; }
.branches:not(:disabled):hover { filter: brightness(1.2); }
.branches:not(:disabled):focus-visible { outline-offset: 4px; border-radius: 12px; }
.branches.seated { transform: translateY(285px); }
.branches:disabled { cursor: default; opacity: 1; }
.roots { position: absolute; inset: 0; width: 140px; height: 285px; pointer-events: none; overflow: visible; }
.roots path { stroke: #d8d4a7; fill: none; stroke-width: 1.3; stroke-linecap: round; }
.beaker-art { position: absolute; top: 390px; left: 0; width: 145px; height: 166px; pointer-events: none; z-index: 3; }
.group-paper { position: absolute; top: 167px; width: 127px; height: 127px; left: 8px; z-index: 1; }
.paper-label { position: absolute; top: 300px; left: 0; width: 145px; text-align: center; font-size: 19px; }
.branch-label { position: absolute; top: 268px; width: 180px; left: -17px; text-align: center; font-size: 18px; line-height: 1.4; }
.group-label { position: absolute; top: 577px; left: -18px; width: 181px; text-align: center; font-size: 22px; line-height: 1.23; display: grid; }
@media (prefers-reduced-motion: reduce) { .branches { transition-duration: 1ms; } }
</style>
