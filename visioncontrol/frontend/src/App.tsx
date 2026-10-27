import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VisionProvider } from "./context/VisionContext";
import { NavigationBar } from "./components/NavigationBar";
import { ModelerExperience } from "./experiences/modeler/ModelerExperience";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <VisionProvider>
      <BrowserRouter>
        <div className="vc-app-root">
          <NavigationBar />
          <main className="vc-main-content">
            <Routes>
              <Route path="/" element={<ModelerExperience />} />
              <Route path="/modeler" element={<ModelerExperience />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </VisionProvider>
  );
}

export default App;
