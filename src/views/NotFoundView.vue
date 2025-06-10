<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { preserveDebugQuery } from '@/utils/linkHelper'

const route = useRoute()
const homeLink = computed(() => preserveDebugQuery(route, { name: 'home' }))
</script>

<template>
  <div class="not-found-view">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
    <RouterLink :to="homeLink">Go to Home Page</RouterLink>
  </div>
</template>

<style scoped>
.not-found-view {
  text-align: center;
  padding: 3rem 1rem;
}

h1 {
  color: var(--dectris-blue);
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1.5rem;
  font-size: 1.1em;
  color: var(--text-muted);
}

a {
  color: var(--dectris-lightblue);
  text-decoration: underline;
}
</style>
