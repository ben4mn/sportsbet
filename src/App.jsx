import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ParlayProvider } from './context/ParlayContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Builder from './pages/Builder';
import Suggestions from './pages/Suggestions';
import Research from './pages/Research';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Disclaimer from './components/Layout/Disclaimer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ParlayProvider>
          <Disclaimer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="builder" element={
                <ProtectedRoute>
                  <Builder />
                </ProtectedRoute>
              } />
              <Route path="suggestions" element={
                <ProtectedRoute>
                  <Suggestions />
                </ProtectedRoute>
              } />
              <Route path="research" element={
                <ProtectedRoute>
                  <Research />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ParlayProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
