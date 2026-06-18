<template>
  <div ref="editorContainer" class="diff-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  leftText: string
  rightText: string
  language: string
  ignoreWhitespace: boolean
  wordWrap: boolean
  fontSize: number
  algo: 'advanced' | 'legacy'
  dark: boolean
}>()

const emit = defineEmits<{
  'update:leftText': [text: string]
  'update:rightText': [text: string]
  'diffsChange': [hasDiffs: boolean]
  'statsChange': [stats: DiffStats]
}>()

interface DiffStats {
  additions: number
  deletions: number
  modifications: number
}

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IDiffEditor | null = null
let ignoreUpdate = false

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.createDiffEditor(editorContainer.value, {
    readOnly: false,
    originalEditable: true,
    renderSideBySide: true,
    automaticLayout: true,
    ignoreTrimWhitespace: props.ignoreWhitespace,
    wordWrap: props.wordWrap ? 'on' : 'off',
    fontSize: props.fontSize,
    diffAlgorithm: props.algo,
    minimap: { enabled: false },
    theme: props.dark ? 'vs-dark' : 'vs'
  })

  const originalModel = monaco.editor.createModel(props.leftText, props.language)
  const modifiedModel = monaco.editor.createModel(props.rightText, props.language)

  editor.setModel({ original: originalModel, modified: modifiedModel })

  editor.onDidUpdateDiff(() => {
    checkDiffs()
  })

  modifiedModel.onDidChangeContent(() => {
    if (ignoreUpdate) return
    emit('update:rightText', modifiedModel.getValue())
    nextTick(checkDiffs)
  })

  originalModel.onDidChangeContent(() => {
    if (ignoreUpdate) return
    emit('update:leftText', originalModel.getValue())
    nextTick(checkDiffs)
  })
})

onBeforeUnmount(() => {
  editor?.dispose()
})

watch(() => props.leftText, (newVal) => {
  if (!editor) return
  const model = editor.getModel()?.original
  if (model && model.getValue() !== newVal) {
    ignoreUpdate = true
    model.setValue(newVal)
    ignoreUpdate = false
    nextTick(checkDiffs)
  }
})

watch(() => props.rightText, (newVal) => {
  if (!editor) return
  const model = editor.getModel()?.modified
  if (model && model.getValue() !== newVal) {
    ignoreUpdate = true
    model.setValue(newVal)
    ignoreUpdate = false
    nextTick(checkDiffs)
  }
})

watch(() => props.language, (newLang) => {
  if (!editor) return
  const models = editor.getModel()
  if (models) {
    monaco.editor.setModelLanguage(models.original, newLang)
    monaco.editor.setModelLanguage(models.modified, newLang)
  }
})

watch(() => props.ignoreWhitespace, (val) => {
  if (!editor) return
  editor.updateOptions({ ignoreTrimWhitespace: val })
  nextTick(checkDiffs)
})

watch(() => props.dark, (val) => {
  if (!editor) return
  monaco.editor.setTheme(val ? 'vs-dark' : 'vs')
})

watch(() => props.wordWrap, (val) => {
  if (!editor) return
  editor.updateOptions({ wordWrap: val ? 'on' : 'off' })
})

watch(() => props.fontSize, (val) => {
  if (!editor) return
  editor.updateOptions({ fontSize: val })
})

watch(() => props.algo, (val) => {
  if (!editor) return
  editor.updateOptions({ diffAlgorithm: val })
})

interface LineChange {
  modifiedStartLineNumber: number | null
  modifiedEndLineNumber: number | null
  originalStartLineNumber: number | null
  originalEndLineNumber: number | null
}

function checkDiffs() {
  if (!editor) return
  const changes = editor.getLineChanges() as LineChange[] | null
  const has = changes !== null && changes.length > 0
  emit('diffsChange', has)

  if (changes) {
    let additions = 0, deletions = 0, modifications = 0
    for (const c of changes) {
      if (c.originalStartLineNumber === null) {
        additions += (c.modifiedEndLineNumber! - c.modifiedStartLineNumber! + 1)
      } else if (c.modifiedStartLineNumber === null) {
        deletions += (c.originalEndLineNumber! - c.originalStartLineNumber! + 1)
      } else {
        modifications += Math.max(
          c.modifiedEndLineNumber! - c.modifiedStartLineNumber! + 1,
          c.originalEndLineNumber! - c.originalStartLineNumber! + 1
        )
      }
    }
    emit('statsChange', { additions, deletions, modifications })
  } else {
    emit('statsChange', { additions: 0, deletions: 0, modifications: 0 })
  }
}

function navigateDiff(direction: 'previous' | 'next') {
  if (!editor) return
  const changes = editor.getLineChanges() as LineChange[] | null
  if (!changes || changes.length === 0) return

  const modifiedEditor = editor.getModifiedEditor()
  const currentLine = modifiedEditor.getPosition()?.lineNumber ?? 1

  const validChanges = changes.filter(
    (c: LineChange) => c.modifiedStartLineNumber !== null
  )
  if (validChanges.length === 0) return

  let targetChange: LineChange
  if (direction === 'next') {
    targetChange = validChanges.find((c: LineChange) => c.modifiedStartLineNumber! > currentLine)!
    if (!targetChange) targetChange = validChanges[0]
  } else {
    const reversed = [...validChanges].reverse()
    targetChange = reversed.find((c: LineChange) => c.modifiedStartLineNumber! < currentLine)!
    if (!targetChange) targetChange = validChanges[validChanges.length - 1]
  }

  modifiedEditor.revealLineInCenter(targetChange.modifiedStartLineNumber!)
  modifiedEditor.setPosition({
    lineNumber: targetChange.modifiedStartLineNumber!,
    column: 1
  })
}

defineExpose({ navigateDiff })
</script>

<style scoped>
.diff-editor {
  flex: 1;
  overflow: hidden;
}
</style>
