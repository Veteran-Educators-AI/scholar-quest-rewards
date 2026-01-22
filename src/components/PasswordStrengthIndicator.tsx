import { Check, X } from "lucide-react";
import {
  validatePassword,
  getStrengthColor,
  getStrengthLabel,
  type PasswordValidationResult,
} from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className="text-xs font-medium">{getStrengthLabel(validation.strength)}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{
              width: `${getStrengthWidth(validation.strength)}%`,
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <ul className="space-y-1">
          {validation.requirements.map((req) => (
            <li
              key={req.id}
              className={`flex items-center gap-2 text-xs ${
                req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              }`}
            >
              {req.met ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getStrengthWidth(strength: PasswordValidationResult["strength"]): number {
  switch (strength) {
    case "weak":
      return 25;
    case "fair":
      return 50;
    case "good":
      return 75;
    case "strong":
      return 100;
  }
}
