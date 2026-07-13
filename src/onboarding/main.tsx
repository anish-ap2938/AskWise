import { createRoot } from "react-dom/client";
import { Onboarding } from "./Onboarding";
import "../options/options.css";

const root = createRoot(document.getElementById("root")!);
root.render(<Onboarding />);
