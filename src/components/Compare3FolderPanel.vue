<template>
  <div class="c3-folder-panel">
    <div class="c3-folder-summary">
      <span class="summary-badge">Files: {{ results.length }}</span>
    </div>

    <div class="c3-tree-scroll">
      <div class="c3-tree-header">
        <span class="c3-col-file">File</span>
        <span class="c3-col-size left-col">Left</span>
        <span class="c3-col-size middle-col">Middle</span>
        <span class="c3-col-size right-col">Right</span>
      </div>
      <div class="c3-tree-body">
        <div
          v-for="item in results"
          :key="item.relativePath"
          class="c3-tree-row"
          :class="{
            'selected': item.relativePath === selectedPath,
            'dimmed': allIdentical(item)
          }"
          :title="item.relativePath"
          @click="selectFile(item)"
        >
          <span class="c3-col-file">{{ item.relativePath }}</span>
          <span class="c3-col-size left-col">{{ item.leftSize != null ? formatSize(item.leftSize) : '—' }}</span>
          <span class="c3-col-size middle-col">{{ item.middleSize != null ? formatSize(item.middleSize) : '—' }}</span>
          <span class="c3-col-size right-col">{{ item.rightSize != null ? formatSize(item.rightSize) : '—' }}</span>
        </div>
        <div v-if="results.length === 0" class="empty-tree">
          No files to compare.
        </div>
      </div>
    </div>

    <div class="c3-folder-bottom">
      <button class="back-btn" @click="$emit('back')">Change Folders</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Compare3Result } from '../utils/directoryCompare'

defineProps<{
  results: Compare3Result[]
  selectedPath: string
}>()

const emit = defineEmits<{
  'select-file': [path: string]
  'back': []
}>()

function allIdentical(item: Compare3Result): boolean {
  return item.leftSize != null && item.middleSize != null && item.rightSize != null
    && item.leftSize === item.middleSize && item.middleSize === item.rightSize
}

function selectFile(item: Compare3Result) {
  const sizes = [item.leftSize, item.middleSize, item.rightSize]
  if (sizes.every(s => s != null && s === sizes[0])) return
  emit('select-file', item.relativePath)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.c3-folder-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.c3-folder-summary {
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-summary);
  border-bottom: 1px solid var(--border-main);
  flex-shrink: 0;
}

.summary-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  background: var(--badge-identical-bg);
  color: var(--badge-identical-text);
}

.c3-tree-scroll {
  flex: 1;
  overflow: auto;
}

.c3-tree-header {
  display: flex;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-tree-header);
  position: sticky;
  top: 0;
}

.c3-col-file { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c3-col-size { width: 100px; text-align: right; flex-shrink: 0; }
.left-col { color: #4a9eff; }
.middle-col { color: #e67e22; }
.right-col { color: #27ae60; }

.c3-tree-row {
  display: flex;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
  align-items: center;
}

.c3-tree-row:hover {
  background: var(--bg-tree-row-hover);
}

.c3-tree-row.selected {
  background: var(--bg-tree-selected);
}

.c3-tree-row.dimmed {
  opacity: 0.5;
  cursor: default;
}

.empty-tree {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
}

.c3-folder-bottom {
  padding: 8px 16px;
  border-top: 1px solid var(--border-main);
  background: var(--bg-bottom-bar);
}

.back-btn {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--border-dashed);
  border-radius: 4px;
  background: var(--bg-toolbar);
  cursor: pointer;
  margin-left: auto;
  display: block;
  color: var(--text-primary);
}

.back-btn:hover {
  background: var(--bg-hover);
}
</style>
