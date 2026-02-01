import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import FlightsManagement from "@/pages/admin/FlightsManagement";
import PassengersManagement from "@/pages/admin/PassengersManagement";
import StaffManagement from "@/pages/admin/StaffManagement";
import AirlineStaffDashboard from "@/pages/airline-staff/AirlineStaffDashboard";
import CheckIn from "@/pages/airline-staff/CheckIn";
import BagsManagement from "@/pages/airline-staff/BagsManagement";
import MyFlights from "@/pages/airline-staff/MyFlights";
import AirlineStaffMessages from "@/pages/airline-staff/Messages";
import GateStaffDashboard from "@/pages/gate-staff/GateStaffDashboard";
import Boarding from "@/pages/gate-staff/Boarding";
import GateStaffFlights from "@/pages/gate-staff/GateStaffFlights";
import GateStaffMessages from "@/pages/gate-staff/Messages";
import GroundStaffDashboard from "@/pages/ground-staff/GroundStaffDashboard";
import SecurityClearance from "@/pages/ground-staff/SecurityClearance";
import LoadBags from "@/pages/ground-staff/LoadBags";
import AllBags from "@/pages/ground-staff/AllBags";
import GroundStaffMessages from "@/pages/ground-staff/Messages";
import PassengerDashboard from "@/pages/passenger/PassengerDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="flights" replace />} />
                <Route path="flights" element={<FlightsManagement />} />
                <Route path="passengers" element={<PassengersManagement />} />
                <Route path="staff" element={<StaffManagement />} />
              </Route>

              {/* Airline Staff Routes */}
              <Route path="/airline-staff" element={<ProtectedRoute allowedRoles={['airline_staff']}><AirlineStaffDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="check-in" replace />} />
                <Route path="check-in" element={<CheckIn />} />
                <Route path="bags" element={<BagsManagement />} />
                <Route path="flights" element={<MyFlights />} />
                <Route path="messages" element={<AirlineStaffMessages />} />
              </Route>

              {/* Gate Staff Routes */}
              <Route path="/gate-staff" element={<ProtectedRoute allowedRoles={['gate_staff']}><GateStaffDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="boarding" replace />} />
                <Route path="boarding" element={<Boarding />} />
                <Route path="flights" element={<GateStaffFlights />} />
                <Route path="messages" element={<GateStaffMessages />} />
              </Route>

              {/* Ground Staff Routes */}
              <Route path="/ground-staff" element={<ProtectedRoute allowedRoles={['ground_staff']}><GroundStaffDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="security" replace />} />
                <Route path="security" element={<SecurityClearance />} />
                <Route path="loading" element={<LoadBags />} />
                <Route path="bags" element={<AllBags />} />
                <Route path="messages" element={<GroundStaffMessages />} />
              </Route>

              {/* Passenger Routes */}
              <Route path="/passenger" element={<ProtectedRoute allowedRoles={['passenger']}><PassengerDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
