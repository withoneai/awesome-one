import { useTheme } from "./hooks/useTheme";
import { ControlledLinkCard } from "./controlled-components/controlled-link-card";
import "./index.css";

function App() {
  const { isDark, toggle } = useTheme();

  return <ControlledLinkCard isDark={isDark} onToggleTheme={toggle} />;
}

export default App;
