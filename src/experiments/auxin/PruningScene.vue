<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import LabIcon from '../../components/LabIcon.vue'
import PruningSprite from './PruningSprite.vue'
import { usePruningAnimation } from './usePruningAnimation'
import type { PhaseState } from './model'

const props = defineProps<{
  pruned: readonly boolean[]
  active: PhaseState['activePruning']
  paused: boolean
  reducedMotion: boolean
}>()
const emit = defineEmits<{ begin: [group: number]; finish: [group: number, token: number] }>()
const toolSelected = shallowRef(false)
const toolHint = shallowRef('')
const { elapsed, needsResume, resume } = usePruningAnimation(props, (group, token) => emit('finish', group, token))
const count = computed(() => props.pruned.filter(Boolean).length)
// 一次操作处理一组，组内依次处理三根，每根约一秒，末尾留出完成反馈。
const workingStem = computed(() => Math.min(2, Math.floor(elapsed.value / 1000)))
const stemElapsed = (stem: number) => Math.max(0, Math.min(3200, (elapsed.value - stem * 1000) * 3.2))
const currentStemElapsed = computed(() => stemElapsed(workingStem.value))
const scissorsClosed = computed(() => [920, 1770, 2620].some(time => currentStemElapsed.value >= time && currentStemElapsed.value < time + 250))
const actionLabel = computed(() => {
  if (!props.active) return count.value === 7 ? '全部处理完成' : toolHint.value || (toolSelected.value ? '点击任意待处理的枝条组' : '先选中右侧小剪刀')
  if (needsResume.value) return `第 ${props.active.group + 1} 组修剪已暂停`
  const prefix = `第 ${props.active.group + 1} 组，第 ${workingStem.value + 1} 根`
  if (currentStemElapsed.value < 1000) return `${prefix}：剪去左侧成熟叶片`
  if (currentStemElapsed.value < 1850) return `${prefix}：剪去右侧成熟叶片`
  if (currentStemElapsed.value < 2700) return `${prefix}：下端剪成斜面`
  return `第 ${props.active.group + 1} 组：修剪完成`
})
// 刀尖沿组内三根依次移动，始终与当前枝条的叶柄、茎基部对齐。
const scissorsStyle = computed(() => {
  const t = currentStemElapsed.value
  return {
    left: `${(t < 1250 ? 36 : t < 2200 ? 40 : 38) + workingStem.value * 29}px`,
    top: `${t < 1250 ? 107 : t < 2200 ? 133 : 172}px`,
    transform: `rotate(${t >= 2200 ? -27 : -5}deg)`,
  }
})
function chooseGroup(group: number) {
  if (props.paused || props.active || props.pruned[group]) return
  if (!toolSelected.value) { toolHint.value = '请先选中右侧小剪刀'; return }
  toolHint.value = ''
  emit('begin', group)
}
watch(() => props.pruned, () => { toolSelected.value = false; toolHint.value = '' })
</script>

<template>
  <section class="pruning-scene" aria-label="处理插条">
    <div class="pruning-heading"><h2>处理插条</h2><p>剪去成熟叶片，下端剪成斜面</p></div>
    <div class="pruning-groups" :class="{ 'tool-ready': toolSelected }" aria-label="7组插条，每组3根">
      <button v-for="group in 7" :key="group" class="pruning-group" :class="{ done: pruned[group - 1], current: active?.group === group - 1 }" :data-testid="`pruning-group-${group - 1}`" :aria-label="`修剪第${group}组，3根枝条，${pruned[group - 1] ? '已处理' : active?.group === group - 1 ? '修剪中' : '待处理'}`" :disabled="paused || !!active || pruned[group - 1]" @click="chooseGroup(group - 1)">
        <div class="group-stems">
          <PruningSprite v-for="stem in 3" :key="stem" :style="{ left: `${(stem - 1) * 29}px` }" :elapsed="active?.group === group - 1 ? stemElapsed(stem - 1) : 0" :complete="pruned[group - 1]" :reduced-motion="reducedMotion" />
          <img v-if="active?.group === group - 1" class="working-scissors" :class="{ reduced: reducedMotion }" :style="scissorsStyle" :src="`/assets/pruning-scissors-${scissorsClosed ? 'closed' : 'open'}.png`" alt="小剪刀正在修剪这一组枝条" draggable="false" />
        </div>
        <div class="group-label"><span>枝条{{ group }}</span><span v-if="pruned[group - 1]" class="group-status"><LabIcon name="check" :size="18" />已处理</span><span v-else-if="active?.group === group - 1" class="group-status">修剪中</span></div>
      </button>
    </div>
    <aside class="pruning-tools" aria-label="修剪工具">
      <button class="scissors-tool" :class="{ selected: toolSelected }" :aria-pressed="toolSelected" :disabled="paused || !!active || count === 7" aria-label="选择小剪刀" @click="toolSelected = !toolSelected; toolHint = ''"><img src="/assets/pruning-scissors-open.png" alt="小剪刀" draggable="false" /><span>{{ toolSelected ? '剪刀已选中' : '小剪刀' }}</span><small>{{ count === 7 ? '全部完成' : active ? '正在修剪' : toolSelected ? '点击枝条组修剪' : '点击选择' }}</small></button>
      <button v-if="active && needsResume && !paused" class="resume-pruning" @click="resume"><LabIcon name="play" :size="18" />继续修剪</button>
    </aside>
    <div class="pruning-summary"><p class="pruning-count" role="status">已处理 <strong>{{ count }}</strong> / 7 组</p><p class="operation-caption" role="status">{{ actionLabel }}</p><div v-if="active" class="cutting-progress" aria-label="当前组修剪进度"><span :style="{ width: `${elapsed / 32}%` }" /></div></div>
  </section>
</template>

<style scoped>
.pruning-scene { position: absolute; inset: 0; }
.pruning-heading { position: absolute; left: 438px; top: 174px; display: flex; align-items: baseline; gap: 22px; }
.pruning-heading h2 { font-size: 27px; font-weight: 400; margin: 0; }
.pruning-heading p { font-size: 19px; color: #b2c1b8; margin: 0; }
/* 与浸泡步骤使用同一组宽、间距及组内三根的坐标。 */
.pruning-groups { position: absolute; top: 330px; left: 345px; right: 170px; height: 340px; display: flex; justify-content: center; gap: 14px; }
.pruning-group { position: relative; flex: 0 0 145px; height: 340px; border: 1px solid transparent; border-radius: 8px; padding: 0; background: none; color: inherit; }
.pruning-group:disabled { cursor: default; opacity: 1; }
.tool-ready .pruning-group:not(:disabled):hover { border-color: #608a70; background: #82cfa60a; }
.group-stems { width: 140px; height: 268px; position: absolute; left: 2px; top: 0; }
.group-stems .pruning-sprite { position: absolute; top: 0; width: 80px; height: 235px; }
.group-label { position: absolute; top: 268px; left: 0; width: 145px; text-align: center; font-size: 18px; line-height: 1.5; display: grid; gap: 7px; }
.group-status { display: flex; align-items: center; justify-content: center; gap: 5px; color: #86d9a1; font-size: 16px; }
.current .group-label { color: #b2e7c6; }
.working-scissors { position: absolute; width: 110px; height: 110px; pointer-events: none; object-fit: contain; transform-origin: 4% 50%; transition: left 200ms, top 200ms, transform 200ms; z-index: 5; }
.working-scissors.reduced { transition: none; }
.pruning-tools { position: absolute; right: 18px; top: 357px; width: 150px; }
.scissors-tool { display: grid; justify-items: center; gap: 7px; padding: 9px 6px 14px; width: 100%; border: 1px solid transparent; background: none; border-radius: 7px; font-size: 21px; color: #d3e0d8; }
.scissors-tool img { width: 125px; height: 110px; object-fit: contain; }
.scissors-tool small { font-size: 15px; color: #a9beb0; }
.scissors-tool:not(:disabled):hover { border-color: #6f9b80; background: #5cad7714; }
.scissors-tool.selected { border-color: #74c78d; background: #34513d; color: #b8ebc8; }
.scissors-tool:disabled { opacity: .6; }
.pruning-summary { position: absolute; left: 440px; right: 220px; bottom: 160px; text-align: center; }
.pruning-count { font-size: 20px; color: #bcd6c7; margin: 0 0 10px; }
.pruning-count strong { color: #83dda3; font-size: 27px; font-weight: 500; }
.operation-caption { color: #becdc4; font-size: 18px; margin: 0; }
.cutting-progress { width: 260px; height: 4px; border-radius: 3px; margin: 15px auto 0; background: #46584b; overflow: hidden; }
.cutting-progress span { display: block; height: 100%; background: #7adba1; }
.resume-pruning { margin: 16px auto 0; display: flex; align-items: center; gap: 5px; background: #345c41; border: 1px solid #86c699; border-radius: 5px; padding: 8px 10px; font-size: 17px; }
</style>
