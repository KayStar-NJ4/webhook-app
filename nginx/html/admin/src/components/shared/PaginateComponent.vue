<template>
  <div>
    <nav aria-label="Page navigation">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage <= 1 }">
          <a class="page-link" href="#" @click.prevent="goToPage(currentPage - 1)">«</a>
        </li>
        <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
          <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
          <a class="page-link" href="#" @click.prevent="goToPage(currentPage + 1)">»</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'PaginateComponent',
  props: {
    totalPages: {
      type: Number,
      required: true
    },
    currentPage: {
      type: Number,
      required: true
    },
    maxVisible: {
      type: Number,
      default: 5
    }
  },
  computed: {
    visiblePages() {
      const current = this.currentPage;
      const total = this.totalPages;
      const pages = [];
      
      // Show max pages
      let start = Math.max(1, current - Math.floor(this.maxVisible / 2));
      let end = Math.min(total, start + this.maxVisible - 1);
      
      // Adjust if we're near the beginning or end
      if (end - start < this.maxVisible - 1) {
        if (start === 1) {
          end = Math.min(total, start + this.maxVisible - 1);
        } else {
          start = Math.max(1, end - this.maxVisible + 1);
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  },
  methods: {
    goToPage(pageNum) {
      if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
        this.$emit('page-change', pageNum);
      }
    }
  }
}
</script>

<style scoped>
.pagination {
  margin: 0;
}

.page-link {
  color: #007bff;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  margin-left: -1px;
}

.page-link:hover {
  color: #0056b3;
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #fff;
  border-color: #dee2e6;
}
</style>
