<template>
  <div class="merge-input-panel">
    <div class="merge-cards">
      <div class="merge-side">
        <h3>Base (Ancestor)</h3>
        <div class="merge-area" @click="triggerFile('base')">
          <input ref="baseInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('base', $event)" class="file-hidden" />
          <span v-if="baseName" class="file-name">{{ baseName }}</span>
          <span v-else class="upload-badge">+ Select base file</span>
        </div>
        <textarea v-model="baseText" placeholder="Or paste base text here..." class="merge-textarea" @input="emitChange"></textarea>
      </div>
      <div class="merge-side ours">
        <h3>Left (Ours)</h3>
        <div class="merge-area" @click="triggerFile('ours')">
          <input ref="oursInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('ours', $event)" class="file-hidden" />
          <span v-if="oursName" class="file-name">{{ oursName }}</span>
          <span v-else class="upload-badge">+ Select our file</span>
        </div>
        <textarea v-model="oursText" placeholder="Or paste our text here..." class="merge-textarea" @input="emitChange"></textarea>
      </div>
      <div class="merge-side theirs">
        <h3>Right (Theirs)</h3>
        <div class="merge-area" @click="triggerFile('theirs')">
          <input ref="theirsInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('theirs', $event)" class="file-hidden" />
          <span v-if="theirsName" class="file-name">{{ theirsName }}</span>
          <span v-else class="upload-badge">+ Select their file</span>
        </div>
        <textarea v-model="theirsText" placeholder="Or paste their text here..." class="merge-textarea" @input="emitChange"></textarea>
      </div>
    </div>
    <div class="merge-actions">
      <button class="merge-btn" :disabled="!ready" @click="$emit('start', { base: baseText, ours: oursText, theirs: theirsText, baseName, oursName, theirsName })">
        Start Merge
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { shouldWarnLargeFile } from '../utils/fileCheck'
import { isKnownTextExtension } from '../utils/detectLanguage'

const emit = defineEmits<{
  start: [data: { base: string; ours: string; theirs: string; baseName: string; oursName: string; theirsName: string }]
}>()

const baseText = ref('')
const oursText = ref('')
const theirsText = ref('')
const baseName = ref('')
const oursName = ref('')
const theirsName = ref('')
const baseInput = ref<HTMLInputElement | null>(null)
const oursInput = ref<HTMLInputElement | null>(null)
const theirsInput = ref<HTMLInputElement | null>(null)

const ready = computed(() => baseText.value && oursText.value && theirsText.value)

function triggerFile(side: 'base' | 'ours' | 'theirs') {
  const map = { base: baseInput, ours: oursInput, theirs: theirsInput }
  map[side].value?.click()
}

async function handleFile(side: 'base' | 'ours' | 'theirs', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const check = shouldWarnLargeFile(file)
  if (check === 'hard') { alert('File too large (>50MB).'); return }
  if (check === 'soft') {
    if (!confirm('File is large (>2MB). Continue?')) return
  }
  if (!isKnownTextExtension(file.name)) {
    if (!confirm(`"${file.name}" not recognized as text. Open as plain text?`)) return
  }
  const text = await file.text()
  if (side === 'base') { baseText.value = text; baseName.value = file.name }
  else if (side === 'ours') { oursText.value = text; oursName.value = file.name }
  else { theirsText.value = text; theirsName.value = file.name }
  input.value = ''
}

function emitChange() {
  // reactivity handles it
}
</script>

<style scoped>
.merge-input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: auto;
}
.merge-cards {
  display: flex;
  gap: 16px;
  flex: 1;
}
.merge-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  background: var(--bg-card-left, #f5f5f5);
}
.merge-side.ours { background: var(--bg-card-left, #f0f7ff); }
.merge-side.theirs { background: var(--bg-card-right, #fef9ee); }
.merge-side h3 { font-size: 13px; color: var(--text-h3, #333); margin: 0; }
.file-hidden { display: none; }
.merge-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border: 2px dashed var(--border-dashed, #ccc);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}
.merge-area:hover {
  border-color: var(--border-dashed-hover, #999);
  background-color: var(--bg-hover, #fafafa);
}
.file-name { font-size: 13px; color: var(--text-primary, #333); font-weight: 500; }
.upload-badge {
  font-size: 12px; font-weight: 600; color: #fff; background: #4a9eff;
  padding: 4px 12px; border-radius: 12px; pointer-events: none; letter-spacing: 0.3px;
}
.merge-textarea {
  flex: 1;
  min-height: 100px;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  border: 1px solid var(--border-input, #ddd);
  border-radius: 4px;
  resize: vertical;
  color: var(--text-primary, #333);
  background: var(--bg-dashed, transparent);
}
.merge-actions {
  display: flex;
  justify-content: center;
}
.merge-btn {
  padding: 10px 32px;
  font-size: 15px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  background: #4a9eff;
  color: #fff;
  min-width: 180px;
}
.merge-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.merge-btn:hover:not(:disabled) { background: #3a8eef; }
</style>
