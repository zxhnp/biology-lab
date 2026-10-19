<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 })

const paths: Record<string, string> = {
  back: 'm15 18-6-6 6-6',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
  book: 'M5 3h12a2 2 0 0 1 2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h14M7 7h8M7 11h6',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3v2',
  flask: 'M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10',
  discuss: 'M4 4h16v12H9l-5 4V4Zm4 4h8M8 12h5',
  restart: 'M4 9a8 8 0 1 1 0 7M4 4v5h5',
  table: 'M3 4h18v16H3V4Zm0 5h18M3 14h18M9 4v16M15 4v16',
  chart: 'M3 3v17h18M6 15l4-6 5 4 5-8',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l4 3',
  play: 'm9 5 10 7-10 7V5Z',
  pause: 'M8 5v14M16 5v14',
  leaf: 'M20 3C9 2 3 6 4 13c1 8 14 8 16-10ZM5 19 15 9',
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] || paths.flask" />
  </svg>
</template>
