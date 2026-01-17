import { Suspense, lazy, useEffect, useState } from "react";

const ShadcnToaster = lazy(() =>
  import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })),
);

const SonnerToaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

export function DeferredToasters() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <ShadcnToaster />
      <SonnerToaster />
    </Suspense>
  );
}

