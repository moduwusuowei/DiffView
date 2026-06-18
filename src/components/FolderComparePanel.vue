<template>
  <div class="folder-compare-panel">
    <div class="folder-summary">
      <span class="summary-badge left-only">Left only: {{ stats.leftOnly }}</span>
      <span class="summary-badge right-only">Right only: {{ stats.rightOnly }}</span>
      <span class="summary-badge modified">Modified: {{ stats.modified }}</span>
      <span class="summary-badge identical">Identical: {{ stats.identical }}</span>
    </div>

    <div class="tree-scroll">
      <div class="tree-header">
        <span class="col-status">Status</span>
        <span class="col-name">File / Folder</span>
        <span class="col-size">Size</span>
      </div>
      <div class="tree-body">
        <template v-for="item in tree" :key="item.relativePath">
          <TreeRow
            :item="item"
            :depth="0"
            :selected-path="selectedPath"
            @select="$emit('select-file', $event)"
          />
        </template>
        <div v-if="tree.length === 0" class="empty-tree">
          No files to compare.
        </div>
      </div>
    </div>

    <div class="folder-bottom-bar">
      <button class="back-btn" @click="$emit('back')">Change Folders</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompareResult, FolderTreeItem } from '../utils/directoryCompare'
import TreeRow from './TreeRow.vue'

const props = defineProps<{
  results: CompareResult[]
  leftName: string
  rightName: string
  selectedPath: string
}>()

defineEmits<{
  'select-file': [path: string]
  'back': []
}>()

import { buildFileTree } from '../utils/directoryCompare'

const tree = computed(() => buildFileTree(props.results))

const stats = computed(() => {
  const s = { leftOnly: 0, rightOnly: 0, modified: 0, identical: 0 }
  for (const r of props.results) {
    if (r.status === 'left-only') s.leftOnly++
    else if (r.status === 'right-only') s.rightOnly++
    else if (r.status === 'modified') s.modified++
    else s.identical++
  }
  return s
})
</script>

<style scoped>
.folder-compare-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folder-summary {
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
}

.summary-badge.left-only { background: var(--badge-left-bg); color: var(--badge-left-text); }
.summary-badge.right-only { background: var(--badge-right-bg); color: var(--badge-right-text); }
.summary-badge.modified { background: var(--badge-modified-bg); color: var(--badge-modified-text); }
.summary-badge.identical { background: var(--badge-identical-bg); color: var(--badge-identical-text); }

.tree-scroll {
  flex: 1;
  overflow: auto;
}

.tree-header {
  display: flex;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-tree-header);
  position: sticky;
  top: 0;
}

.col-status { width: 120px; flex-shrink: 0; }
.col-name { flex: 1; }
.col-size { width: 80px; text-align: right; }

.tree-body {
  font-size: 13px;
}

.empty-tree {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
}

.folder-bottom-bar {
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
