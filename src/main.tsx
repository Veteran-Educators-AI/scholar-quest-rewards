import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registers a service worker (generated at build time) to cache static assets and images.
// This improves repeat load performance and resilience on flaky connections.
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
