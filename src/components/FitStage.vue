<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'

const host = useTemplateRef<HTMLDivElement>('host')
const scale = shallowRef(1)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    scale.value = Math.min(entry.contentRect.width / 1800, entry.contentRect.height / 900)
  })
  if (host.value) observer.observe(host.value)
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div ref="host" class="fit-host">
    <div class="fit-stage" :style="{ width: `${1800 * scale}px`, height: `${900 * scale}px` }">
      <div class="design-stage" :style="{ transform: `scale(${scale})` }"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.fit-host { width: 100%; height: 100%; display: grid; place-items: center; overflow: hidden; }
.fit-stage { position: relative; flex: none; }
.design-stage { position: absolute; width: 1800px; height: 900px; transform-origin: left top; background: var(--surface); overflow: hidden; }
</style>
