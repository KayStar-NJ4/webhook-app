<template>
  <FormModalComponent
    :isVisible="isVisible"
    :title="isEdit ? $t('chatwoot.edit') : $t('chatwoot.create')"
    size="medium"
    :loading="isSaving"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <div class="chatwoot-form">
      <FormInputTextComponent
        v-model="form.name"
        :label="$t('chatwoot.fields.name')"
        :placeholder="$t('chatwoot.fields.name')"
        :required="true"
        :error="errors.name"
      />

      <FormInputTextComponent
        v-model="form.baseUrl"
        :label="$t('chatwoot.fields.baseUrl')"
        :placeholder="'https://app.chatwoot.com'"
        :required="true"
        :error="errors.baseUrl"
        :helpText="$t('chatwoot.help.baseUrl')"
      />

      <FormInputTextComponent
        v-model="form.accessToken"
        :label="$t('chatwoot.fields.accessToken')"
        type="password"
        :placeholder="$t('chatwoot.fields.accessToken')"
        :required="true"
        :error="errors.accessToken"
        :helpText="$t('chatwoot.help.accessToken')"
      />

      <FormInputTextComponent
        v-model="form.accountId"
        :label="$t('chatwoot.fields.accountId')"
        :placeholder="$t('chatwoot.fields.accountId')"
        :required="true"
        :error="errors.accountId"
        :helpText="$t('chatwoot.help.accountId')"
      />

      <FormInputTextComponent
        v-model="form.inboxId"
        :label="$t('chatwoot.fields.inboxId')"
        :placeholder="'1'"
        type="number"
        :required="true"
        :error="errors.inboxId"
        :helpText="$t('chatwoot.help.inboxId')"
      />

      <FormCheckBoxComponent
        v-model="form.isActive"
        :label="$t('chatwoot.fields.isActive')"
        :helpText="$t('chatwoot.fields.isActive')"
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
  name: 'ChatwootFormComponent',
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
    account: {
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
        name: '',
        baseUrl: '',
        accessToken: '',
        accountId: '',
        inboxId: 1,
        isActive: true
      }
    }
  },
  watch: {
    account: {
      handler(newAccount) {
        if (newAccount) {
          this.form = {
            name: newAccount.name || '',
            baseUrl: newAccount.base_url || '',
            accessToken: newAccount.access_token || '',
            accountId: newAccount.account_id || '',
            inboxId: newAccount.inbox_id || 1,
            isActive: newAccount.is_active !== false
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
        name: '',
        baseUrl: '',
        accessToken: '',
        accountId: '',
        inboxId: 1,
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
.chatwoot-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
