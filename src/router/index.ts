import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UpcomingView from '../views/UpcomingView.vue'
import OverviewView from '../views/OverviewView.vue'
import DayDetailView from '../views/DayDetailView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Helper to check if debug is active in the CURRENT route
function isDebugActive(route: RouteLocationNormalized): boolean {
  return route.query.debug === 'true'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/upcoming',
      name: 'upcoming',
      component: UpcomingView,
    },
    {
      path: '/overview',
      name: 'overview',
      component: OverviewView,
    },
    {
      path: '/day/:date', // YYYY-MM-DD format
      name: 'day-detail',
      component: DayDetailView,
      props: true, // Pass route params as props
    },
    {
      path: '/event/:id', // Event ID
      name: 'event-detail',
      component: EventDetailView,
      props: true, // Pass route params as props
    },
    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundView,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
