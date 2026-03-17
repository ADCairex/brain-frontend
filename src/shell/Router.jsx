import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@shared/components/ui/toaster';
import { AuthProvider } from '@shared/context/AuthContext';
import Finance from '@finance/pages/Home';
import HomePage from './HomePage';
import LoginPage from '@/modules/auth/pages/Login';
import ProtectedRoute from './ProtectedRoute';
import PageNotFound from '@shared/lib/PageNotFound';
import Layout from './Layout';

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
                <Layout><HomePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Layout><Finance /></Layout>
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
