<template>
  <FormModalComponent
    :isVisible="isVisible"
    :title="isEdit ? 'Edit Telegram Bot' : 'Create Telegram Bot'"
    size="medium"
    :loading="isSaving"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <div class="telegram-form">
      <FormInputTextComponent
        v-model="form.name"
        label="Bot Name"
        placeholder="Enter bot name"
        :required="true"
        :error="errors.name"
      />

      <FormInputTextComponent
        v-model="form.bot_token"
        label="Bot Token"
        type="password"
        placeholder="Enter bot token"
        :required="true"
        :error="errors.bot_token"
        helpText="Get this from @BotFather on Telegram"
      />

      <FormInputTextComponent
        v-model="form.api_url"
        label="API URL"
        placeholder="https://api.telegram.org"
        :required="true"
        :error="errors.api_url"
        helpText="Telegram Bot API URL (usually https://api.telegram.org)"
      />

      <FormInputTextComponent
        v-model="form.webhook_url"
        label="Webhook URL"
        placeholder="https://yourdomain.com/webhook/telegram"
        :error="errors.webhook_url"
        helpText="Optional: Set webhook URL for receiving updates"
      />

      <FormCheckBoxComponent
        v-model="form.is_active"
        label="Active"
        helpText="Enable this bot for use"
      />
    </div>

    <template #footer>
      <FormButtonComponent
        @click="$emit('close')"
        variant="secondary"
        text="Cancel"
      />
      <FormButtonComponent
        @click="handleSave"
        variant="primary"
        :loading="isSaving"
        :text="isSaving ? 'Saving...' : 'Save'"
      />
    </template>
  </FormModalComponent>
</template>

<script>
import FormModalComponent from '../../components/shared/FormModalComponent.vue'
import FormInputTextComponent from '../../components/shared/FormInputTextComponent.vue'
import FormCheckBoxComponent from '../../components/shared/FormCheckBoxComponent.vue'
import FormButtonComponent from '../../components/shared/FormButtonComponent.vue'

export default {
  name: 'TelegramBotFormComponent',
  components: {
    FormModalComponent,
    FormInputTextComponent,
    FormCheckBoxComponent,
    FormButtonComponent
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    bot: {
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
        bot_token: '',
        api_url: 'https://api.telegram.org',
        webhook_url: '',
        is_active: true
      }
    }
  },
  watch: {
    bot: {
      handler(newBot) {
        if (newBot) {
          this.form = {
            name: newBot.name || '',
            bot_token: newBot.bot_token || '',
            api_url: newBot.api_url || 'https://api.telegram.org',
            webhook_url: newBot.webhook_url || '',
            is_active: newBot.is_active !== false
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
        bot_token: '',
        api_url: 'https://api.telegram.org',
        webhook_url: '',
        is_active: true
      }
    },

    handleSave() {
      this.$emit('save', { ...this.form })
    }
  }
}
</script>

<style scoped>
.telegram-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
