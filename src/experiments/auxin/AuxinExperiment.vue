<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import LabIcon from '../../components/LabIcon.vue'
import RestartDialog from '../../components/RestartDialog.vue'
import BranchGroup from './BranchGroup.vue'
import AuxinResults from './AuxinResults.vue'
import PruningScene from './PruningScene.vue'
import { durations, durationUnits, phases, rootsAtDay, stepDescriptions } from './data'
import { canSelectStep, stepComplete } from './model'
import { useAuxinExperiment } from './useAuxinExperiment'
import { useReducedMotion } from '../../composables/useReducedMotion'

const props = withDefaults(defineProps<{ paused: boolean; active?: boolean }>(), { active: true })
defineEmits<{ discussion: [] }>()
const resetOpen = shallowRef(false)
const operationPaused = computed(() => props.paused || !props.active || resetOpen.value)
const {
  phase, phaseId, state, progress, allMoved, complete, playing, notice,
  selectPhase, selectStep, transfer, seek, reset, beginPruning, finishPruning, cancelPruning,
} = useAuxinExperiment(operationPaused)
const panelOpen = shallowRef(true)
const reducedMotion = useReducedMotion()
const descriptions = computed(() => stepDescriptions(phase.value))
const hasResult = computed(() => state.value.step === 'culture' && stepComplete(state.value, 'culture'))
const day = computed(() => state.value.step === 'culture' ? Math.floor(progress.value / 25) : 0)
const timing = computed(() => state.value.step === 'prune' ? null : { duration: durations[state.value.step], unit: durationUnits[state.value.step] })
const progressText = computed(() => timing.value ? `${Math.round(progress.value / 100 * timing.value.duration * 10) / 10}${timing.value.unit}` : '')
const hint = computed(() => {
  if (complete.value) return state.value.step === 'culture' ? '点击图表右侧按钮，切换查看逐日记录' : '当前步骤完成，点击左侧下一步骤'
  if (state.value.step === 'prune') return '先选中右侧剪刀，再点击枝条组修剪；全部7组处理完成后进入浸泡'
  if (allMoved.value) return '可拖动时间滑块，或点击时钟暂停 / 继续'
  return { soak: '点击各组枝条，移入对应的溶液', dry: '点击杯中的枝条，将其移至滤纸', culture: '点击滤纸上的枝条，移入清水' }[state.value.step]
})
// 返回资料时取消当前动作；讨论仅暂停，保留当前剪口进度。
watch(() => props.active, active => { if (!active) cancelPruning() }, { flush: 'sync' })

function toggleResults() { state.value.resultView = state.value.resultView === 'chart' ? 'table' : 'chart' }
function confirmReset() { resetOpen.value = false; reset(); panelOpen.value = true }
</script>

<template>
  <main class="auxin-experiment" aria-label="插条生根实验操作区">
    <div v-if="notice" class="toast" role="status"><LabIcon name="check" :size="20" />{{ notice }}</div>
    <AuxinResults v-if="hasResult" :phase="phase" :view="state.resultView" @toggle="toggleResults" />
    <PruningScene v-if="state.step === 'prune'" :key="phaseId" :pruned="state.pruned" :active="state.activePruning" :paused="operationPaused" :reduced-motion="reducedMotion" @begin="beginPruning" @finish="finishPruning" />
    <div v-else class="specimens" :class="{ formal: phaseId === 'formal' }">
      <BranchGroup v-for="(concentration, index) in phase.concentrations" :key="`${phaseId}-${index}`" :group="index" :branch-number="phase.firstBranch + index" :concentration="concentration" :step="state.step" :moved="state.moved[state.step][index]" :roots="rootsAtDay(phase, index, day)" :drying-progress="state.progress.dry" :paused="operationPaused || (allMoved && !playing)" :reduced-motion="reducedMotion" @transfer="transfer" />
    </div>
    <aside class="steps-panel" :class="{ collapsed: !panelOpen, extended: phase.steps.length === 4 }" aria-label="实验步骤">
      <div class="step-buttons">
        <button v-for="(step, index) in phase.steps" :key="step" :class="{ active: state.step === step, locked: !canSelectStep(state, step) }" :aria-current="state.step === step ? 'step' : undefined" :aria-disabled="!canSelectStep(state, step)" @click="selectStep(step)">
          <span>{{ phase.prefix }}-{{ index + 1 }}</span> {{ descriptions[index] }}<LabIcon v-if="stepComplete(state, step)" name="check" class="step-check" :size="22" />
        </button>
      </div>
      <button class="collapse-panel" :aria-label="panelOpen ? '收起步骤面板' : '展开步骤面板'" :aria-expanded="panelOpen" @click="panelOpen = !panelOpen"><LabIcon name="chevron" :style="{ transform: panelOpen ? 'rotate(180deg)' : '' }" /></button>
    </aside>
    <div class="experiment-hint" role="status">{{ hint }}</div>
    <div v-if="allMoved && !hasResult && timing" class="time-control">
      <input aria-label="实验时间进度" type="range" min="0" max="100" step="1" :value="progress" :style="{ '--progress': `${progress}%` }" @input="seek(Number(($event.target as HTMLInputElement).value))" />
      <button class="clock-button" :aria-label="playing && !complete ? '暂停计时' : '继续计时'" :disabled="complete" @click="playing = !playing"><LabIcon :name="playing && !complete ? 'pause' : complete ? 'check' : 'play'" :size="25" /></button>
      <span class="time-total">{{ timing.duration }}{{ timing.unit }}</span><span class="time-current">{{ progressText }}</span>
    </div>
    <nav class="phase-tabs" aria-label="实验阶段"><button v-for="item in phases" :key="item.id" :class="{ active: phaseId === item.id }" :aria-pressed="phaseId === item.id" @click="selectPhase(item.id)">{{ item.prefix }}. {{ item.name }}</button></nav>
    <div class="lab-actions"><button @click="$emit('discussion')"><LabIcon name="discuss" /><span>讨论要点</span></button><span class="action-divider" /><button @click="resetOpen = true; playing = false"><LabIcon name="restart" /><span>重新开始</span></button></div>
    <RestartDialog v-if="resetOpen" @cancel="resetOpen = false" @confirm="confirmReset" />
  </main>
</template>

<style scoped>
.auxin-experiment { position: absolute; inset: 0; }
.specimens { position: absolute; top: 108px; left: 345px; right: 170px; height: 650px; display: flex; justify-content: center; gap: 14px; }
.specimens.formal { gap: 28px; }
.steps-panel { position: absolute; top: 418px; bottom: 110px; left: 24px; width: 292px; background: #202423; border: 1px solid #505650; border-radius: 5px; box-shadow: 0 2px 8px #000a; z-index: 6; transition: transform .25s; }
.steps-panel.extended { top: 286px; }
.steps-panel.collapsed { transform: translateX(-315px); }
.step-buttons { padding: 8px; display: grid; gap: 8px; }
.step-buttons button { text-align: left; font-size: 18.5px; line-height: 1.4; padding: 11px 10px 15px; border: 1px solid #5a615c; border-radius: 6px; background: #343938; position: relative; }
.step-buttons button:hover { border-color: #a6c5b1; }
.step-buttons button.active { background: var(--green-dark); border-color: #5fc88d; }
.step-buttons button.locked { color: #d0d4d1; }
.step-buttons button span { white-space: nowrap; }
.step-check { position: absolute; right: 4px; bottom: 3px; color: #dcffe5; }
.collapse-panel { position: absolute; left: 100%; top: 42%; width: 34px; height: 64px; background: #252a28; border: 1px solid #4c554e; border-left: none; border-radius: 0 20px 20px 0; display: grid; place-items: center; }
.phase-tabs { position: absolute; left: 24px; bottom: 20px; display: flex; gap: 22px; z-index: 7; }
.phase-tabs button { font-size: 26px; border: 1px solid #555d57; border-radius: 5px; padding: 14px 16px; background: #1e2321; box-shadow: 0 2px 5px #0008; }
.phase-tabs button.active { background: var(--green-dark); border-color: #43ba71; }
.lab-actions { position: absolute; right: 25px; bottom: 22px; display: flex; align-items: center; gap: 24px; }
.lab-actions button { border: 0; background: none; color: #d0d5d1; display: grid; justify-items: center; gap: 5px; font-size: 20px; padding: 4px; }
.lab-actions button:hover { color: #fff; }
.action-divider { height: 50px; width: 1px; background: #8b938e; }
.time-control { position: absolute; bottom: 45px; left: 650px; width: 660px; height: 56px; display: flex; align-items: flex-start; gap: 28px; }
.time-control input { flex: 1; margin-top: 16px; appearance: none; background: linear-gradient(to right,#62c3c8,#72cca3) 0/var(--progress) 100% no-repeat,#414945; height: 6px; border-radius: 8px; cursor: pointer; box-shadow: 0 1px 4px #0008; }
.time-control input::-webkit-slider-thumb { appearance: none; background: #f3f6f3; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 2px 6px #0008; }
.clock-button { width: 43px; height: 43px; border-radius: 50%; display: grid; place-items: center; border: 2px solid #d7efe2; background: #5da78c; }
.time-total { position: absolute; right: -5px; top: 54px; font-size: 19px; }
.time-current { position: absolute; left: 0; top: 34px; color: #a5b8ad; font-size: 15px; }
.experiment-hint { position: absolute; bottom: 104px; left: 440px; right: 240px; text-align: center; color: #bac8be; font-size: 17px; }
.toast { position: absolute; top: 68px; left: 50%; transform: translateX(-50%); z-index: 15; display: flex; align-items: center; gap: 8px; color: #183a25; background: #f1faf3; padding: 10px 16px; border-radius: 5px; font-size: 18px; box-shadow: 0 2px 8px #0005; }
</style>
