import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import Feedback from "./pages/Feedback";
import Admin from "./pages/Admin";
import AdminKyc from "./pages/AdminKyc"; // ✅ NEW
import NotFound from "./pages/NotFound";
import Notifications from "./components/notifications";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Router>
          <Notifications />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/results" element={<Results />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={<Admin />} />

            {/* ✅ Admin KYC Route */}
            <Route path="/admin/kyc" element={<AdminKyc />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;