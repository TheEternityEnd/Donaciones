
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  // @ts-ignore: allow CSS side-effect import without type declarations
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  