import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECTS, GRADE_BANDS } from "@/data/nysStandards";
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface BrowseableClass {
  id: string;
  name: string;
  subject: string | null;
  grade_level: number | null;
  grade_band: string | null;
  teacher_name: string;
  student_count: number;
}

interface ClassBrowserProps {
  onSelectClass: (classId: string, className: string) => void;
  isJoining?: boolean;
}

const PAGE_SIZE = 6;

// Filter grade bands to only show middle/high school
const BROWSE_GRADE_BANDS = GRADE_BANDS.filter(
  (b) => b.value === "6-8" || b.value === "9-10" || b.value === "11-12"
);

export function ClassBrowser({ onSelectClass, isJoining }: ClassBrowserProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [gradeBandFilter, setGradeBandFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [subjectFilter, gradeBandFilter]);

  // Query for classes
  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "browse-classes",
      debouncedSearch,
      subjectFilter,
      gradeBandFilter,
      currentPage,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("browse_classes", {
        p_search: debouncedSearch || "",
        p_subject: subjectFilter,
        p_grade_band: gradeBandFilter,
        p_page: currentPage,
        p_page_size: PAGE_SIZE,
      });
      if (error) throw error;
      return data as BrowseableClass[];
    },
  });

  // Query for total count
  const { data: totalCount } = useQuery({
    queryKey: [
      "browse-classes-count",
      debouncedSearch,
      subjectFilter,
      gradeBandFilter,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("browse_classes_count", {
        p_search: debouncedSearch || "",
        p_subject: subjectFilter,
        p_grade_band: gradeBandFilter,
      });
      if (error) throw error;
      return data as number;
    },
  });

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  const handleClearFilters = () => {
    setSearch("");
    setSubjectFilter(null);
    setGradeBandFilter(null);
    setCurrentPage(1);
  };

  const hasFilters = search || subjectFilter || gradeBandFilter;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search classes or teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={subjectFilter || "all"}
            onValueChange={(v) => setSubjectFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={gradeBandFilter || "all"}
            onValueChange={(v) => setGradeBandFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {BROWSE_GRADE_BANDS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-2">Failed to load classes</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : classes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No classes found</p>
            <p className="text-sm text-muted-foreground mb-3">
              {hasFilters
                ? "Try adjusting your search or filters"
                : "No classes are available yet"}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${debouncedSearch}-${subjectFilter}-${gradeBandFilter}-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {classes?.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {cls.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {cls.teacher_name}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cls.subject && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <BookOpen className="w-3 h-3" />
                                {cls.subject}
                              </span>
                            )}
                            {cls.grade_band && (
                              <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                <GraduationCap className="w-3 h-3" />
                                {cls.grade_band}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {cls.student_count}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onSelectClass(cls.id, cls.name)}
                          disabled={isJoining}
                        >
                          {isJoining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
