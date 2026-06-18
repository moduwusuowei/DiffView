<template>
  <div class="c3-editor-container">
    <div ref="leftPane" class="c3-editor-pane"></div>
    <div ref="middlePane" class="c3-editor-pane"></div>
    <div ref="rightPane" class="c3-editor-pane"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  leftText: string
  middleText: string
  rightText: string
  language: string
  fontSize: number
  wordWrap: boolean
  dark: boolean
}>()

const emit = defineEmits<{
  'update:leftText': [text: string]
  'update:middleText': [text: string]
  'update:rightText': [text: string]
}>()

const leftPane = ref<HTMLDivElement | null>(null)
const middlePane = ref<HTMLDivElement | null>(null)
const rightPane = ref<HTMLDivElement | null>(null)

let leftEditor: monaco.editor.IStandaloneCodeEditor | null = null
let middleEditor: monaco.editor.IStandaloneCodeEditor | null = null
let rightEditor: monaco.editor.IStandaloneCodeEditor | null = null
let leftModel: monaco.editor.ITextModel | null = null
let middleModel: monaco.editor.ITextModel | null = null
let rightModel: monaco.editor.ITextModel | null = null
let ignoreScroll = false

let leftDecos: string[] = []
let middleDecos: string[] = []
let rightDecos: string[] = []

onMounted(() => {
  if (!leftPane.value || !middlePane.value || !rightPane.value) return
  const lang = props.language

  function createEditor(parent: HTMLElement, text: string): monaco.editor.IStandaloneCodeEditor {
    const model = monaco.editor.createModel(text, lang)
    const editor = monaco.editor.create(parent, {
      model,
      readOnly: false,
      automaticLayout: true,
      fontSize: props.fontSize,
      wordWrap: props.wordWrap ? 'on' : 'off' as const,
      minimap: { enabled: false },
      theme: props.dark ? 'vs-dark' : 'vs',
      scrollBeyondLastLine: false,
    })
    return editor
  }

  try {
    leftEditor = createEditor(leftPane.value, props.leftText)
    middleEditor = createEditor(middlePane.value, props.middleText)
    rightEditor = createEditor(rightPane.value, props.rightText)

    leftModel = leftEditor.getModel()!
    middleModel = middleEditor.getModel()!
    rightModel = rightEditor.getModel()!

    leftEditor.onDidChangeModelContent(() => {
      if (!leftModel) return
      emit('update:leftText', leftModel.getValue())
      scheduleDecoUpdate()
    })
    middleEditor.onDidChangeModelContent(() => {
      if (!middleModel) return
      emit('update:middleText', middleModel.getValue())
      scheduleDecoUpdate()
    })
    rightEditor.onDidChangeModelContent(() => {
      if (!rightModel) return
      emit('update:rightText', rightModel.getValue())
      scheduleDecoUpdate()
    })

    const eds = [leftEditor, middleEditor, rightEditor]
    eds.forEach(ed => {
      ed.onDidScrollChange(e => {
        if (ignoreScroll) return
        ignoreScroll = true
        eds.forEach(other => {
          if (other !== ed) {
            other.setScrollPosition({ scrollTop: e.scrollTop, scrollLeft: e.scrollLeft })
          }
        })
        ignoreScroll = false
      })
    })
  } catch (err) {
    console.error('Compare3EditorPanel init error:', err)
  }

  nextTick(() => {
    try {
      leftEditor?.layout()
      middleEditor?.layout()
      rightEditor?.layout()
      updateDecorations()
    } catch (err) {
      console.error('Compare3EditorPanel layout error:', err)
    }
  })
})

function lineDiff(a: string, b: string): { aChanged: Set<number>; bChanged: Set<number> } {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const aChanged = new Set<number>()
  const bChanged = new Set<number>()
  let prefixEnd = 0
  while (prefixEnd < linesA.length && prefixEnd < linesB.length &&
         linesA[prefixEnd] === linesB[prefixEnd]) prefixEnd++
  let suffixA = linesA.length - 1, suffixB = linesB.length - 1
  while (suffixA >= prefixEnd && suffixB >= prefixEnd &&
         linesA[suffixA] === linesB[suffixB]) { suffixA--; suffixB-- }
  for (let i = prefixEnd; i <= suffixA; i++) aChanged.add(i)
  for (let j = prefixEnd; j <= suffixB; j++) bChanged.add(j)
  return { aChanged, bChanged }
}

function updateDecorations() {
  if (!leftEditor || !middleEditor || !rightEditor ||
      !leftModel || !middleModel || !rightModel) return
  const left = leftModel.getValue()
  const middle = middleModel.getValue()
  const right = rightModel.getValue()
  const diffLeft = lineDiff(left, middle)
  const diffRight = lineDiff(right, middle)

  const leftRanges = Array.from(diffLeft.aChanged).map(line => ({
    range: new monaco.Range(line + 1, 1, line + 1, 1),
    options: { isWholeLine: true, className: 'diff-3-left' }
  }))
  const middleSet = new Set([...diffLeft.bChanged, ...diffRight.bChanged])
  const middleRanges = Array.from(middleSet).map(line => ({
    range: new monaco.Range(line + 1, 1, line + 1, 1),
    options: { isWholeLine: true, className: 'diff-3-middle' }
  }))
  const rightRanges = Array.from(diffRight.aChanged).map(line => ({
    range: new monaco.Range(line + 1, 1, line + 1, 1),
    options: { isWholeLine: true, className: 'diff-3-right' }
  }))
  leftDecos = leftEditor.deltaDecorations(leftDecos, leftRanges)
  middleDecos = middleEditor.deltaDecorations(middleDecos, middleRanges)
  rightDecos = rightEditor.deltaDecorations(rightDecos, rightRanges)
}

let decoTimer: ReturnType<typeof setTimeout> | null = null
function scheduleDecoUpdate() {
  if (decoTimer) clearTimeout(decoTimer)
  decoTimer = setTimeout(() => updateDecorations(), 150)
}

onBeforeUnmount(() => {
  if (decoTimer) clearTimeout(decoTimer)
  leftEditor?.dispose()
  middleEditor?.dispose()
  rightEditor?.dispose()
  leftModel?.dispose()
  middleModel?.dispose()
  rightModel?.dispose()
})

watch(() => props.dark, (val) => {
  monaco.editor.setTheme(val ? 'vs-dark' : 'vs')
})

watch(() => props.fontSize, (val) => {
  const opts: monaco.editor.IEditorOptions = { fontSize: val }
  leftEditor?.updateOptions(opts)
  middleEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})

watch(() => props.wordWrap, (val) => {
  const opts: monaco.editor.IEditorOptions = { wordWrap: val ? 'on' : 'off' }
  leftEditor?.updateOptions(opts)
  middleEditor?.updateOptions(opts)
  rightEditor?.updateOptions(opts)
})
</script>

<style scoped>
.c3-editor-container {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 1px;
  background: var(--border-main);
}

.c3-editor-pane {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
</style>
