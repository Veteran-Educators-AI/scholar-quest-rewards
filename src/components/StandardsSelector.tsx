import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  NYS_STANDARDS,
  SUBJECTS,
  GRADE_BANDS,
  getStandardsBySubjectAndGrade,
  getDomainsForSubject,
  type NYSStandard,
} from "@/data/nysStandards";

interface StandardsSelectorProps {
  value?: string; // standard code
  onValueChange: (code: string, standard: NYSStandard | null) => void;
  gradeBand?: string;
  subject?: string;
  className?: string;
}

export function StandardsSelector({
  value,
  onValueChange,
  gradeBand: initialGradeBand,
  subject: initialSubject,
  className,
}: StandardsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [gradeBand, setGradeBand] = useState(initialGradeBand || "9-10");
  const [subject, setSubject] = useState(initialSubject || "");
  const [domain, setDomain] = useState("");

  const domains = useMemo(() => {
    if (!subject) return [];
    return getDomainsForSubject(subject, gradeBand);
  }, [subject, gradeBand]);

  const filteredStandards = useMemo(() => {
    let standards = NYS_STANDARDS.filter(s => s.gradeBand === gradeBand);
    if (subject) {
      standards = standards.filter(s => s.subject === subject);
    }
    if (domain) {
      standards = standards.filter(s => s.domain === domain);
    }
    return standards;
  }, [gradeBand, subject, domain]);

  const selectedStandard = useMemo(() => {
    return NYS_STANDARDS.find(s => s.code === value);
  }, [value]);

  const handleSelect = (code: string) => {
    const standard = NYS_STANDARDS.find(s => s.code === code) || null;
    onValueChange(code, standard);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={gradeBand} onValueChange={(v) => { setGradeBand(v); setDomain(""); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Grade Band" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_BANDS.filter(g => g.value === "9-10" || g.value === "11-12").map((band) => (
              <SelectItem key={band.value} value={band.value}>
                {band.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={(v) => { setSubject(v); setDomain(""); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((subj) => (
              <SelectItem key={subj} value={subj}>
                {subj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {domains.length > 0 && (
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Standard Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
          >
            {selectedStandard ? (
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {selectedStandard.code}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedStandard.domain}
                  </span>
                </div>
                <span className="text-sm mt-1 line-clamp-2">
                  {selectedStandard.standardText}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Select a NYS Learning Standard...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search standards by code or text..." />
            <CommandList>
              <CommandEmpty>
                {!subject ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Select a subject to see available standards
                  </div>
                ) : (
                  "No standards found."
                )}
              </CommandEmpty>
              {filteredStandards.length > 0 && (
                <CommandGroup>
                  {filteredStandards.map((standard) => (
                    <CommandItem
                      key={standard.code}
                      value={`${standard.code} ${standard.standardText}`}
                      onSelect={() => handleSelect(standard.code)}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === standard.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Badge variant="outline" className="font-mono text-xs">
                          {standard.code}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {standard.domain}
                        </span>
                      </div>
                      <p className="text-sm mt-1 ml-6 text-muted-foreground line-clamp-2">
                        {standard.standardText}
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Standard Details */}
      {selectedStandard && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary">{selectedStandard.subject}</Badge>
            <Badge variant="outline">{selectedStandard.gradeBand}</Badge>
            {selectedStandard.cluster && (
              <span className="text-xs text-muted-foreground">
                {selectedStandard.cluster}
              </span>
            )}
          </div>
          <p className="text-foreground">{selectedStandard.standardText}</p>
        </div>
      )}
    </div>
  );
}
