<template>
  <div class="folder-input-panel">
    <div class="folder-cards">
      <div class="folder-side left-side">
        <h3>Left (Original)</h3>
        <div class="folder-area" @click="$emit('pickleft')">
          <span v-if="leftName" class="folder-name">{{ leftName }} ({{ leftCount }} files)</span>
          <span v-else class="upload-badge">+ Select left folder</span>
        </div>
        <span v-if="!leftName" class="folder-hint">Select left folder to compare their file structure.</span>
      </div>

      <div class="folder-side right-side">
        <h3>Right (Modified)</h3>
        <div class="folder-area" @click="$emit('pickright')">
          <span v-if="rightName" class="folder-name">{{ rightName }} ({{ rightCount }} files)</span>
          <span v-else class="upload-badge">+ Select right folder</span>
        </div>
        <span v-if="!rightName" class="folder-hint">Select right folder to compare their file structure.</span>
      </div>
    </div>

    <div class="folder-actions-wrapper">
      <div class="folder-actions">
        <button class="compare-btn" :disabled="!leftName || !rightName" @click="$emit('compare')">
          Compare Folders
        </button>
        <button class="back-btn" @click="$emit('back')">Back</button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  leftName: string
  rightName: string
  leftCount: number
  rightCount: number
  error: string
}>()

defineEmits<{
  pickleft: []
  pickright: []
  compare: []
  back: []
}>()
</script>

<style scoped>
.folder-input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: auto;
}

.folder-cards {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex: 1;
}

.folder-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  min-height: 310px;
}

.left-side {
  background: var(--bg-card-left);
}

.right-side {
  background: var(--bg-card-right);
}

.folder-side h3 {
  font-size: 14px;
  color: var(--text-h3);
  margin: 0;
}

.folder-area {
  flex: 1;
  padding: 24px 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-dashed);
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background-color 0.15s;
}

.folder-area:hover {
  border-color: var(--border-dashed-hover);
  background-color: var(--bg-hover);
}

.folder-name {
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

.folder-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  pointer-events: none;
}

.folder-actions-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.folder-actions {
  display: flex;
  gap: 12px;
}

.compare-btn, .back-btn {
  padding: 12px 32px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #fff;
  min-width: 200px;
  color: var(--text-primary);
}

.compare-btn {
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

.compare-btn:hover:not(:disabled) {
  background: #3a8eef;
}

.compare-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.back-btn {
  background: var(--bg-toolbar);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.error-msg {
  color: var(--error-text);
  font-size: 13px;
  max-width: 400px;
  text-align: center;
}
</style>
