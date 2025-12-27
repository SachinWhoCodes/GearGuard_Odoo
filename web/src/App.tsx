import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { EquipmentListPage } from "@/pages/EquipmentListPage";
import { EquipmentDetailPage } from "@/pages/EquipmentDetailPage";
import { EquipmentFormPage } from "@/pages/EquipmentFormPage";
import { TeamsPage } from "@/pages/TeamsPage";
import { RequestsPage } from "@/pages/RequestsPage";
import { RequestFormPage } from "@/pages/RequestFormPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { ReportsPage } from "@/pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/equipment" element={<EquipmentListPage />} />
                <Route path="/equipment/new" element={<EquipmentFormPage />} />
                <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
                <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/requests/new" element={<RequestFormPage />} />
                <Route path="/requests/:id/edit" element={<RequestFormPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;