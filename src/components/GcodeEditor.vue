<template>
  <div class="gcode-editor">
    <div class="editor-header d-flex justify-content-between align-items-center mb-2">
      <h6 class="mb-0"><i class="fa-solid" :class="icon"></i> {{ title }}</h6>
      <div>
        <template v-if="isEditing">
          <button class="btn btn-sm btn-primary me-1" @click="saveCode">
            <i class="fas fa-save"></i> Save
          </button>
          <button class="btn btn-sm btn-secondary" @click="cancelEdit">
            <i class="fas fa-times"></i> Cancel
          </button>
        </template>
        <template v-else>
          <button class="btn btn-sm btn-outline-secondary" @click="toggleEdit">
            <i class="fas fa-edit"></i> Edit
          </button>
        </template>
      </div>
    </div>

    <div v-if="!isEditing">
      <pre><code ref="codeBlock" class="language-gcode">{{ code }}</code></pre>
    </div>
    <div v-else>
      <textarea class="form-control" v-model="editableCode" rows="10"></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import hljs from 'highlight.js/lib/core';

const props = defineProps({
  code: String,
  title: String,
  icon: String
});

const emits = defineEmits(['update:code']);

const isEditing = ref(false);
const editableCode = ref(props.code);
const originalCode = ref(props.code);
const codeBlock = ref(null);

const toggleEdit = () => {
  originalCode.value = props.code;
  editableCode.value = props.code;
  isEditing.value = true;
};

const cancelEdit = () => {
  editableCode.value = originalCode.value;
  isEditing.value = false;
  nextTick(() => {
    if (codeBlock.value) {
      hljs.highlightElement(codeBlock.value);
    }
  });
};

const saveCode = () => {
  emits('update:code', editableCode.value);
  isEditing.value = false;
  nextTick(() => {
    if (codeBlock.value) {
      hljs.highlightElement(codeBlock.value);
    }
  });
};

watch(() => props.code, (newCode) => {
  if (!isEditing.value) {
    editableCode.value = newCode;
    originalCode.value = newCode;
  }
});

onMounted(() => {
  if (codeBlock.value) {
    hljs.highlightElement(codeBlock.value);
  }
});
</script>

<style scoped>
.gcode-editor textarea {
  font-family: monospace;
  font-size: 0.9rem;
}
pre code {
  display: block;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-family: monospace;
  white-space: pre-wrap;
}

.hljs{
    background-color: #0d1117;
}
</style>
