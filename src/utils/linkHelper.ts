import type { RouteLocationRaw, RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * Creates a RouteLocationRaw object for RouterLink, preserving the 'debug=true' query parameter if present.
 * @param route The current route object (from useRoute()).
 * @param target The target route (name and params).
 * @returns RouteLocationRaw object including query parameters if needed.
 */
export function preserveDebugQuery(
  route: RouteLocationNormalizedLoaded,
  target: RouteLocationRaw,
): RouteLocationRaw {
  const targetLocation = typeof target === 'string' ? { path: target } : { ...target } // Ensure object format

  if (route.query.debug === 'true') {
    if (!targetLocation.query) {
      targetLocation.query = {}
    }
    // Prevent overriding existing debug query if target already has one
    if (!('debug' in targetLocation.query)) {
      targetLocation.query.debug = 'true'
    }
  }
  return targetLocation
}
