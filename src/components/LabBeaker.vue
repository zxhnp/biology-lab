<script setup lang="ts">
withDefaults(defineProps<{ label?: string; decorative?: boolean }>(), {
  label: '装有半杯透明溶液的烧杯',
  decorative: false,
})
</script>

<template>
  <img class="lab-beaker" src="/assets/glass-beaker-clear.png" :alt="decorative ? '' : label" :aria-hidden="decorative ? true : undefined" draggable="false" />
</template>

<style scoped>
.lab-beaker { display: block; width: 100%; height: 100%; object-fit: fill; pointer-events: none; }
</style>
