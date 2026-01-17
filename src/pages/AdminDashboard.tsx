import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Users,
  Link2,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Trophy,
  ArrowRight,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";
import { AdminDashboardSkeleton } from "@/components/skeletons/AdminDashboardSkeleton";

export default function AdminDashboard() {
  // Fetch external students stats
  const { data: externalStats, isLoading: loadingExternal } = useQuery({
    queryKey: ["admin-external-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_students")
        .select("id, linked_user_id, overall_average, weak_topics");

      if (error) throw error;

      const total = data?.length || 0;
      const linked = data?.filter((s) => s.linked_user_id).length || 0;
      const needsSupport = data?.filter((s) => s.weak_topics && (s.weak_topics as any[]).length > 0).length || 0;
      const avgGrade = data?.reduce((sum, s) => sum + (s.overall_average || 0), 0) / (total || 1);

      return { total, linked, needsSupport, avgGrade };
    },
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true,
  });

  // Fetch classes count
  const { data: classesCount } = useQuery({
    queryKey: ["admin-classes-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch active students (with student_profiles)
  const { data: activeStudents } = useQuery({
    queryKey: ["admin-active-students"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("student_profiles")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch badges count
  const { data: badgesCount } = useQuery({
    queryKey: ["admin-badges-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("badges")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch recent sync activity
  const { data: recentSyncs } = useQuery({
    queryKey: ["admin-recent-syncs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_event_logs")
        .select("*")
        .eq("event_type", "student-sync")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const stats = [
    {
      title: "Total Synced Students",
      value: externalStats?.total || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      change: "+154 from NYCologic",
    },
    {
      title: "Linked Accounts",
      value: externalStats?.linked || 0,
      icon: Link2,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      change: `${Math.round(((externalStats?.linked || 0) / (externalStats?.total || 1)) * 100)}% linked`,
    },
    {
      title: "Average Grade",
      value: `${(externalStats?.avgGrade || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      change: "Across all students",
    },
    {
      title: "Need Support",
      value: externalStats?.needsSupport || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      change: "Students with weak topics",
    },
  ];

  const quickActions = [
    {
      title: "View External Students",
      description: "See all synced students with grades and weak topics",
      icon: Users,
      href: "/admin/external-students",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Admin Settings",
      description: "Manage API keys and integrations",
      icon: Settings,
      href: "/admin/settings",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "View Classes",
      description: "Manage classes and enrollments",
      icon: GraduationCap,
      href: "/admin/classes",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Manage Badges",
      description: "Create and edit achievement badges",
      icon: Trophy,
      href: "/admin/badges",
      color: "from-amber-500 to-amber-600",
    },
  ];

  const isLoading = loadingExternal;

  return (
    <AdminLayout
      title="Dashboard"
      breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
    >
      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of Scholar Quest system and student data
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">
                      {loadingExternal ? "..." : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common admin tasks and navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.title}
                      to={action.href}
                      className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                    >
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white`}
                      >
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Active Classes</span>
                </div>
                <Badge variant="secondary">{classesCount || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Registered Students</span>
                </div>
                <Badge variant="secondary">{activeStudents || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Available Badges</span>
                </div>
                <Badge variant="secondary">{badgesCount || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Recent Syncs</span>
                </div>
                <Badge variant="secondary">{recentSyncs?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Recent Sync Activity
            </CardTitle>
            <CardDescription>
              Latest data synchronization from NYCologic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSyncs && recentSyncs.length > 0 ? (
              <div className="space-y-3">
                {recentSyncs.map((sync) => (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          sync.status === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{sync.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sync.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={sync.status === "success" ? "default" : "destructive"}
                    >
                      {sync.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent sync activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </AdminLayout>
  );
}
