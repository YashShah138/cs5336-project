import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ensureFavicon } from "@/lib/ensureFavicon";

ensureFavicon("/app-favicon.ico?v=2");

createRoot(document.getElementById("root")).render(<App />);
