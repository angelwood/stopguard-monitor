import { render } from "preact";
import { App } from "./components/App";
import cssContent from "./styles.css";

// Inject styles into the document
const styleEl = document.createElement("style");
styleEl.textContent = cssContent;
document.head.appendChild(styleEl);

render(<App />, document.getElementById("app")!);
