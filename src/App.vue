<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useTimeStore } from '@/stores/timeStore'
import DebugTimeSetter from '@/components/DebugTimeSetter.vue'
import { preserveDebugQuery } from '@/utils/linkHelper' // Import helper

const eventStore = useEventStore()
const timeStore = useTimeStore()
const route = useRoute()

// Fetch events when the app mounts
onMounted(() => {
  eventStore.fetchEvents()
})

// Format time for the footer
const formattedCurrentTime = computed(() => {
  return timeStore.currentTime.toLocaleTimeString(navigator.language || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

// Check if debug mode should be shown (based on store now, as route watcher handles it)
const showDebugControls = computed(() => timeStore.isDebugModeActive)

// Function to check active link
const isLinkActive = (path: string): boolean => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Use helper for navigation links
const homeLink = computed(() => preserveDebugQuery(route, { name: 'home' }))
const upcomingLink = computed(() => preserveDebugQuery(route, { name: 'upcoming' }))
const overviewLink = computed(() => preserveDebugQuery(route, { name: 'overview' }))
</script>

<template>
  <header class="header">
    <div class="container header-container">
      <nav class="main-nav">
        <RouterLink :to="homeLink" class="nav-link" :class="{ active: isLinkActive('/') }"
          >Home
        </RouterLink>
        <RouterLink
          :to="upcomingLink"
          class="nav-link"
          :class="{ active: isLinkActive('/upcoming') }"
          >Upcoming Events
        </RouterLink>
        <RouterLink
          :to="overviewLink"
          class="nav-link"
          :class="{ active: isLinkActive('/overview') }"
          >Overview
        </RouterLink>
        <a href="https://photo.wry.ch/event/1" class="nav-link">Photos</a>
      </nav>
    </div>
  </header>

  <main id="app-root" class="container main-content">
    <div v-if="eventStore.isLoading" class="loading">Loading events...</div>
    <div v-else-if="eventStore.error" class="error">
      Error loading events: {{ eventStore.error }} Please try refreshing.
    </div>
    <!-- Render RouterView only when not loading and no error -->
    <RouterView v-else :key="route.fullPath" />
    <!-- Key helps re-render on param/query changes if needed -->
  </main>

  <footer class="footer">
    <div class="container footer-container">
      <div class="footer-info">© DECTRIS Ltd. | Current Time: {{ formattedCurrentTime }}</div>
      <!-- Show controls based on store state -->
      <DebugTimeSetter v-if="showDebugControls" />
    </div>
  </footer>
</template>

<style>
@import '@/assets/base.css';
@import '@/assets/style.css';

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
