import { Link, LinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { prefetchRoute } from "@/hooks/usePrefetch";

interface PrefetchLinkProps extends LinkProps {
  prefetch?: boolean;
}

/**
 * A Link component that prefetches the target route on hover/focus
 * for instant page transitions
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, prefetch = true, onMouseEnter, onFocus, children, ...props }, ref) => {
    const path = typeof to === 'string' ? to : to.pathname || '';

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (prefetch && path) {
          prefetchRoute(path);
        }
        onMouseEnter?.(e);
      },
      [prefetch, path, onMouseEnter]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (prefetch && path) {
          prefetchRoute(path);
        }
        onFocus?.(e);
      },
      [prefetch, path, onFocus]
    );

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = "PrefetchLink";

export { PrefetchLink };
export type { PrefetchLinkProps };
