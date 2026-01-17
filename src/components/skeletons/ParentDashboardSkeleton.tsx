import { Skeleton } from "@/components/ui/skeleton";

export function ParentDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Section Title */}
        <Skeleton className="h-6 w-36" />

        {/* Children Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className="bg-card rounded-2xl p-5 border border-border shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="w-16 h-8 rounded-full" />
              </div>
              
              {/* XP Bar */}
              <div className="mb-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-full rounded-full" />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-20 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <Skeleton className="h-6 w-32 mt-6" />
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Reward Pledges Section */}
        <Skeleton className="h-6 w-36 mt-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-28 mb-1" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
