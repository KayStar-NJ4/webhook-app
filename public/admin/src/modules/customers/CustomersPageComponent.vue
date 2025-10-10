<template>
  <div class="customers-page">
    <CustomerListComponent :userPermissions="userPermissions" />
  </div>
</template>

<script>
export default {
  name: 'CustomersPageComponent',
  data() {
    return {
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData();
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userPermissions = user?.permissions || {};
        } catch (error) {
          this.userPermissions = {};
        }
      }
    }
  },
  components: {
    CustomerListComponent: window.CustomerListComponent
  }
}
</script>

<style scoped>
.customers-page {
  padding: 20px;
}
</style>

