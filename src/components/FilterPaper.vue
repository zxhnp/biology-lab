<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  contacted: boolean
  dryingProgress: number
  animate?: boolean
  paused?: boolean
  reducedMotion?: boolean
}>(), { animate: false, paused: false, reducedMotion: false })

// 视觉湿润程度始终由业务进度派生，拖动时间滑块不会留下另一套状态。
const wetness = computed(() => props.contacted ? 1 - Math.max(0, Math.min(100, props.dryingProgress)) / 100 : 0)
</script>

<template>
  <div class="filter-paper" role="img" :aria-label="wetness > 0 ? '湿润的滤纸' : '干燥的滤纸'" :data-contacted="contacted" :data-wetness="wetness.toFixed(3)">
    <img class="paper-base" src="/assets/filter-paper.png" alt="" draggable="false" />
    <div v-if="contacted" class="wet-visibility" :style="{ opacity: wetness }">
      <img class="wet-map" :class="{ spreading: animate && !reducedMotion }" :style="{ animationPlayState: paused ? 'paused' : 'running' }" src="/assets/filter-paper-wet.png" alt="" draggable="false" />
    </div>
  </div>
</template>

<style scoped>
.filter-paper { position: relative; isolation: isolate; pointer-events: none; }
.paper-base,.wet-map { display: block; width: 100%; height: 100%; object-fit: contain; }
.wet-visibility { position: absolute; inset: 0; mask-image: url('/assets/filter-paper.png'); mask-size: contain; mask-position: center; mask-repeat: no-repeat; }
.wet-map { transform-origin: 50% 48%; }
.wet-map.spreading { animation: wet-spread 700ms ease-out both; }
@keyframes wet-spread {
  from { clip-path: ellipse(17% 8% at 50% 48%); opacity: .45; }
  to { clip-path: ellipse(70% 65% at 50% 48%); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .wet-map.spreading { animation: none; } }
</style>
