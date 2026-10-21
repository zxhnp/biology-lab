<script setup lang="ts">
import type { Discussion } from '../experiments/types'
defineProps<{ questions: Discussion[] }>()
</script>

<template>
  <div class="discussion-list">
    <details v-for="(item, index) in questions" :key="item.question">
      <summary><span class="question-number">{{ index + 1 }}</span><span class="question-text">{{ item.question }}</span><span class="expand">展开</span><span class="collapse">收起</span></summary>
      <div class="answer"><p v-for="line in item.answer" :key="line">{{ line }}</p></div>
    </details>
  </div>
</template>

<style scoped>
.discussion-list { display: grid; gap: 22px; }
details summary { list-style: none; display: flex; align-items: baseline; gap: 12px; cursor: pointer; font-size: inherit; line-height: 1.55; }
summary::-webkit-details-marker { display: none; }
.question-number { flex: none; border: 1px solid #ddd; border-radius: 50%; width: 25px; height: 25px; line-height: 25px; font-size: 18px; text-align: center; }
.question-text { flex: 1; }
.expand,.collapse { flex: none; color: #aeb4ae; font-size: .72em; }
.expand::before { content: '⌄ '; }
.collapse::before { content: '⌃ '; }
.collapse,details[open] .expand { display: none; }
details[open] .collapse { display: inline; }
.answer { padding: 5px 0 0 37px; color: #52ca8b; font-size: .9em; line-height: 1.6; }
.answer p { margin: 4px 0; }
</style>
