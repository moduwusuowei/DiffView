<template>
  <div class="app-container">
    <div class="mode-bar">
      <div class="logo-area" @click="goHome" style="cursor:pointer">
        <svg class="logo" viewBox="0 0 500 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="primary" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#4a9eff"/>
              <stop offset="100%" stop-color="#2b7de9"/>
            </linearGradient>
            <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#f39c12"/>
              <stop offset="100%" stop-color="#e67e22"/>
            </linearGradient>
          </defs>
          <rect x="12" y="18" width="48" height="64" rx="6" fill="#e8f0fe" stroke="url(#primary)" stroke-width="2.5"/>
          <rect x="68" y="18" width="48" height="64" rx="6" fill="#e8f0fe" stroke="url(#primary)" stroke-width="2.5"/>
          <line x1="24" y1="34" x2="48" y2="34" stroke="#4a9eff" stroke-width="3" stroke-linecap="round"/>
          <line x1="24" y1="44" x2="48" y2="44" stroke="#4a9eff" stroke-width="3" stroke-linecap="round"/>
          <line x1="24" y1="54" x2="48" y2="54" stroke="#4a9eff" stroke-width="3" stroke-linecap="round"/>
          <line x1="80" y1="34" x2="104" y2="34" stroke="#4a9eff" stroke-width="3" stroke-linecap="round"/>
          <line x1="80" y1="44" x2="104" y2="44" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>
          <line x1="80" y1="54" x2="104" y2="54" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>
          <line x1="80" y1="64" x2="104" y2="64" stroke="#27ae60" stroke-width="3" stroke-linecap="round"/>
          <text x="138" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="63" font-weight="700" letter-spacing="-0.5" fill="currentColor">Diff</text>
          <text x="275" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="63" font-weight="700" letter-spacing="-0.5" fill="currentColor">View</text>
        </svg>
      </div>
      <button
        class="mode-btn"
        :class="{ active: mode === 'file' }"
        @click="switchMode('file')"
      >File Compare</button>
      <button
        class="mode-btn"
        :class="{ active: mode === 'folder' }"
        @click="switchMode('folder')"
      >Folder Compare</button>
      <button
        class="mode-btn"
        :class="{ active: mode === 'merge' }"
        @click="switchMode('merge')"
      >3-Way Merge</button>
      <div class="mode-bar-spacer"></div>
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
        {{ isDark ? '☀' : '☾' }}
      </button>
      <button class="shortcuts-btn" @click="showShortcuts = !showShortcuts" title="Keyboard shortcuts">?</button>
    </div>

    <!-- File Mode -->
    <template v-if="mode === 'file'">
      <Toolbar
        :left-filename="leftFilename"
        :right-filename="rightFilename"
        :ignore-whitespace="ignoreWhitespace"
        :word-wrap="wordWrap"
        :font-size="fontSize"
        :algo="diffAlgo"
        :has-content="hasContent"
        :has-diffs="hasDiffs"
        @toggle-ignore-whitespace="ignoreWhitespace = !ignoreWhitespace"
        @toggle-word-wrap="wordWrap = !wordWrap"
        @font-size-change="fontSize = Math.max(10, Math.min(30, fontSize + $event))"
        @toggle-algo="diffAlgo = diffAlgo === 'advanced' ? 'legacy' : 'advanced'"
        @previous-diff="previousDiff"
        @next-diff="nextDiff"
        @download-left="handleDownload('left')"
        @download-right="handleDownload('right')"
        @export-html="handleExportHtml"
        @export-json="handleExportJson"
      />

      <FileInputPanel
        v-if="!hasContent"
        @update:left="handleInput('left', $event)"
        @update:right="handleInput('right', $event)"
      />

      <div v-if="hasContent" class="file-bar">
        <span class="file-info">Left: {{ leftFilename || 'untitled' }}</span>
        <span class="file-info">Right: {{ rightFilename || 'untitled' }}</span>
        <div v-if="hasDiffs" class="diff-stats">
          <span class="stat stat-add">+{{ diffStats.additions }}</span>
          <span class="stat stat-del">-{{ diffStats.deletions }}</span>
          <span class="stat stat-mod">~{{ diffStats.modifications }}</span>
        </div>
        <button class="change-btn" @click="resetInput">Change files</button>
      </div>

      <DiffEditorPanel
        v-if="hasContent"
        ref="diffEditorRef"
        :left-text="leftText"
        :right-text="rightText"
        :language="language"
        :ignore-whitespace="ignoreWhitespace"
        :word-wrap="wordWrap"
        :font-size="fontSize"
        :algo="diffAlgo"
        :dark="isDark"
        @update:left-text="leftText = $event"
        @update:right-text="rightText = $event"
        @diffs-change="hasDiffs = $event"
        @stats-change="diffStats = $event"
      />

      <div v-if="!hasContent" class="empty-hint">
        <p v-if="!leftText && !rightText">Upload or paste text on both sides to start comparing.</p>
        <p v-else-if="!leftText">Left side is empty — upload or paste the original text.</p>
        <p v-else>Right side is empty — upload or paste the modified text.</p>
      </div>

    </template>

    <!-- Folder Mode -->
    <template v-if="mode === 'folder'">
      <!-- Folder Input -->
      <template v-if="folderView === 'input'">
        <Toolbar
          :left-filename="leftDir?.name || ''"
          :right-filename="rightDir?.name || ''"
          :ignore-whitespace="ignoreWhitespace"
          :word-wrap="wordWrap"
          :font-size="fontSize"
          :algo="diffAlgo"
          :has-content="false"
          :has-diffs="false"
          @font-size-change="fontSize = Math.max(10, Math.min(30, fontSize + $event))"
@toggle-algo="diffAlgo = diffAlgo === 'advanced' ? 'legacy' : 'advanced'"
        />
        <FolderInputPanel
          :left-name="leftDir?.name || ''"
          :right-name="rightDir?.name || ''"
          :left-count="leftDir?.files.length || 0"
          :right-count="rightDir?.files.length || 0"
          :error="folderError"
          @pickleft="pickFolder('left')"
          @pickright="pickFolder('right')"
          @compare="runCompare"
          @back="resetFolder"
        />
      </template>

      <!-- Folder Compare Tree -->
      <FolderComparePanel
        v-if="folderView === 'tree'"
        :results="compareResults"
        :left-name="leftDir?.name || ''"
        :right-name="rightDir?.name || ''"
        :selected-path="selectedFilePath"
        @select-file="openFileDiff"
        @back="folderView = 'input'"
      />

      <!-- Folder File Diff -->
      <template v-if="folderView === 'file-diff'">
        <div class="file-bar">
          <span class="file-info">Left: {{ `.../${selectedFilePath}` }}</span>
          <span class="file-info">Right: {{ `.../${selectedFilePath}` }}</span>
          <button class="change-btn" @click="folderView = 'tree'">Back to folder view</button>
        </div>
        <DiffEditorPanel
          ref="folderDiffRef"
          :left-text="folderLeftText"
          :right-text="folderRightText"
          :language="folderFileLanguage"
          :ignore-whitespace="ignoreWhitespace"
          :word-wrap="wordWrap"
          :font-size="fontSize"
          :algo="diffAlgo"
          :dark="isDark"
          @diffs-change="hasDiffs = $event"
          @stats-change="diffStats = $event"
        />
      </template>
    </template>

    <!-- Merge Mode -->
    <template v-if="mode === 'merge'">
      <MergeInputPanel
        v-if="mergeView === 'input'"
        @start="handleMergeStart"
      />
      <MergeEditorPanel
        v-if="mergeView === 'merge'"
        :base="mergeBase"
        :ours="mergeOurs"
        :theirs="mergeTheirs"
        :base-name="mergeBaseName"
        :ours-name="mergeOursName"
        :theirs-name="mergeTheirsName"
        :language="language"
        :dark="isDark"
        @back="mergeView = 'input'"
      />
    </template>
    <div v-if="showShortcuts" class="shortcuts-overlay" @click="showShortcuts = false">
      <div class="shortcuts-modal" @click.stop>
        <div class="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="close-btn" @click="showShortcuts = false">&times;</button>
        </div>
        <div class="shortcuts-body">
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>D</kbd><span>Next diff</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd><span>Previous diff</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>W</kbd><span>Toggle word wrap</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>I</kbd><span>Toggle ignore whitespace</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>Enter</kbd><span>Start folder comparison</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>L</kbd><span>Download left file</span></div>
          <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>R</kbd><span>Download right file</span></div>
          <div class="shortcut-row"><kbd>?</kbd><span>Toggle this panel</span></div>
          <div class="shortcut-row"><kbd>Esc</kbd><span>Close this panel</span></div>
        </div>
      </div>
    </div>
    <div class="privacy-hint">
      <div>All processing happens locally in your browser. No data is uploaded.</div>
      <div>Open Source &copy; 2026 <a href="https://github.com/moduwusuowei" target="_blank" rel="noopener">moduwusuowei</a>. Licensed under MIT.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { detectLanguageFromFilename } from './utils/detectLanguage'
import { buildDownloadFilename, downloadTextFile } from './utils/downloadFile'
import { buildDiffLines, exportHtml, exportJson } from './utils/exportReport'
import { pickDirectory, compareDirs, readFileFromDir } from './utils/directoryCompare'
import type { CompareResult, DirSnapshot } from './utils/directoryCompare'
import FileInputPanel from './components/FileInputPanel.vue'
import Toolbar from './components/Toolbar.vue'
import DiffEditorPanel from './components/DiffEditorPanel.vue'
import FolderInputPanel from './components/FolderInputPanel.vue'
import FolderComparePanel from './components/FolderComparePanel.vue'
import MergeInputPanel from './components/MergeInputPanel.vue'
import MergeEditorPanel from './components/MergeEditorPanel.vue'

// File mode state
const leftText = ref('')
const rightText = ref('')
const leftFilename = ref('')
const rightFilename = ref('')
const ignoreWhitespace = ref(false)
const wordWrap = ref(true)
const fontSize = ref(14)
const diffAlgo = ref<'advanced' | 'legacy'>('advanced')
const hasDiffs = ref(false)
const diffStats = ref({ additions: 0, deletions: 0, modifications: 0 })
const diffEditorRef = ref<InstanceType<typeof DiffEditorPanel> | null>(null)

// Folder mode state
const folderView = ref<'input' | 'tree' | 'file-diff'>('input')
const folderError = ref('')
const selectedFilePath = ref('')
const folderLeftText = ref('')
const folderRightText = ref('')
const folderFileLanguage = ref('plaintext')
const folderDiffRef = ref<InstanceType<typeof DiffEditorPanel> | null>(null)

const leftDir = ref<DirSnapshot | null>(null)

// Merge mode state
const mergeView = ref<'input' | 'merge'>('input')
const mergeBase = ref('')
const mergeOurs = ref('')
const mergeTheirs = ref('')
const mergeBaseName = ref('')
const mergeOursName = ref('')
const mergeTheirsName = ref('')
const rightDir = ref<DirSnapshot | null>(null)
const compareResults = ref<CompareResult[]>([])

// Mode
const mode = ref<'file' | 'folder' | 'merge'>('file')

// Shortcuts
const showShortcuts = ref(false)

// Dark mode
const isDark = ref(localStorage.getItem('diffview-theme') === 'dark')

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showShortcuts.value = false
    e.preventDefault()
    return
  }
  if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
    showShortcuts.value = !showShortcuts.value
    e.preventDefault()
    return
  }
  const ctrl = e.ctrlKey || e.metaKey
  if (!ctrl) return
  switch (e.key.toLowerCase()) {
    case 'd':
      e.preventDefault()
      if (e.shiftKey) previousDiff()
      else nextDiff()
      break
    case 'w':
      e.preventDefault()
      wordWrap.value = !wordWrap.value
      break
    case 'i':
      e.preventDefault()
      ignoreWhitespace.value = !ignoreWhitespace.value
      break
    case 'enter':
      e.preventDefault()
      if (mode.value === 'folder' && folderView.value === 'input' && leftDir.value && rightDir.value) {
        runCompare()
      }
      break
    case 'l':
      e.preventDefault()
      if (hasContent.value) handleDownload('left')
      break
    case 'r':
      e.preventDefault()
      if (hasContent.value) handleDownload('right')
      break
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

watch(isDark, (val) => {
  document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
  localStorage.setItem('diffview-theme', val ? 'dark' : 'light')
}, { immediate: true })
function toggleTheme() {
  isDark.value = !isDark.value
}

// File mode computed
const language = computed(() => {
  if (rightFilename.value) return detectLanguageFromFilename(rightFilename.value)
  if (leftFilename.value) return detectLanguageFromFilename(leftFilename.value)
  return 'plaintext'
})

const hasContent = computed(() => leftText.value !== '' && rightText.value !== '')

function handleInput(side: 'left' | 'right', data: { text: string; filename: string }) {
  if (side === 'left') {
    leftText.value = data.text
    leftFilename.value = data.filename
  } else {
    rightText.value = data.text
    rightFilename.value = data.filename
  }
}

function resetInput() {
  leftText.value = ''
  rightText.value = ''
  leftFilename.value = ''
  rightFilename.value = ''
  hasDiffs.value = false
}

function handleDownload(side: 'left' | 'right') {
  const content = side === 'left' ? leftText.value : rightText.value
  const filename = side === 'left'
    ? buildDownloadFilename('left', leftFilename.value)
    : buildDownloadFilename('right', rightFilename.value)
  downloadTextFile(content, filename)
}

function previousDiff() {
  diffEditorRef.value?.navigateDiff('previous')
}

function nextDiff() {
  diffEditorRef.value?.navigateDiff('next')
}

// Folder mode functions
async function pickFolder(side: 'left' | 'right') {
  folderError.value = ''
  try {
    const snapshot = await pickDirectory()
    if (side === 'left') {
      leftDir.value = snapshot
    } else {
      rightDir.value = snapshot
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to pick folder'
    folderError.value = msg
  }
}

async function runCompare() {
  if (!leftDir.value || !rightDir.value) return
  folderError.value = ''
  compareResults.value = compareDirs(leftDir.value, rightDir.value)
  folderView.value = 'tree'
}

async function openFileDiff(path: string) {
  if (!leftDir.value || !rightDir.value) return
  selectedFilePath.value = path
  folderFileLanguage.value = detectLanguageFromFilename(path)

  try {
    const [leftContent, rightContent] = await Promise.all([
      readFileFromDir(leftDir.value.handle, path),
      readFileFromDir(rightDir.value.handle, path)
    ])
    folderLeftText.value = leftContent
    folderRightText.value = rightContent
    folderView.value = 'file-diff'
  } catch {
    folderError.value = `Failed to read file: ${path}`
  }
}

function handleMergeStart(data: { base: string; ours: string; theirs: string; baseName: string; oursName: string; theirsName: string }) {
  mergeBase.value = data.base
  mergeOurs.value = data.ours
  mergeTheirs.value = data.theirs
  mergeBaseName.value = data.baseName
  mergeOursName.value = data.oursName
  mergeTheirsName.value = data.theirsName
  mergeView.value = 'merge'
}

function goHome() {
  mode.value = 'file'
  leftText.value = ''
  rightText.value = ''
  leftFilename.value = ''
  rightFilename.value = ''
  hasDiffs.value = false
  diffStats.value = { additions: 0, deletions: 0, modifications: 0 }
  folderView.value = 'input'
  mergeView.value = 'input'
  folderLeftText.value = ''
  folderRightText.value = ''
}

function switchMode(newMode: 'file' | 'folder' | 'merge') {
  mode.value = newMode
  if (newMode === 'file') {
    folderView.value = 'input'
  }
}

function handleExportHtml() {
  const lines = buildDiffLines(leftText.value, rightText.value)
  exportHtml(leftText.value, rightText.value, leftFilename.value || 'left', rightFilename.value || 'right', lines)
}

function handleExportJson() {
  const lines = buildDiffLines(leftText.value, rightText.value)
  exportJson(leftText.value, rightText.value, leftFilename.value || 'left', rightFilename.value || 'right', lines)
}

function resetFolder() {
  leftDir.value = null
  rightDir.value = null
  compareResults.value = []
  selectedFilePath.value = ''
  folderView.value = 'input'
  folderError.value = ''
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-app);
}

.mode-bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-main);
  background: var(--bg-mode-bar);
  padding: 0 16px;
  flex-shrink: 0;
  gap: 8px;
}

.logo-area {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.logo {
  height: 34px;
  width: auto;
}

.mode-btn {
  padding: 8px 20px;
  font-size: 17px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  color: #4a9eff;
  border-bottom-color: #4a9eff;
  background: var(--bg-toolbar);
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 24px 0;
}

.file-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-file-bar);
  border-bottom: 1px solid var(--border-main);
}

.file-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.change-btn {
  margin-left: auto;
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--border-dashed);
  border-radius: 4px;
  background: var(--bg-toolbar);
  cursor: pointer;
  color: var(--text-primary);
}

.change-btn:hover {
  background: var(--bg-hover);
}

.diff-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-add { color: #27ae60; }
.stat-del { color: #e74c3c; }
.stat-mod { color: #f39c12; }

.privacy-hint {
  padding: 10px 16px;
  text-align: center;
  font-size: 18px;
  color: var(--text-muted);
  background: var(--bg-privacy);
  border-top: 1px solid var(--border-light);
}

.privacy-hint > div:first-child {
  font-size: 18px;
}

.privacy-hint a {
  color: var(--text-muted);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.privacy-hint a:hover {
  color: var(--text-primary);
}

.mode-bar-spacer {
  flex: 1;
}

.theme-toggle {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.theme-toggle:hover {
  background: #e0e0e0;
}

[data-theme="dark"] .theme-toggle:hover {
  background: #3c3c3c;
}

.shortcuts-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-dashed);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.shortcuts-btn:hover {
  background: var(--bg-hover);
}

.shortcuts-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.shortcuts-modal {
  background: var(--bg-toolbar);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  padding: 24px;
  min-width: 420px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.shortcuts-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.shortcuts-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.shortcut-row span {
  color: var(--text-secondary);
}

.shortcut-row kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid var(--border-dashed);
  border-radius: 4px;
  background: var(--bg-hover);
  color: var(--text-primary);
  min-width: 20px;
  text-align: center;
}
</style>

<style>
:root {
  --bg-app: #fff;
  --bg-mode-bar: #f5f5f5;
  --bg-toolbar: #fff;
  --bg-card-left: #f0f7ff;
  --bg-card-right: #fef9ee;
  --bg-dashed: transparent;
  --bg-hover: #fafafa;
  --bg-file-bar: #f5f5f5;
  --bg-privacy: #fafafa;
  --bg-summary: #fafafa;
  --bg-bottom-bar: #fafafa;
  --bg-tree-header: #fff;
  --bg-tree-row-hover: #f8f9fa;
  --bg-tree-selected: #e8f0fe;
  --border-main: #e0e0e0;
  --border-light: #eee;
  --border-dashed: #ccc;
  --border-dashed-hover: #999;
  --border-input: #ddd;
  --text-primary: #333;
  --text-secondary: #666;
  --text-muted: #999;
  --text-filename: #555;
  --text-h3: #333;
  --badge-left-bg: #fde8e8;
  --badge-left-text: #c0392b;
  --badge-right-bg: #e8f8e8;
  --badge-right-text: #27ae60;
  --badge-modified-bg: #fef5e7;
  --badge-modified-text: #d35400;
  --badge-identical-bg: #f0f0f0;
  --badge-identical-text: #7f8c8d;
  --error-text: #e74c3c;
  --size-right-text: #27ae60;
}

[data-theme="dark"] {
  --bg-app: #1e1e1e;
  --bg-mode-bar: #252526;
  --bg-toolbar: #2d2d2d;
  --bg-card-left: #1e2a3a;
  --bg-card-right: #332818;
  --bg-dashed: transparent;
  --bg-hover: #3a3a3a;
  --bg-file-bar: #2d2d2d;
  --bg-privacy: #252526;
  --bg-summary: #2d2d2d;
  --bg-bottom-bar: #2d2d2d;
  --bg-tree-header: #2d2d2d;
  --bg-tree-row-hover: #3a3a3a;
  --bg-tree-selected: #264f78;
  --border-main: #555;
  --border-light: #444;
  --border-dashed: #777;
  --border-dashed-hover: #aaa;
  --border-input: #777;
  --text-primary: #fff;
  --text-secondary: #eee;
  --text-muted: #ddd;
  --text-filename: #eee;
  --text-h3: #fff;
  --badge-left-bg: #4a1a1a;
  --badge-left-text: #f5a0a0;
  --badge-right-bg: #1a3a1a;
  --badge-right-text: #7ddf7d;
  --badge-modified-bg: #3a2a1a;
  --badge-modified-text: #f5b070;
  --badge-identical-bg: #2a2a2a;
  --badge-identical-text: #aaa;
  --error-text: #e86868;
  --size-right-text: #7ddf7d;
}

.logo-area { color: #222; }

[data-theme="dark"] .logo-area { color: #fff; }

[data-theme="dark"] textarea::placeholder {
  color: var(--text-muted);
}
</style>
