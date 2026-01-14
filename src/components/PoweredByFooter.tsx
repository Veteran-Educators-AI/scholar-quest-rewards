import nycologicLogo from "@/assets/nycologic-ai-logo.png";

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
          <img 
            src={nycologicLogo} 
            alt="NYClogic Ai" 
            className="w-5 h-5 object-contain"
          />
          <span className="text-xs font-semibold text-foreground">NYClogic <span className="text-destructive">Ai™</span></span>
        </a>
      </div>
    </footer>
  );
}
