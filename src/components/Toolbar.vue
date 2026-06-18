<template>
  <div class="toolbar">
    <div class="toolbar-center">
      <label class="toggle-label">
        <input
          type="checkbox"
          :checked="ignoreWhitespace"
          @change="$emit('toggle-ignore-whitespace')"
        />
        Ignore whitespace
      </label>

      <label class="toggle-label">
        <input
          type="checkbox"
          :checked="wordWrap"
          @change="$emit('toggle-word-wrap')"
        />
        Word wrap
      </label>

      <div class="font-size-control">
        <button class="size-btn" @click="$emit('font-size-change', -1)" :disabled="fontSize <= 10">A-</button>
        <span class="size-value">{{ fontSize }}</span>
        <button class="size-btn" @click="$emit('font-size-change', 1)" :disabled="fontSize >= 30">A+</button>
      </div>

      <button class="algo-btn" @click="$emit('toggle-algo')">
        {{ algo === 'advanced' ? 'Smart' : 'Legacy' }}
      </button>

      <button
        class="nav-btn"
        :disabled="!hasContent || !hasDiffs"
        @click="$emit('previous-diff')"
      >
        &lt; Previous Diff
      </button>
      <button
        class="nav-btn"
        :disabled="!hasContent || !hasDiffs"
        @click="$emit('next-diff')"
      >
        Next Diff &gt;
      </button>
    </div>

    <div class="toolbar-right">
      <button
        class="download-btn"
        :disabled="!hasContent"
        @click="$emit('download-left')"
      >
        Download Left
      </button>
      <button
        class="download-btn"
        :disabled="!hasContent"
        @click="$emit('download-right')"
      >
        Download Right
      </button>
      <button
        class="export-btn"
        :disabled="!hasContent"
        @click="$emit('export-html')"
      >
        Export HTML
      </button>
      <button
        class="export-btn"
        :disabled="!hasContent"
        @click="$emit('export-json')"
      >
        Export JSON
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  leftFilename: string
  rightFilename: string
  ignoreWhitespace: boolean
  wordWrap: boolean
  fontSize: number
  algo: 'advanced' | 'legacy'
  hasContent: boolean
  hasDiffs: boolean
}>()

defineEmits<{
  'toggle-ignore-whitespace': []
  'toggle-word-wrap': []
  'font-size-change': [delta: number]
  'toggle-algo': []
  'previous-diff': []
  'next-diff': []
  'download-left': []
  'download-right': []
  'export-html': []
  'export-json': []
}>()
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-toolbar);
  border-bottom: 1px solid var(--border-main);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  gap: 16px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filename {
  font-size: 13px;
  color: var(--text-filename);
}

.left-file {
  color: #4a9eff;
  font-weight: 600;
}

.right-file {
  color: #e67e22;
  font-weight: 600;
}

.toggle-label {
  font-size: 13px;
  color: var(--text-filename);
  cursor: pointer;
}

.algo-btn, .nav-btn, .download-btn, .export-btn {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--border-dashed);
  border-radius: 4px;
  background: var(--bg-toolbar);
  cursor: pointer;
  color: var(--text-primary);
}

.nav-btn:hover:not(:disabled), .download-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.nav-btn:disabled, .download-btn:disabled, .size-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.size-btn {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-dashed);
  border-radius: 4px;
  background: var(--bg-toolbar);
  cursor: pointer;
  color: var(--text-primary);
  line-height: 1.4;
}

.size-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.size-value {
  font-size: 12px;
  min-width: 20px;
  text-align: center;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
</style>
