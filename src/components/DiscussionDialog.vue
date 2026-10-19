<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import type { Discussion } from '../experiments/types'
import DiscussionList from './DiscussionList.vue'
import LabIcon from './LabIcon.vue'
defineProps<{ questions: Discussion[] }>()
const emit = defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="discussion-dialog" aria-labelledby="discussion-title" @cancel.prevent="emit('close')">
    <button class="dialog-close icon-button" aria-label="关闭讨论" @click="emit('close')"><LabIcon name="close" :size="30" /></button>
    <h2 id="discussion-title"><LabIcon name="discuss" :size="36" />讨论：</h2>
    <DiscussionList :questions="questions" />
  </dialog>
</template>

<style scoped>
.discussion-dialog { background: #141917f5; color: var(--text); border: 1px solid #525a54; border-radius: 3px; width: min(1120px, 84vw); max-height: 84vh; padding: 42px 42px 48px; font-size: clamp(18px, 1.65vw, 28px); box-shadow: 0 15px 70px #0007; }
.discussion-dialog::backdrop { background: #0009; }
h2 { display: flex; align-items: center; gap: 16px; font-size: 1.28em; margin: 0 0 35px; }
h2 svg { color: var(--green); }
.dialog-close { position: absolute; right: 18px; top: 16px; }
</style>
