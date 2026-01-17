import { forwardRef } from "react";
import highschoolLogo from "@/assets/highschool-logo.png";
import highschoolLogo96Webp from "@/assets/highschool-logo-96.webp";
import highschoolLogo144Webp from "@/assets/highschool-logo-144.webp";
import highschoolLogo192Webp from "@/assets/highschool-logo-192.webp";
import highschoolLogo288Webp from "@/assets/highschool-logo-288.webp";

interface ScholarBuddyProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  animate?: boolean;
  className?: string;
}

export const ScholarBuddy = forwardRef<HTMLDivElement, ScholarBuddyProps>(({ 
  size = "md", 
  message, 
  className = ""
}, ref) => {
  const sizeClasses = {
    sm: "w-[90px] h-[90px]",
    md: "w-[134px] h-[134px]",
    lg: "w-[180px] h-[180px]",
    xl: "w-[270px] h-[270px]",
  };

  return (
    <div ref={ref} className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <picture>
          <source
            type="image/webp"
            srcSet={`${highschoolLogo96Webp} 96w, ${highschoolLogo144Webp} 144w, ${highschoolLogo192Webp} 192w, ${highschoolLogo288Webp} 288w`}
            sizes="(max-width: 640px) 180px, 270px"
          />
          <img
            src={highschoolLogo}
            alt="NYClogic Logo"
            className="w-full h-full object-contain drop-shadow-2xl"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
      
      {message && (
        <div className="bg-card rounded-xl px-5 py-3 shadow-lg border border-border max-w-sm text-center backdrop-blur-sm">
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
      )}
    </div>
  );
});

ScholarBuddy.displayName = "ScholarBuddy";
