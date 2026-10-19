<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { experiments } from './experiments'
import FitStage from './components/FitStage.vue'
import LabIcon from './components/LabIcon.vue'
import ExperimentCatalog from './components/ExperimentCatalog.vue'
import ExperimentIntroduction from './components/ExperimentIntroduction.vue'
import DiscussionDialog from './components/DiscussionDialog.vue'

const screen = shallowRef<'catalog' | 'intro' | 'run'>('catalog')
const selectedId = shallowRef<string | null>(null)
const selected = computed(() => experiments.find(item => item.id === selectedId.value))
const started = shallowRef(false)
const discussionOpen = shallowRef(false)

function select(id: string) {
  const experiment = experiments.find(item => item.id === id)
  if (!experiment?.available || !experiment.runtime) return
  selectedId.value = id
  started.value = false
  screen.value = 'intro'
}

function catalog() {
  screen.value = 'catalog'
  started.value = false
  selectedId.value = null
  discussionOpen.value = false
}

function back() { if (screen.value === 'run') screen.value = 'intro'; else catalog() }
function start() { started.value = true; screen.value = 'run' }
</script>

<template>
  <FitStage>
    <ExperimentCatalog v-if="screen === 'catalog'" :experiments="experiments" @select="select" />
    <template v-else-if="selected">
      <component :is="selected.runtime" v-if="started" v-show="screen === 'run'" :key="selected.id" :paused="discussionOpen || screen !== 'run'" @discussion="discussionOpen = true" />
      <header class="experiment-header"><button class="back-button icon-button" :aria-label="screen === 'run' ? '返回实验资料' : '返回实验目录'" @click="back"><LabIcon name="back" :size="36" /></button><h1>{{ selected.title }}</h1><button class="close-experiment icon-button" aria-label="关闭实验并返回目录" @click="catalog"><LabIcon name="close" :size="36" /><span>关闭</span></button></header>
      <ExperimentIntroduction v-if="screen === 'intro'" :key="selected.id" :experiment="selected" :started="started" @start="start" />
    </template>
  </FitStage>
  <DiscussionDialog v-if="discussionOpen && selected" :questions="selected.discussions" @close="discussionOpen = false" />
</template>
