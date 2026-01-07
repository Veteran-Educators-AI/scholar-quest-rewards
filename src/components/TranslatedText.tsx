import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  children: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Component for translating dynamic content using AI
export function TranslatedText({ children, className, as: Component = 'span' }: TranslatedTextProps) {
  const { language, translateDynamic } = useLanguage();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(children);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    translateDynamic(children).then(result => {
      if (!cancelled) {
        setTranslatedText(result);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [children, language, translateDynamic]);

  if (isLoading) {
    return (
      <Component className={className}>
        {children}
        <Loader2 className="inline-block ml-1 h-3 w-3 animate-spin opacity-50" />
      </Component>
    );
  }

  return <Component className={className}>{translatedText}</Component>;
}
