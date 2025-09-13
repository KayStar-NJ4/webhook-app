<template>
  <FormModalComponent
    :isVisible="isVisible"
    :title="isEdit ? $t('users.edit') : $t('users.create')"
    size="medium"
    :loading="isSaving"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <div class="user-form">
      <FormInputTextComponent
        v-model="form.username"
        :label="$t('users.fields.username')"
        :placeholder="$t('users.fields.username')"
        :required="true"
        :error="errors.username"
      />

      <FormInputTextComponent
        v-model="form.email"
        :label="$t('users.fields.email')"
        type="email"
        :placeholder="$t('users.fields.email')"
        :required="true"
        :error="errors.email"
      />

      <FormInputTextComponent
        v-model="form.fullName"
        :label="$t('users.fields.fullName')"
        :placeholder="$t('users.fields.fullName')"
        :error="errors.fullName"
      />

      <FormInputTextComponent
        v-if="!isEdit"
        v-model="form.password"
        :label="$t('users.fields.password')"
        type="password"
        :placeholder="$t('users.fields.password')"
        :required="!isEdit"
        :error="errors.password"
      />

      <FormCheckBoxComponent
        v-model="form.isActive"
        :label="$t('users.fields.isActive')"
        :helpText="$t('users.fields.isActive')"
      />
    </div>

    <template #footer>
      <FormButtonComponent
        @click="$emit('close')"
        variant="secondary"
        :text="$t('common.cancel')"
      />
      <FormButtonComponent
        @click="handleSave"
        variant="primary"
        :loading="isSaving"
        :text="isSaving ? $t('common.saving') : $t('common.save')"
      />
    </template>
  </FormModalComponent>
</template>

<script>
// Form components will be loaded dynamically

export default {
  name: 'UserFormComponent',
  components: {
    FormModalComponent: window.FormModalComponent,
    FormInputTextComponent: window.FormInputTextComponent,
    FormCheckBoxComponent: window.FormCheckBoxComponent,
    FormButtonComponent: window.FormButtonComponent
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    isSaving: {
      type: Boolean,
      default: false
    },
    errors: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'save'],
  data() {
    return {
      form: {
        username: '',
        email: '',
        fullName: '',
        password: '',
        isActive: true
      }
    }
  },
  watch: {
    user: {
      handler(newUser) {
        if (newUser) {
          this.form = {
            username: newUser.username || '',
            email: newUser.email || '',
            fullName: newUser.full_name || '',
            password: '',
            isActive: newUser.is_active !== false
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      this.form = {
        username: '',
        email: '',
        fullName: '',
        password: '',
        isActive: true
      }
    },

    handleSave() {
      this.$emit('save', { ...this.form })
    }
  }
}
</script>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
