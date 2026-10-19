<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
const emit = defineEmits<{ cancel: []; confirm: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" aria-labelledby="restart-title" class="restart-dialog" @cancel.prevent="emit('cancel')">
    <h2 id="restart-title">重新开始实验？</h2><p>将清空预实验和正式实验的当前进度。</p>
    <div><button autofocus @click="emit('cancel')">取消</button><button class="primary" @click="emit('confirm')">重新开始</button></div>
  </dialog>
</template>

<style scoped>
.restart-dialog { color: var(--text); padding: 30px; background: #252d28; border: 1px solid #69766e; width: min(500px,90vw); border-radius: 5px; }
.restart-dialog::backdrop { background: #000a; }
h2 { margin: 0 0 20px; font-size: 24px; }
p { font-size: 18px; margin: 0 0 30px; line-height: 1.5; }
div { display: flex; justify-content: flex-end; gap: 15px; }
button { padding: 10px 20px; border: 1px solid #5f6a63; background: #39463d; border-radius: 4px; font-size: 18px; }
</style>
