import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADE_BANDS } from "@/data/nysStandards";

interface GradeBandSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  includeElementary?: boolean;
  className?: string;
}

export function GradeBandSelector({
  value,
  onValueChange,
  includeElementary = false,
  className,
}: GradeBandSelectorProps) {
  const bands = includeElementary 
    ? GRADE_BANDS 
    : GRADE_BANDS.filter(b => b.value === "6-8" || b.value === "9-10" || b.value === "11-12");

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select grade band" />
      </SelectTrigger>
      <SelectContent>
        {bands.map((band) => (
          <SelectItem key={band.value} value={band.value}>
            {band.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Individual grade selector for student profiles
interface GradeLevelSelectorProps {
  value?: number;
  onValueChange: (value: number) => void;
  className?: string;
}

export function GradeLevelSelector({
  value,
  onValueChange,
  className,
}: GradeLevelSelectorProps) {
  const grades = [
    { value: 6, label: "6th Grade" },
    { value: 7, label: "7th Grade" },
    { value: 8, label: "8th Grade" },
    { value: 9, label: "9th Grade (Freshman)" },
    { value: 10, label: "10th Grade (Sophomore)" },
    { value: 11, label: "11th Grade (Junior)" },
    { value: 12, label: "12th Grade (Senior)" },
  ];

  return (
    <Select 
      value={value?.toString()} 
      onValueChange={(v) => onValueChange(parseInt(v, 10))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select grade level" />
      </SelectTrigger>
      <SelectContent>
        {grades.map((grade) => (
          <SelectItem key={grade.value} value={grade.value.toString()}>
            {grade.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
