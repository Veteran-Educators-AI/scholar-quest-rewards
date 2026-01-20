/**
 * GeoBlox Access Hook
 *
 * This hook has been migrated to React Query for better caching and state management.
 * Re-exported for backwards compatibility - existing imports will continue to work.
 *
 * @example
 * // Both imports work the same way:
 * import { useGeobloxAccess } from "@/hooks/useGeobloxAccess";
 * import { useGeobloxAccess } from "@/hooks/queries";
 */

export { useGeobloxAccess, type GeometryMastery } from "./queries/useGeobloxAccess";
