<template>
  <div class="merge-editor-panel">
    <div class="merge-file-bar">
      <span class="file-info">Base: {{ baseName }}</span>
      <span class="file-info">Left (Ours): {{ oursName }}</span>
      <span class="file-info">Right (Theirs): {{ theirsName }}</span>
      <button class="change-btn" @click="$emit('back')">Change files</button>
      <button class="change-btn" @click="downloadResult">Download Result</button>
    </div>
    <div class="merge-editors">
      <div class="merge-col">
        <div class="merge-col-header ours-header">Left (Ours) vs Base</div>
        <div ref="leftEditorContainer" class="merge-editor"></div>
      </div>
      <div class="merge-col">
        <div class="merge-col-header theirs-header">Right (Theirs) vs Base</div>
        <div ref="rightEditorContainer" class="merge-editor"></div>
      </div>
    </div>
    <div class="merge-result-section">
      <div class="merge-col-header result-header">Merge Result (editable)</div>
      <textarea ref="resultTextarea" class="merge-result" @input="onResultInput">{{ resultText }}</textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { downloadTextFile } from '../utils/downloadFile'

const props = defineProps<{
  base: string
  ours: string
  theirs: string
  baseName: string
  oursName: string
  theirsName: string
  language: string
  dark: boolean
  fontSize: number
  wordWrap: boolean
  ignoreWhitespace: boolean
  algo: 'advanced' | 'legacy'
}>()

const emit = defineEmits<{
  back: []
}>()

const leftEditorContainer = ref<HTMLDivElement | null>(null)
const rightEditorContainer = ref<HTMLDivElement | null>(null)
const resultTextarea = ref<HTMLTextAreaElement | null>(null)

let leftEditor: monaco.editor.IDiffEditor | null = null
let rightEditor: monaco.editor.IDiffEditor | null = null
const resultText = ref('')

function buildResult() {
  const oLines = props.ours.split('\n')
  const tLines = props.theirs.split('\n')
  if (oLines.length >= tLines.length) {
    resultText.value = props.ours
  } else {
    resultText.value = props.theirs
  }
}

onMounted(() => {
  if (!leftEditorContainer.value || !rightEditorContainer.value) return

  const commonOpts: monaco.editor.IDiffEditorConstructionOptions = {
    readOnly: true,
    renderSideBySide: true,
    automaticLayout: true,
    ignoreTrimWhitespace: props.ignoreWhitespace,
    fontSize: props.fontSize,
    wordWrap: props.wordWrap ? 'on' : 'off',
    diffAlgorithm: props.algo,
    minimap: { enabled: false }
  }
  monaco.editor.setTheme(props.dark ? 'vs-dark' : 'vs')

  // Left: ours vs base
  const leftModel = monaco.editor.createModel(props.ours, props.language)
  const baseModel = monaco.editor.createModel(props.base, props.language)
  leftEditor = monaco.editor.createDiffEditor(leftEditorContainer.value, commonOpts)
  leftEditor.setModel({ original: baseModel, modified: leftModel })

  // Right: theirs vs base
  const rightModel = monaco.editor.createModel(props.theirs, props.language)
  rightEditor = monaco.editor.createDiffEditor(rightEditorContainer.value, commonOpts)
  rightEditor.setModel({ original: baseModel, modified: rightModel })

  buildResult()
})

onBeforeUnmount(() => {
  leftEditor?.dispose()
  rightEditor?.dispose()
})

watch(() => props.dark, (val) => {
  monaco.editor.setTheme(val ? 'vs-dark' : 'vs')
})

watch(() => props.fontSize, (val) => {
  const opts = { fontSize: val }
  leftEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})

watch(() => props.wordWrap, (val) => {
  const opts: monaco.editor.IDiffEditorOptions = { wordWrap: val ? 'on' : 'off' }
  leftEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})

watch(() => props.ignoreWhitespace, (val) => {
  const opts = { ignoreTrimWhitespace: val }
  leftEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})

watch(() => props.algo, (val) => {
  const opts = { diffAlgorithm: val }
  leftEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})

function onResultInput() {
  if (resultTextarea.value) {
    resultText.value = resultTextarea.value.value
  }
}

function downloadResult() {
  downloadTextFile(resultText.value, 'merged-result.txt')
}

watch(() => [props.base, props.ours, props.theirs], () => {
  if (!leftEditor || !rightEditor) return
  const baseModel = monaco.editor.createModel(props.base, props.language)
  const leftModel = monaco.editor.createModel(props.ours, props.language)
  const rightModel = monaco.editor.createModel(props.theirs, props.language)
  leftEditor.setModel({ original: baseModel, modified: leftModel })
  rightEditor.setModel({ original: baseModel, modified: rightModel })
  buildResult()
  nextTick(() => {
    if (resultTextarea.value) {
      resultTextarea.value.value = resultText.value
    }
  })
})
</script>

<style scoped>
.merge-editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.merge-file-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-file-bar, #f5f5f5);
  border-bottom: 1px solid var(--border-main, #e0e0e0);
  flex-shrink: 0;
}
.file-info { font-size: 13px; color: var(--text-secondary, #666); }
.change-btn {
  padding: 4px 12px; font-size: 13px; border: 1px solid var(--border-dashed, #ccc);
  border-radius: 4px; background: var(--bg-toolbar, #fff); cursor: pointer; color: var(--text-primary, #333);
}
.change-btn:hover { background: var(--bg-hover, #f0f0f0); }
.merge-editors {
  display: flex;
  flex: 1;
  gap: 2px;
  overflow: hidden;
}
.merge-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.merge-col-header {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  text-align: center;
}
.ours-header { background: #e3f2fd; color: #1565c0; }
.theirs-header { background: #fff3e0; color: #e65100; }
.result-header { background: #e8f5e9; color: #2e7d32; }
.merge-editor {
  flex: 1;
  overflow: hidden;
}
.merge-result-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 200px;
  border-top: 2px solid var(--border-main, #e0e0e0);
}
.merge-result {
  flex: 1;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  border: none;
  resize: vertical;
  color: var(--text-primary, #333);
  background: var(--bg-app, #fff);
}
.merge-result:focus { outline: none; }
</style>
