<script setup lang="ts">
import type { ExperimentDefinition } from '../experiments/types'
import LabIcon from './LabIcon.vue'
defineProps<{ experiments: readonly ExperimentDefinition[] }>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <main class="catalog">
    <div class="catalog-heading"><div class="brand-mark"><img src="/assets/app-icon.png" alt="" /></div><h1>生物实验</h1><p>选择要演示的实验</p></div>
    <div class="experiment-list">
      <button v-for="(experiment, index) in experiments" :key="experiment.id" class="experiment-entry" :class="{ available: experiment.available }" :disabled="!experiment.available" @click="$emit('select', experiment.id)">
        <span class="entry-number">0{{ index + 1 }}</span>
        <span class="entry-copy"><span class="subject">{{ experiment.subject }}</span><strong>{{ experiment.title }}</strong><span class="summary">{{ experiment.summary }}</span></span>
        <span v-if="experiment.available" class="entry-action">进入实验 <LabIcon name="chevron" /></span><span v-else class="pending">待扩展</span>
      </button>
    </div>
    <p class="catalog-footer">高中生物 · 虚拟实验</p>
  </main>
</template>

<style scoped>
.catalog { padding: 65px 160px 40px; }
.catalog-heading { text-align: center; margin-bottom: 42px; }
.brand-mark { display: inline-grid; place-items: center; color: var(--green); margin-bottom: 8px; }
.brand-mark img { width: 64px; height: 64px; object-fit: contain; }
h1 { font-size: 46px; letter-spacing: 8px; margin: 0 0 17px; font-weight: 600; }
.catalog-heading p { font-size: 24px; color: var(--muted); margin: 0; }
.experiment-list { display: grid; gap: 18px; }
.experiment-entry { width: 100%; min-height: 150px; display: flex; align-items: center; text-align: left; gap: 28px; padding: 28px 34px; border: 1px solid #444a46; background: #222523; border-radius: 8px; }
.experiment-entry.available:hover { background: #2a342e; border-color: var(--green); transform: translateX(3px); }
.experiment-entry:disabled { opacity: .58; cursor: default; }
.entry-number { font-size: 35px; color: var(--green); width: 58px; }
.entry-copy { display: grid; gap: 10px; flex: 1; }
.subject { font-size: 18px; color: var(--muted); }
.entry-copy strong { font-size: 27px; font-weight: 500; }
.summary { font-size: 18px; color: var(--muted); }
.entry-action { display: flex; align-items: center; color: var(--green); font-size: 22px; gap: 16px; }
.pending { font-size: 20px; color: var(--muted); }
.catalog-footer { text-align: center; font-size: 17px; margin-top: 30px; color: #989e99; }
</style>
