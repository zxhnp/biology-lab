<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ elapsed?: number; complete?: boolean; reducedMotion?: boolean }>(), { elapsed: 0, complete: false, reducedMotion: false })
// 在同一张未修剪素材中截取成熟叶片和茎尾，与原有完成态共用坐标。
const pieces = [
  { name: 'left-leaf', cutAt: 1000, direction: -1 },
  { name: 'right-leaf', cutAt: 1850, direction: 1 },
  { name: 'stem-tail', cutAt: 2700, direction: 1 },
]
const layers = computed(() => pieces.map(piece => {
  const fall = props.complete ? 1 : Math.min(1, Math.max(0, (props.elapsed - piece.cutAt) / 430))
  return {
    ...piece,
    style: {
      opacity: 1 - fall,
      transform: props.reducedMotion ? 'none' : `translate(${fall * piece.direction * 18}%, ${fall * 16}%) rotate(${fall * piece.direction * 25}deg)`,
    },
  }
}))
</script>

<template>
  <span class="pruning-sprite" aria-hidden="true">
    <img class="finished-stem" src="/assets/rose-cutting.png" alt="" draggable="false" />
    <img v-for="layer in layers" :key="layer.name" :class="layer.name" :style="layer.style" src="/assets/rose-unpruned.png" alt="" draggable="false" />
    <span v-if="!complete && elapsed >= 2700 && elapsed < 3100" class="cut-glint" />
  </span>
</template>

<style scoped>
.pruning-sprite { display: block; position: relative; aspect-ratio: 2 / 3; }
.pruning-sprite img { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; object-fit: fill; }
.left-leaf { clip-path: polygon(0 49%, 40% 49%, 48% 69.5%, 0 69.5%); transform-origin: 47% 69%; }
.right-leaf { clip-path: polygon(53% 69%, 100% 69%, 100% 86%, 53% 81%); transform-origin: 53% 80%; }
.stem-tail { clip-path: polygon(48% 94.4%, 52.5% 94.4%, 52.5% 99%, 48% 99%); transform-origin: 50% 96%; }
.cut-glint { position: absolute; left: 48.7%; top: 95.5%; width: 3%; height: .7%; border-radius: 50%; background: #eedba1; transform: rotate(-30deg); box-shadow: 0 0 10px #e5dcaa; }
</style>
