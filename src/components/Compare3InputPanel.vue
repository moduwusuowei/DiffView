<template>
  <div class="c3-input-panel">
    <div class="c3-toggle">
      <button :class="{ active: inputMode === 'files' }" @click="inputMode = 'files'">Files</button>
      <button :class="{ active: inputMode === 'folders' }" @click="inputMode = 'folders'">Folders</button>
    </div>

    <template v-if="inputMode === 'files'">
      <div class="c3-cards">
        <div
          class="c3-side"
          :class="{ 'drag-over': dragOver === 'left' }"
          @dragover.prevent="dragOver = 'left'"
          @dragleave.prevent="dragOver = ''"
          @drop.prevent="handleFileDrop('left', $event)"
        >
          <h3>Left</h3>
          <div
            class="c3-upload-area"
            @click="triggerFile('left')"
            @paste.prevent="handleDivPaste('left', $event)"
          >
            <input ref="leftInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('left', $event)" class="file-hidden" />
            <span v-if="leftName" class="file-name">{{ leftName }}</span>
            <span v-else class="upload-badge">+ Upload file</span>
          </div>
          <textarea v-model="leftText" placeholder="Or paste left text..." class="c3-textarea"></textarea>
        </div>
        <div
          class="c3-side middle"
          :class="{ 'drag-over': dragOver === 'middle' }"
          @dragover.prevent="dragOver = 'middle'"
          @dragleave.prevent="dragOver = ''"
          @drop.prevent="handleFileDrop('middle', $event)"
        >
          <h3>Middle</h3>
          <div
            class="c3-upload-area"
            @click="triggerFile('middle')"
            @paste.prevent="handleDivPaste('middle', $event)"
          >
            <input ref="middleInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('middle', $event)" class="file-hidden" />
            <span v-if="middleName" class="file-name">{{ middleName }}</span>
            <span v-else class="upload-badge">+ Upload file</span>
          </div>
          <textarea v-model="middleText" placeholder="Or paste middle text..." class="c3-textarea"></textarea>
        </div>
        <div
          class="c3-side"
          :class="{ 'drag-over': dragOver === 'right' }"
          @dragover.prevent="dragOver = 'right'"
          @dragleave.prevent="dragOver = ''"
          @drop.prevent="handleFileDrop('right', $event)"
        >
          <h3>Right</h3>
          <div
            class="c3-upload-area"
            @click="triggerFile('right')"
            @paste.prevent="handleDivPaste('right', $event)"
          >
            <input ref="rightInput" type="file" accept=".txt,.md,.py,text/*" @change="handleFile('right', $event)" class="file-hidden" />
            <span v-if="rightName" class="file-name">{{ rightName }}</span>
            <span v-else class="upload-badge">+ Upload file</span>
          </div>
          <textarea v-model="rightText" placeholder="Or paste right text..." class="c3-textarea"></textarea>
        </div>
      </div>
      <div class="c3-actions">
        <button class="c3-btn" :disabled="!allFilled" @click="emitCompareFiles">Compare</button>
      </div>
    </template>

    <template v-if="inputMode === 'folders'">
      <div class="c3-cards">
        <div
          class="c3-side folder-card"
          :class="{ 'drag-over': folderDragOver === 'left' }"
          @dragover.prevent="folderDragOver = 'left'"
          @dragleave.prevent="folderDragOver = ''"
          @drop.prevent="handleFolderDrop('left', $event)"
        >
          <h3>Left</h3>
          <div class="c3-folder-area" @click="pickDir('left')">
            <span v-if="leftDirName" class="file-name">{{ leftDirName }} ({{ leftCount }} files)</span>
            <span v-else class="upload-badge">+ Select folder</span>
          </div>
          <span v-if="!leftDirName" class="folder-hint">Click or drag a folder</span>
        </div>
        <div
          class="c3-side middle folder-card"
          :class="{ 'drag-over': folderDragOver === 'middle' }"
          @dragover.prevent="folderDragOver = 'middle'"
          @dragleave.prevent="folderDragOver = ''"
          @drop.prevent="handleFolderDrop('middle', $event)"
        >
          <h3>Middle</h3>
          <div class="c3-folder-area" @click="pickDir('middle')">
            <span v-if="middleDirName" class="file-name">{{ middleDirName }} ({{ middleCount }} files)</span>
            <span v-else class="upload-badge">+ Select folder</span>
          </div>
          <span v-if="!middleDirName" class="folder-hint">Click or drag a folder</span>
        </div>
        <div
          class="c3-side folder-card"
          :class="{ 'drag-over': folderDragOver === 'right' }"
          @dragover.prevent="folderDragOver = 'right'"
          @dragleave.prevent="folderDragOver = ''"
          @drop.prevent="handleFolderDrop('right', $event)"
        >
          <h3>Right</h3>
          <div class="c3-folder-area" @click="pickDir('right')">
            <span v-if="rightDirName" class="file-name">{{ rightDirName }} ({{ rightCount }} files)</span>
            <span v-else class="upload-badge">+ Select folder</span>
          </div>
          <span v-if="!rightDirName" class="folder-hint">Click or drag a folder</span>
        </div>
      </div>
      <div class="c3-actions">
        <p v-if="folderError" class="error-msg">{{ folderError }}</p>
        <button class="c3-btn" :disabled="!allFolders" @click="emitCompareFolders">Compare Folders</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { shouldWarnLargeFile } from '../utils/fileCheck'
import { isKnownTextExtension } from '../utils/detectLanguage'
import { pickDirectory, pickDirectoryFromDrop } from '../utils/directoryCompare'
import type { DirSnapshot } from '../utils/directoryCompare'

const emit = defineEmits<{
  compareFiles: [data: { left: string; middle: string; right: string; leftName: string; middleName: string; rightName: string }]
  compareFolders: [data: { left: DirSnapshot; middle: DirSnapshot; right: DirSnapshot }]
}>()

const inputMode = ref<'files' | 'folders'>('files')

// File state
const leftText = ref('')
const middleText = ref('')
const rightText = ref('')
const leftName = ref('')
const middleName = ref('')
const rightName = ref('')
const leftInput = ref<HTMLInputElement | null>(null)
const middleInput = ref<HTMLInputElement | null>(null)
const rightInput = ref<HTMLInputElement | null>(null)
const dragOver = ref('')

// Folder state
const leftDir = ref<DirSnapshot | null>(null)
const middleDir = ref<DirSnapshot | null>(null)
const rightDir = ref<DirSnapshot | null>(null)
const folderDragOver = ref('')
const folderError = ref('')

const leftDirName = computed(() => leftDir.value?.name || '')
const middleDirName = computed(() => middleDir.value?.name || '')
const rightDirName = computed(() => rightDir.value?.name || '')
const leftCount = computed(() => leftDir.value?.files.length || 0)
const middleCount = computed(() => middleDir.value?.files.length || 0)
const rightCount = computed(() => rightDir.value?.files.length || 0)

const allFilled = computed(() => leftText.value && middleText.value && rightText.value)
const allFolders = computed(() => leftDir.value && middleDir.value && rightDir.value)

function triggerFile(side: string) {
  const map: Record<string, any> = { left: leftInput, middle: middleInput, right: rightInput }
  map[side]?.value?.click()
}

async function handleFile(side: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await readFileToSide(file, side as any)
  input.value = ''
}

async function readFileToSide(file: File, side: 'left' | 'middle' | 'right') {
  const check = shouldWarnLargeFile(file)
  if (check === 'hard') { alert('File too large (>50MB).'); return }
  if (check === 'soft') {
    if (!confirm('File is large (>2MB). Continue?')) return
  }
  if (!isKnownTextExtension(file.name)) {
    if (!confirm(`"${file.name}" not recognized as text. Open as plain text?`)) return
  }
  const text = await file.text()
  if (side === 'left') { leftText.value = text; leftName.value = file.name }
  else if (side === 'middle') { middleText.value = text; middleName.value = file.name }
  else { rightText.value = text; rightName.value = file.name }
}

async function handleFileDrop(side: string, event: DragEvent) {
  dragOver.value = ''
  if (!event.dataTransfer) return
  const file = event.dataTransfer.files[0]
  if (!file) return
  await readFileToSide(file, side as any)
}

function handleDivPaste(side: string, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain')
  if (!text) return
  if (side === 'left') leftText.value = text
  else if (side === 'middle') middleText.value = text
  else rightText.value = text
}

function emitCompareFiles() {
  emit('compareFiles', {
    left: leftText.value,
    middle: middleText.value,
    right: rightText.value,
    leftName: leftName.value,
    middleName: middleName.value,
    rightName: rightName.value,
  })
}

// Folder functions
async function pickDir(side: string) {
  folderError.value = ''
  try {
    const snapshot = await pickDirectory()
    if (side === 'left') leftDir.value = snapshot
    else if (side === 'middle') middleDir.value = snapshot
    else rightDir.value = snapshot
  } catch (err) {
    folderError.value = err instanceof Error ? err.message : 'Failed to pick folder'
  }
}

async function handleFolderDrop(side: string, event: DragEvent) {
  folderDragOver.value = ''
  folderError.value = ''
  if (!event.dataTransfer) return
  const item = event.dataTransfer.items[0]
  if (!item) return
  try {
    const snapshot = await pickDirectoryFromDrop(item)
    if (side === 'left') leftDir.value = snapshot
    else if (side === 'middle') middleDir.value = snapshot
    else rightDir.value = snapshot
  } catch (err) {
    folderError.value = err instanceof Error ? err.message : 'Failed to read dropped folder'
  }
}

function emitCompareFolders() {
  if (!leftDir.value || !middleDir.value || !rightDir.value) return
  emit('compareFolders', { left: leftDir.value, middle: middleDir.value, right: rightDir.value })
}
</script>

<style scoped>
.c3-input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow: auto;
}

.c3-toggle {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.c3-toggle button {
  padding: 6px 24px;
  font-size: 14px;
  border: 1px solid var(--border-dashed);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-toolbar);
  color: var(--text-secondary);
}

.c3-toggle button.active {
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

.c3-cards {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.c3-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  background: var(--bg-card-left);
  min-height: 0;
}

.c3-side.middle {
  background: var(--bg-card-right);
}

.c3-side h3 {
  font-size: 13px;
  color: var(--text-h3);
  margin: 0;
}

.c3-side.drag-over {
  border: 2px solid #4a9eff;
}

.file-hidden { display: none; }

.c3-upload-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 2px dashed var(--border-dashed);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
  min-height: 0;
}

.c3-upload-area:hover {
  border-color: var(--border-dashed-hover);
  background-color: var(--bg-hover);
}

.file-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
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

.c3-textarea {
  flex: 1;
  min-height: 0;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  border: 1px solid var(--border-input);
  border-radius: 4px;
  resize: vertical;
  color: var(--text-primary);
  background: var(--bg-dashed);
}

.c3-textarea:focus {
  outline: none;
  border-color: #4a9eff;
}

.c3-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
}

.c3-btn {
  padding: 10px 32px;
  font-size: 15px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  background: #4a9eff;
  color: #fff;
  min-width: 180px;
}

.c3-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.c3-btn:hover:not(:disabled) { background: #3a8eef; }

.folder-card {
  min-height: 240px;
}

.c3-folder-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  border: 2px dashed var(--border-dashed);
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background-color 0.15s;
}

.c3-folder-area:hover {
  border-color: var(--border-dashed-hover);
  background-color: var(--bg-hover);
}

.folder-hint {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.error-msg {
  color: var(--error-text);
  font-size: 13px;
}
</style>
