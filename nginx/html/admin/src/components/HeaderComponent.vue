<template>
  <nav class="main-header navbar navbar-expand navbar-white navbar-light">
    <!-- Left navbar links -->
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" data-widget="pushmenu" href="#" role="button">
          <i class="fas fa-bars"></i>
        </a>
      </li>
    </ul>
    
    <!-- Left: Page Title -->
    <div class="navbar-nav">
      <span class="navbar-text font-weight-bold">{{ pageTitle }}</span>
    </div>
    
    <!-- Right: Breadcrumb -->
    <ul class="navbar-nav ml-auto">
      <li class="nav-item">
        <ol class="breadcrumb mb-0" style="background: transparent; padding: 0;">
          <li class="breadcrumb-item"><a href="/admin" style="color: #6c757d;">Home</a></li>
          <li class="breadcrumb-item active" style="color: #007bff;">{{ pageTitle }}</li>
        </ol>
      </li>
    </ul>
    
    <!-- Right navbar links -->
    <ul class="navbar-nav ml-2">
      <li class="nav-item dropdown">
        <a class="nav-link" data-toggle="dropdown" href="#">
          <i class="far fa-user"></i>
          <span v-if="user">{{ user.username }}</span>
        </a>
        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
          <a href="#" class="dropdown-item" @click="logout">
            <i class="fas fa-sign-out-alt mr-2"></i> Đăng xuất
          </a>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'HeaderComponent',
  props: {
    user: {
      type: Object,
      default: null
    },
    pageTitle: {
      type: String,
      default: 'Dashboard'
    }
  },
  methods: {
    logout() {
      this.$emit('logout');
    }
  }
}
</script>

<style scoped>
/* Header specific styles if needed */
</style>
