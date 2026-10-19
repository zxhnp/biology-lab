<script setup lang="ts">
import { shallowRef } from 'vue'
import type { ExperimentDefinition } from '../experiments/types'
import LabIcon from './LabIcon.vue'
import DiscussionList from './DiscussionList.vue'
import LabBeaker from './LabBeaker.vue'

defineProps<{ experiment: ExperimentDefinition; started: boolean }>()
defineEmits<{ start: [] }>()
const tab = shallowRef('principle')
const tabs = [
  { id: 'principle', label: '实验原理', icon: 'book' },
  { id: 'purpose', label: '实验目的', icon: 'target' },
  { id: 'materials', label: '材料用具', icon: 'flask' },
  { id: 'discussion', label: '讨论要点', icon: 'discuss' },
]
</script>

<template>
  <main class="introduction">
    <nav class="intro-tabs" role="tablist" aria-label="实验资料">
      <button v-for="item in tabs" :id="`tab-${item.id}`" :key="item.id" role="tab" :aria-selected="tab === item.id" aria-controls="intro-content" :class="{ selected: tab === item.id }" @click="tab = item.id">{{ item.label }}</button>
    </nav>
    <section id="intro-content" class="intro-content" role="tabpanel" :aria-labelledby="`tab-${tab}`">
      <h2><span class="intro-icon"><LabIcon :name="tabs.find(item => item.id === tab)!.icon" :size="42" /></span>{{ tab === 'purpose' ? '目的要求' : tabs.find(item => item.id === tab)!.label }}：</h2>
      <ol v-if="tab === 'principle' || tab === 'purpose'" class="numbered-copy">
        <li v-for="(line, index) in (tab === 'principle' ? experiment.principle : experiment.purpose)" :key="line"><span class="circled">{{ index + 1 }}</span><span>{{ line }}</span></li>
      </ol>
      <div v-else-if="tab === 'materials'" class="materials">
        <figure v-for="material in experiment.materials" :key="material.name"><div class="material-art" :class="material.kind"><LabBeaker v-if="material.kind === 'beaker'" class="material-beaker" :label="material.name" /><img v-else :src="`./assets/${material.asset}`" :alt="material.name" draggable="false" /></div><figcaption>{{ material.name }}</figcaption></figure>
      </div>
      <DiscussionList v-else :questions="experiment.discussions" />
    </section>
    <button class="primary start-button" @click="$emit('start')">{{ started ? '继续实验' : '开始实验' }}</button>
  </main>
</template>

<style scoped>
.intro-tabs { display: flex; justify-content: center; gap: 46px; height: 60px; margin-top: 24px; }
.intro-tabs button { padding: 0 0 12px; color: #eee; background: none; border: 0; font-size: 25px; position: relative; }
.intro-tabs button.selected { color: var(--green); }
.intro-tabs button.selected::after { content: ''; position: absolute; bottom: 2px; left: 18%; right: 18%; height: 4px; border-radius: 4px; background: var(--green); }
.intro-content { margin: 48px 150px 0; max-height: 560px; overflow-y: auto; font-size: 29px; }
h2 { font-size: 35px; margin: 0 0 35px; display: flex; gap: 25px; align-items: center; }
.intro-icon { color: #70ce90; background: linear-gradient(135deg,#254532,#3e604e); padding: 7px; border-radius: 7px; display: inline-flex; }
.numbered-copy { list-style: none; padding: 0; margin: 0; display: grid; gap: 26px; }
.numbered-copy li { display: flex; gap: 14px; line-height: 1.55; }
.circled { flex: none; width: 30px; height: 30px; line-height: 30px; text-align: center; font-size: 20px; border: 1px solid #b2b7b3; border-radius: 50%; margin-top: 7px; }
.start-button { position: absolute; left: 50%; transform: translateX(-50%); bottom: 40px; width: 280px; height: 74px; font-size: 29px; font-weight: 600; }
.materials { display: flex; gap: 26px; }
figure { margin: 0; text-align: center; }
.material-art { position: relative; width: 180px; height: 180px; border: 1px solid #515853; border-radius: 7px; background: #1c201e; display: grid; place-items: center; overflow: hidden; }
.material-art img { width: 85%; height: 85%; object-fit: contain; position: relative; z-index: 1; }
.material-art.plant img { height: 150px; width: 90px; }
.material-art.paper img { width: 145px; height: 145px; }
.material-art .material-beaker { width: 85%; height: 85%; object-fit: contain; }
figcaption { margin-top: 14px; font-size: 25px; }
</style>
