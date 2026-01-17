// Route prefetch mapping - maps paths to their lazy import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  '/student': () => import('@/pages/StudentHome'),
  '/student/practice-center': () => import('@/pages/PracticeCenter'),
  '/student/rewards': () => import('@/pages/Rewards'),
  '/student/leaderboard': () => import('@/pages/Leaderboard'),
  '/student/challenges': () => import('@/pages/Challenges'),
  '/student/profile': () => import('@/pages/StudentProfile'),
  '/student/notifications': () => import('@/pages/NotificationCenter'),
  '/student/raffle': () => import('@/pages/Raffle'),
  '/games': () => import('@/pages/GameCenter'),
  '/regents-prep': () => import('@/pages/RegentsPrep'),
  '/study-plan': () => import('@/pages/StudyPlan'),
  '/parent': () => import('@/pages/ParentDashboard'),
  '/admin': () => import('@/pages/AdminDashboard'),
  '/admin/classes': () => import('@/pages/AdminClasses'),
  '/admin/settings': () => import('@/pages/AdminSettings'),
  '/admin/external-students': () => import('@/pages/ExternalStudents'),
  '/auth': () => import('@/pages/Auth'),
};

// Cache to track which routes have been prefetched
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's JavaScript bundle
 */
export const prefetchRoute = (path: string): void => {
  // Normalize path (remove query params and trailing slashes)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';
  
  // Skip if already prefetched
  if (prefetchedRoutes.has(normalizedPath)) return;
  
  // Find matching route (handle dynamic routes)
  const importFn = routeImports[normalizedPath];
  
  if (importFn) {
    prefetchedRoutes.add(normalizedPath);
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(() => {
          // Remove from cache if prefetch fails so it can retry
          prefetchedRoutes.delete(normalizedPath);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn().catch(() => {
          prefetchedRoutes.delete(normalizedPath);
        });
      }, 100);
    }
  }
};

/**
 * Prefetch multiple routes at once
 */
export const prefetchRoutes = (paths: string[]): void => {
  paths.forEach(prefetchRoute);
};

/**
 * Get common navigation paths based on user role
 */
export const getCommonPaths = (role?: string): string[] => {
  switch (role) {
    case 'student':
      return [
        '/student/practice-center',
        '/student/rewards',
        '/student/leaderboard',
        '/games',
        '/regents-prep',
      ];
    case 'teacher':
    case 'admin':
      return [
        '/admin/classes',
        '/admin/external-students',
        '/admin/settings',
      ];
    case 'parent':
      return ['/parent'];
    default:
      return ['/auth', '/student'];
  }
};

/**
 * Hook to prefetch routes on component mount based on user role
 */
export const usePrefetchOnMount = (role?: string): void => {
  // Prefetch common paths when component mounts
  if (typeof window !== 'undefined') {
    const paths = getCommonPaths(role);
    // Delay prefetching to not compete with initial load
    setTimeout(() => prefetchRoutes(paths), 1000);
  }
};
