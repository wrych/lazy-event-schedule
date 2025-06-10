<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import { preserveDebugQuery } from '@/utils/linkHelper' // Import helper
import UpcomingView from '@/views/UpcomingView.vue'

const route = useRoute()

const upcomingLink = computed(() => preserveDebugQuery(route, { name: 'overview' }))
</script>

<template>
  <UpcomingView />
  <div class="container">

    <RouterLink :to="upcomingLink" class="nav-button-link" aria-label="Program Overview Link"
      title="Go to the Program Overview">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM12 11H8V13H12V11ZM16 15H8V17H16V15ZM16 11H14V13H16V11Z">
        </path>
      </svg>
      <span>Overview</span>
    </RouterLink>

    <a href="https://photo.wry.ch/event/1" class="nav-button-link" aria-label="Photo Sharing App Link"
      title="Go to Photo Sharing App">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM6.5 13.5179C7.32736 12.6324 8.5 11 10.5 11C12.5 11 13.5726 12.6324 14.5 13.5179L17.5 10.25C18.25 9.43333 19.5 10.5 19.5 11.5V17H4.5V14.5C4.5 13.5 5.75 12.4333 6.5 13.5179ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8Z">
        </path>
      </svg>
      <span>Photos</span>
    </a>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  /* Arrange items in a row (mobile first) */
  gap: 30px;
  /* Space between the links */
  padding: 20px;
  /* Add some padding just in case */
  box-sizing: border-box;
  max-width: 90%;
  /* Prevent container from being too wide on small screens */
  width: fit-content;
  /* Adjust container width to fit content */
}

.nav-button-link {
  display: flex;
  flex-direction: column;
  /* Stack icon and text vertically */
  justify-content: center;
  /* Center content vertically within the link */
  align-items: center;
  /* Center content horizontally within the link */
  color: white;
  /* Icon and text color */
  text-decoration: none;
  /* Remove underline from link */
  padding: 15px 20px;
  /* Padding around the content inside the link */
  background-color: rgba(34, 52, 122, 0.2);
  /* Subtle transparent white background */
  border-radius: 10px;
  /* Rounded corners */
  transition: background-color 0.3s ease;
  /* Smooth hover effect */
  backdrop-filter: blur(3px);
  /* Optional: Adds a slight blur effect behind the links */
  -webkit-backdrop-filter: blur(3px);
  /* Safari support */
  text-align: center;
  /* Center the text below the icon */
  flex: 1;
  /* Allow links to grow/shrink slightly */
  min-width: 120px;
  /* Ensure minimum width for links on narrow screens */
}

.nav-button-link:hover,
.nav-button-link:focus {
  background-color: rgba(34, 52, 122, 0.4);
  /* More opaque on hover/focus */
  outline: none;
  /* Remove default focus outline */
}

.nav-button-link svg {
  width: 40px;
  /* Icon size */
  height: 40px;
  fill: currentColor;
  /* Make SVG color match parent text color (white) */
  display: block;
  /* Ensure block display */
  margin-bottom: 8px;
  /* Space between icon and text */
}

.nav-button-link span {
  font-size: 1rem;
  /* Text size */
  font-weight: bold;
  line-height: 1.2;
  /* Adjust line height */
}
</style>
