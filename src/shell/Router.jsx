import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@shared/components/ui/toaster";
import { AuthProvider } from "@shared/context/AuthContext";
import { CategoryProvider } from "@finance/context/CategoryContext";
import Finance from "@finance/pages/Home";
import CalendarPage from "@calendar/pages/CalendarPage";
import HomePage from "./HomePage";
import LoginPage from "@/modules/auth/pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import PageNotFound from "@shared/lib/PageNotFound";
import Layout from "./Layout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <CategoryProvider>
                  <Layout>
                    <Finance />
                  </Layout>
                </CategoryProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
