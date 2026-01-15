import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Search, 
  GraduationCap, 
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Link2,
  Link2Off
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExternalStudent {
  id: string;
  external_id: string;
  full_name: string;
  email: string | null;
  grade_level: number | null;
  class_id: string | null;
  class_name: string | null;
  teacher_name: string | null;
  overall_average: number | null;
  grades: any[];
  misconceptions: any[];
  weak_topics: any[];
  remediation_recommendations: any[];
  skill_tags: string[] | null;
  source: string;
  sync_timestamp: string | null;
  created_at: string;
  linked_user_id: string | null;
  linked_at: string | null;
}

export default function ExternalStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const { data: students, isLoading } = useQuery({
    queryKey: ["external-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_students")
        .select("*")
        .order("class_name", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as ExternalStudent[];
    },
  });

  // Get unique classes for filtering
  const classes = students
    ? [...new Set(students.map((s) => s.class_name).filter(Boolean))]
    : [];

  // Filter students based on search and class selection
  const filteredStudents = students?.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass =
      selectedClass === "all" || student.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate stats
  const totalStudents = students?.length || 0;
  const studentsWithGrades = students?.filter((s) => s.overall_average !== null).length || 0;
  const studentsWithWeakTopics = students?.filter((s) => s.weak_topics?.length > 0).length || 0;
  const linkedStudents = students?.filter((s) => s.linked_user_id !== null).length || 0;
  const averageScore = students
    ? students.reduce((sum, s) => sum + (s.overall_average || 0), 0) / (studentsWithGrades || 1)
    : 0;

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "bg-muted text-muted-foreground";
    if (grade >= 90) return "bg-green-500/20 text-green-700 dark:text-green-400";
    if (grade >= 80) return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
    if (grade >= 70) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    if (grade >= 65) return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
    return "bg-red-500/20 text-red-700 dark:text-red-400";
  };

  return (
    <AdminLayout
      title="External Students"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "External Students" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            External Students
          </h1>
          <p className="text-muted-foreground">
            Students synced from NYCologic AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-muted-foreground">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{studentsWithWeakTopics}</p>
                  <p className="text-sm text-muted-foreground">Need Support</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Link2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{linkedStudents}</p>
                  <p className="text-sm text-muted-foreground">Linked Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full md:w-auto">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All Classes</TabsTrigger>
              {classes.slice(0, 5).map((className) => (
                <TabsTrigger key={className} value={className || ""}>
                  {className?.replace(" Period ", " P")}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Student Records ({filteredStudents?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">Status</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Weak Topics</TableHead>
                      <TableHead>Misconceptions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents?.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {student.linked_user_id ? (
                                  <div className="p-1.5 rounded-full bg-green-500/20">
                                    <Link2 className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-full bg-muted">
                                    <Link2Off className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {student.linked_user_id 
                                  ? `Linked on ${new Date(student.linked_at!).toLocaleDateString()}`
                                  : "Not yet linked to an account"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            {student.email && (
                              <p className="text-xs text-muted-foreground">
                                {student.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{student.class_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.teacher_name || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(student.overall_average)}>
                            {student.overall_average !== null
                              ? `${student.overall_average}%`
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {student.weak_topics?.length > 0 ? (
                              student.weak_topics.slice(0, 3).map((topic: any, i: number) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-orange-500/10 border-orange-500/30"
                                >
                                  {typeof topic === "string" ? topic : topic.name || topic.topic || "—"}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {(student.weak_topics?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.weak_topics.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {student.misconceptions?.length > 0 ? (
                              student.misconceptions.slice(0, 2).map((item: any, i: number) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-red-500/10 border-red-500/30"
                                >
                                  {typeof item === "string" ? item : item.name || item.misconception || "—"}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {(student.misconceptions?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.misconceptions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}