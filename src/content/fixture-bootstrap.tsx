import "./chrome-mock";
import { genericAdapter } from "./adapters/generic";
import { WidgetApp } from "./widget/WidgetApp";
import styles from "./widget/styles.css?inline";
import { createRoot } from "react-dom/client";

const host = document.createElement("askwise-root");
const shadow = host.attachShadow({ mode: "open" });
document.body.appendChild(host);

const styleEl = document.createElement("style");
styleEl.textContent = styles;
shadow.appendChild(styleEl);

const container = document.createElement("div");
shadow.appendChild(container);

createRoot(container).render(<WidgetApp adapter={genericAdapter} enabled={true} />);
