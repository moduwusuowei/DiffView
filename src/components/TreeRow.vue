<template>
  <div>
    <div
      class="tree-row"
      :style="{ paddingLeft: (depth * 20 + 16) + 'px' }"
      :class="{ selected: item.relativePath === selectedPath }"
      @click="handleClick"
    >
      <span class="row-status">
        <span v-if="item.isDirectory" class="icon-folder">&#128193;</span>
        <span v-else :class="'status-dot status-' + item.status"></span>
      </span>
      <span class="row-name">{{ item.name }}</span>
      <span class="row-size" v-if="!item.isDirectory && item.status !== 'right-only'">
        {{ formatSize(item.leftSize) }}
      </span>
      <span class="row-size right-size" v-if="!item.isDirectory && item.status === 'modified'">
        {{ formatSize(item.rightSize) }}
      </span>
      <span class="row-size" v-if="!item.isDirectory && item.status === 'right-only'">
        {{ formatSize(item.rightSize) }}
      </span>
      <span class="row-size" v-if="item.isDirectory"></span>
    </div>
    <template v-if="expanded && item.children">
      <TreeRow
        v-for="child in item.children"
        :key="child.relativePath"
        :item="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="(path: string) => $emit('select', path)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FolderTreeItem } from '../utils/directoryCompare'

const props = defineProps<{
  item: FolderTreeItem
  depth: number
  selectedPath: string
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

const expanded = ref(true)

function handleClick() {
  if (props.item.isDirectory) {
    expanded.value = !expanded.value
  } else {
    if (props.item.status !== 'identical') {
      emit('select', props.item.relativePath)
    }
  }
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-light);
}

.tree-row:hover {
  background: var(--bg-tree-row-hover);
}

.tree-row.selected {
  background: var(--bg-tree-selected);
}

.row-status {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-left-only { background: #e74c3c; }
.status-right-only { background: #27ae60; }
.status-modified { background: #f39c12; }
.status-identical { background: #bdc3c7; }

.icon-folder {
  font-size: 14px;
}

.row-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-size {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: var(--text-muted);
}

.right-size {
  color: var(--size-right-text);
}
</style>
