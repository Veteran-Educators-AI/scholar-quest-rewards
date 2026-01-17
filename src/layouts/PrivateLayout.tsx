import { Outlet } from "react-router-dom";
import { StudyTimerProvider } from "@/contexts/StudyTimerContext";
import { LanguageProvider } from "@/i18n/LanguageContext";

const PrivateLayout = () => (
  <StudyTimerProvider>
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  </StudyTimerProvider>
);

export default PrivateLayout;
