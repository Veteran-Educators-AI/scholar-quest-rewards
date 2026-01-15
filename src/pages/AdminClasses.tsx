import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExternalStudent {
  id: string;
  full_name: string;
  external_id: string;
  class_name: string | null;
  teacher_name: string | null;
  overall_average: number | null;
  grades: Record<string, number> | null;
  linked_user_id: string | null;
  weak_topics: string[] | null;
  skill_tags: string[] | null;
}

interface ClassGroup {
  className: string;
  classCode: string | null;
  teacherName: string | null;
  students: ExternalStudent[];
  avgGrade: number;
  linkedCount: number;
}

interface ClassInfo {
  name: string;
  class_code: string;
}

export default function AdminClasses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("by-class");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-all-students"],
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

  // Fetch classes with their codes
  const { data: classes = [] } = useQuery({
    queryKey: ["admin-classes-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("name, class_code");

      if (error) throw error;
      return data as ClassInfo[];
    },
  });

  // Create a map of class names to codes
  const classCodeMap = new Map(classes.map((c) => [c.name, c.class_code]));

  // Group students by class
  const classGroups: ClassGroup[] = students.reduce((acc: ClassGroup[], student) => {
    const className = student.class_name || "Unassigned";
    const existing = acc.find((g) => g.className === className);
    
    if (existing) {
      existing.students.push(student);
      if (student.overall_average) {
        existing.avgGrade = (existing.avgGrade * (existing.students.length - 1) + student.overall_average) / existing.students.length;
      }
      if (student.linked_user_id) {
        existing.linkedCount++;
      }
    } else {
      acc.push({
        className,
        classCode: classCodeMap.get(className) || null,
        teacherName: student.teacher_name,
        students: [student],
        avgGrade: student.overall_average || 0,
        linkedCount: student.linked_user_id ? 1 : 0,
      });
    }
    return acc;
  }, []);

  // Filter based on search
  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classGroups.filter((g) =>
    g.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.students.some((s) => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getGradeColor = (grade: number | null) => {
    if (!grade) return "text-muted-foreground";
    if (grade >= 85) return "text-green-600 dark:text-green-400";
    if (grade >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getGradeBadgeVariant = (grade: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!grade) return "outline";
    if (grade >= 85) return "default";
    if (grade >= 70) return "secondary";
    return "destructive";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Classes & Students</h1>
          <p className="text-muted-foreground">
            View all {students.length} synced students organized by class
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classGroups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s) => s.linked_user_id).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {((students.filter((s) => s.linked_user_id).length / students.length) * 100).toFixed(1)}% of students
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Support</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {students.filter((s) => s.overall_average && s.overall_average < 70).length}
              </div>
              <p className="text-xs text-muted-foreground">Below 70% average</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students, classes, or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="by-class">By Class</TabsTrigger>
            <TabsTrigger value="all-students">All Students</TabsTrigger>
          </TabsList>

          <TabsContent value="by-class" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Loading classes...
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {filteredClasses.map((classGroup) => (
                  <AccordionItem
                    key={classGroup.className}
                    value={classGroup.className}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold">{classGroup.className}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">
                                {classGroup.teacherName || "No teacher assigned"}
                              </p>
                              {classGroup.classCode && (
                                <Badge variant="outline" className="font-mono text-xs bg-primary/5">
                                  Code: {classGroup.classCode}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {classGroup.students.length} students
                          </Badge>
                          <Badge variant={getGradeBadgeVariant(classGroup.avgGrade)}>
                            Avg: {classGroup.avgGrade.toFixed(1)}%
                          </Badge>
                          <Badge variant="secondary">
                            {classGroup.linkedCount} linked
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Average</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Skills</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classGroup.students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  {student.full_name}
                                </TableCell>
                                <TableCell>
                                  <span className={getGradeColor(student.overall_average)}>
                                    {student.overall_average?.toFixed(1) || "N/A"}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {student.linked_user_id ? (
                                    <Badge variant="default" className="text-xs">
                                      Linked
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      Not Linked
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {student.skill_tags?.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {(student.skill_tags?.length || 0) > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{(student.skill_tags?.length || 0) - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="all-students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>
                  Complete list of {filteredStudents.length} students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.full_name}
                          </TableCell>
                          <TableCell>{student.class_name || "Unassigned"}</TableCell>
                          <TableCell>{student.teacher_name || "—"}</TableCell>
                          <TableCell>
                            <span className={getGradeColor(student.overall_average)}>
                              {student.overall_average?.toFixed(1) || "N/A"}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {student.linked_user_id ? (
                              <Badge variant="default" className="text-xs">
                                Linked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Not Linked
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
