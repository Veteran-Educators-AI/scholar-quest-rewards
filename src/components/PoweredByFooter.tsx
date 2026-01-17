import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import nycologicLogo64Webp from "@/assets/nycologic-ai-logo-64.webp";
import nycologicLogo128Webp from "@/assets/nycologic-ai-logo-128.webp";

interface PoweredByFooterProps {
  className?: string;
}

export function PoweredByFooter({ className = "" }: PoweredByFooterProps) {
  return (
    <footer className={`py-4 px-4 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <span className="text-xs">Powered by</span>
        <a 
          href="https://thescangeniusapp.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <picture>
            <source
              type="image/webp"
              srcSet={`${nycologicLogo64Webp} 64w, ${nycologicLogo128Webp} 128w`}
              sizes="20px"
            />
            <img
              src={nycologicLogo}
              alt="NYClogic Ai"
              className="w-5 h-5 object-contain"
              width={20}
              height={20}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <span className="text-xs font-semibold text-foreground">NYClogic Ai™</span>
        </a>
      </div>
    </footer>
  );
}
