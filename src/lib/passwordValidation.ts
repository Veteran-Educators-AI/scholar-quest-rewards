export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
  requirements: Array<{ id: string; label: string; met: boolean }>;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character (!@#$%^&*)",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function validatePassword(password: string): PasswordValidationResult {
  const results = PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    met: req.test(password),
  }));

  const errors = results.filter((r) => !r.met).map((r) => r.label);
  const metCount = results.filter((r) => r.met).length;

  let strength: PasswordValidationResult["strength"];
  if (metCount <= 2) {
    strength = "weak";
  } else if (metCount <= 3) {
    strength = "fair";
  } else if (metCount === 4 || password.length < 12) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    requirements: results,
  };
}

export function getStrengthColor(strength: PasswordValidationResult["strength"]): string {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "fair":
      return "bg-orange-500";
    case "good":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
  }
}

export function getStrengthLabel(strength: PasswordValidationResult["strength"]): string {
  switch (strength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
  }
}
