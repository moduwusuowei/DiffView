<template>
  <div class="input-panel">
    <div class="input-side left">
      <h3>Left (Original)</h3>
      <div
        class="upload-area"
        @dragover.prevent="onDragOver($event)"
        @dragleave.prevent="onDragLeave($event)"
        @drop.prevent="handleDrop('left', $event)"
        @click="leftInput?.click()"
        @paste.prevent="handleDivPaste('left', $event)"
        :class="{ 'drag-over': leftDragOver }"
      >
        <input
          ref="leftInput"
          type="file"
          accept=".txt,.md,.py,text/*"
          @change="handleFileUpload('left', $event)"
          class="file-input-hidden"
        />
        <span class="upload-badge">+ Upload or drop a file</span>
      </div>
      <textarea
        v-model="leftPaste"
        placeholder="Or paste text here..."
        class="paste-area"
        @input="handlePaste('left')"
      ></textarea>
    </div>

    <div class="input-side right">
      <h3>Right (Modified)</h3>
      <div
        class="upload-area"
        @dragover.prevent="onDragOver($event)"
        @dragleave.prevent="onDragLeave($event)"
        @drop.prevent="handleDrop('right', $event)"
        @click="rightInput?.click()"
        @paste.prevent="handleDivPaste('right', $event)"
        :class="{ 'drag-over': rightDragOver }"
      >
        <input
          ref="rightInput"
          type="file"
          accept=".txt,.md,.py,text/*"
          @change="handleFileUpload('right', $event)"
          class="file-input-hidden"
        />
        <span class="upload-badge">+ Upload or drop a file</span>
      </div>
      <textarea
        v-model="rightPaste"
        placeholder="Or paste text here..."
        class="paste-area"
        @input="handlePaste('right')"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { shouldWarnLargeFile } from '../utils/fileCheck'
import { isKnownTextExtension } from '../utils/detectLanguage'

const emit = defineEmits<{
  'update:left': [data: { text: string; filename: string }]
  'update:right': [data: { text: string; filename: string }]
}>()

const leftPaste = ref('')
const rightPaste = ref('')
const leftInput = ref<HTMLInputElement | null>(null)
const rightInput = ref<HTMLInputElement | null>(null)
const leftDragOver = ref(false)
const rightDragOver = ref(false)

function emitUpdate(side: 'left' | 'right', data: { text: string; filename: string }) {
  if (side === 'left') {
    emit('update:left', data)
  } else {
    emit('update:right', data)
  }
}

function onDragOver(event: DragEvent) {
  const el = event.currentTarget as HTMLElement
  if (el === leftInput.value?.parentElement) {
    leftDragOver.value = true
  } else {
    rightDragOver.value = true
  }
}

function onDragLeave(event: DragEvent) {
  const el = event.currentTarget as HTMLElement
  if (el === leftInput.value?.parentElement) {
    leftDragOver.value = false
  } else {
    rightDragOver.value = false
  }
}

async function readFile(file: File, side: 'left' | 'right') {
  const check = shouldWarnLargeFile(file)
  if (check === 'hard') {
    alert('File is too large (>50MB). Please choose a smaller file.')
    return
  }
  if (check === 'soft') {
    const proceed = confirm('File is large (>2MB). Browser may lag. Continue?')
    if (!proceed) return
  }

  if (!isKnownTextExtension(file.name)) {
    const proceed = confirm(
      `"${file.name}" does not have a recognized text extension. Open as plain text?`
    )
    if (!proceed) return
  }

  const text = await file.text()
  emitUpdate(side, { text, filename: file.name })
}

async function handleFileUpload(side: 'left' | 'right', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await readFile(file, side)
  input.value = ''
}

async function handleDrop(side: 'left' | 'right', event: DragEvent) {
  leftDragOver.value = false
  rightDragOver.value = false
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) return
  const file = dataTransfer.files[0]
  if (!file) return
  await readFile(file, side)
}

function handleDivPaste(side: 'left' | 'right', event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain')
  if (text) {
    if (side === 'left') leftPaste.value = text
    else rightPaste.value = text
    emitUpdate(side, { text, filename: '' })
  }
}

function handlePaste(side: 'left' | 'right') {
  const text = side === 'left' ? leftPaste.value : rightPaste.value
  emitUpdate(side, { text, filename: '' })
}
</script>

<style scoped>
.input-panel {
  display: flex;
  flex: 1;
  gap: 16px;
  padding: 16px;
  overflow: auto;
}

.input-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.input-side.left {
  background-color: var(--bg-card-left);
}

.input-side.right {
  background-color: var(--bg-card-right);
}

.input-side h3 {
  font-size: 14px;
  color: var(--text-h3);
}

.file-input-hidden {
  display: none;
}

.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  border: 2px dashed var(--border-dashed);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.upload-area:hover {
  border-color: var(--border-dashed-hover);
  background-color: var(--bg-hover);
}

.upload-area.drag-over {
  border-color: #4a9eff;
  background-color: var(--bg-card-left);
}

.upload-badge {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #4a9eff;
  padding: 4px 12px;
  border-radius: 12px;
  pointer-events: none;
  letter-spacing: 0.3px;
}

.paste-area {
  flex: 1;
  min-height: 120px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 26px;
  border: 1px solid var(--border-input);
  border-radius: 4px;
  resize: vertical;
  color: var(--text-primary);
  background: var(--bg-dashed);
}

.paste-area:focus {
  outline: none;
  border-color: #4a9eff;
}
</style>
