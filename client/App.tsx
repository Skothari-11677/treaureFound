import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SubmissionForm from "./components/SubmissionForm";
import AdminPanel from "./components/AdminPanel";
import TestSupabase from "./pages/TestSupabase";
import Victory from "./pages/Victory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--terminal-green))",
            border: "1px solid hsl(var(--terminal-green))",
            fontFamily: "Fira Code, monospace",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SubmissionForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/victory" element={<Victory />} />
          <Route path="/test" element={<TestSupabase />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const container = document.getElementById("root")!;

// Check if root already exists to prevent createRoot warning
if (!container._reactRootContainer) {
  const root = createRoot(container);
  root.render(<App />);
  container._reactRootContainer = root;
} else {
  // If root already exists, just re-render
  container._reactRootContainer.render(<App />);
}
