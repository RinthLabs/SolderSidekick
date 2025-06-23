<template>
  <div class="profile-manager">
    <div class="d-flex align-items-center gap-2">
      <select class="form-select" v-model="selectedProfile">
        <option v-for="name in profileNames" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
      
      <div class="dropdown">
        <button 
          class="btn btn-outline-secondary dropdown-toggle" 
          type="button" 
          data-bs-toggle="dropdown"
          title="Profile options"
        >
          <i class="fas fa-cog"></i>
        </button>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="#" @click.prevent="showNewProfile = true">
              <i class="fas fa-plus me-2"></i>New Profile
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="showDuplicateProfile = true">
              <i class="fas fa-copy me-2"></i>Duplicate Profile
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="showRenameProfile = true">
              <i class="fas fa-edit me-2"></i>Rename Profile
            </a>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a 
              class="dropdown-item text-danger" 
              href="#" 
              @click.prevent="deleteCurrentProfile"
              :class="{ disabled: profileNames.length <= 1 }"
            >
              <i class="fas fa-trash me-2"></i>Delete Profile
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- New Profile Modal -->
    <div v-if="showNewProfile" class="modal-backdrop" @click="showNewProfile = false">
      <div class="modal-dialog-custom" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Profile</h5>
            <button type="button" class="btn-close" @click="showNewProfile = false"></button>
          </div>
          <div class="modal-body">
            <input 
                type="text" 
                class="form-control" 
                v-model="newProfileName"
                placeholder="Enter profile name"
                @keyup.enter="createNewProfile"
                @keyup.escape="showNewProfile = false"
                ref="newProfileInput"
                />
            <div v-if="error" class="text-danger mt-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showNewProfile = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="createNewProfile">Create</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Profile Modal -->
    <div v-if="showRenameProfile" class="modal-backdrop" @click="showRenameProfile = false">
      <div class="modal-dialog-custom" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rename Profile</h5>
            <button type="button" class="btn-close" @click="showRenameProfile = false"></button>
          </div>
          <div class="modal-body">
            <input 
                type="text" 
                class="form-control" 
                v-model="renameProfileName"
                placeholder="Enter new name"
                @keyup.enter="renameCurrentProfile"
                @keyup.escape="showRenameProfile = false"
                ref="renameProfileInput"
                />
            <div v-if="error" class="text-danger mt-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRenameProfile = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="renameCurrentProfile">Rename</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Duplicate Profile Modal -->
    <div v-if="showDuplicateProfile" class="modal-backdrop" @click="showDuplicateProfile = false">
      <div class="modal-dialog-custom" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Duplicate Profile</h5>
            <button type="button" class="btn-close" @click="showDuplicateProfile = false"></button>
          </div>
          <div class="modal-body">
            <input 
                type="text" 
                class="form-control" 
                v-model="duplicateProfileName"
                :placeholder="`Copy of ${selectedProfile}`"
                @keyup.enter="duplicateCurrentProfile"
                @keyup.escape="showDuplicateProfile = false"
                ref="duplicateProfileInput"
                />
            <div v-if="error" class="text-danger mt-2">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDuplicateProfile = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="duplicateCurrentProfile">Duplicate</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useDrillStore } from '@/stores/drillStore';

const drillStore = useDrillStore();

const showNewProfile = ref(false);
const showRenameProfile = ref(false);
const showDuplicateProfile = ref(false);
const newProfileName = ref('');
const renameProfileName = ref('');
const duplicateProfileName = ref('');
const error = ref('');

// Refs for input elements
const newProfileInput = ref(null);
const renameProfileInput = ref(null);
const duplicateProfileInput = ref(null);

const selectedProfile = computed({
  get: () => drillStore.currentProfile,
  set: (val) => drillStore.setCurrentProfile(val)
});

const profileNames = computed(() => Object.keys(drillStore.profiles));

// Auto-focus inputs when modals open
watch(showNewProfile, async (val) => {
  if (val) {
    await nextTick();
    newProfileInput.value?.focus();
  } else {
    // Clear error when closing
    error.value = '';
    newProfileName.value = '';
  }
});

watch(showRenameProfile, async (val) => {
  if (val) {
    renameProfileName.value = selectedProfile.value;
    await nextTick();
    renameProfileInput.value?.focus();
    renameProfileInput.value?.select();
  } else {
    // Clear error when closing
    error.value = '';
  }
});

watch(showDuplicateProfile, async (val) => {
  if (val) {
    duplicateProfileName.value = `Copy of ${selectedProfile.value}`;
    await nextTick();
    duplicateProfileInput.value?.focus();
    duplicateProfileInput.value?.select();
  } else {
    // Clear error when closing
    error.value = '';
  }
});

const createNewProfile = () => {
  error.value = '';
  try {
    drillStore.createProfile(newProfileName.value);
    drillStore.setCurrentProfile(newProfileName.value);
    showNewProfile.value = false;
    newProfileName.value = '';
  } catch (e) {
    error.value = e.message;
  }
};

const renameCurrentProfile = () => {
  error.value = '';
  try {
    drillStore.renameProfile(selectedProfile.value, renameProfileName.value);
    showRenameProfile.value = false;
    renameProfileName.value = '';
  } catch (e) {
    error.value = e.message;
  }
};

const duplicateCurrentProfile = () => {
  error.value = '';
  const name = duplicateProfileName.value || `Copy of ${selectedProfile.value}`;
  try {
    drillStore.duplicateProfile(selectedProfile.value, name);
    drillStore.setCurrentProfile(name);
    showDuplicateProfile.value = false;
    duplicateProfileName.value = '';
  } catch (e) {
    error.value = e.message;
  }
};

const deleteCurrentProfile = () => {
  if (profileNames.value.length <= 1) return;
  
  if (confirm(`Delete profile "${selectedProfile.value}"?`)) {
    try {
      drillStore.deleteProfile(selectedProfile.value);
    } catch (e) {
      alert(e.message);
    }
  }
};
</script>

<style scoped>
.profile-manager {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog-custom {
  /* width: 400px;
  max-width: 90vw; */
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  padding: 0.5rem !important;
}

.modal-body{
    padding: 0rem !important;
}

.modal-header {
  border-bottom: 1px solid #dee2e6;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0rem !important;
  padding-bottom: 0.5rem !important;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
  border-radius: 0 0 0.5rem 0.5rem;
  gap: 0.5rem;
  padding: 0rem !important;
}

.modal-footer button{
    margin-top: 0.5rem;
}

.dropdown-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}


.modal-dialog-custom {
  /* max-width: 100vw;
  max-height: 100vh; */
  width: 400px;
  margin: 2.5vh auto;
}

</style>