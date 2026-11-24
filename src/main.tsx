import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/literata/latin-400.css";
import "@fontsource/literata/latin-400-italic.css";
import "@fontsource/literata/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "katex/dist/katex.min.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/pensum.css";
import "./styles/oppgaver.css";
import "./styles/eksamen.css";
import "./styles/figurer.css";
import "./styles/kode.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
