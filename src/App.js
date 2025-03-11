import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import Login from './components/Login/Login';
import Pasajero from './components/Pasajero/DashboardPasajero';
import Conductor from './components/Conductor/DashboardConductor';
import AdminDashboard from './components/Admin/AdminDashboard';
import GestionUsuarios from './components/Admin/GestionUsuarios';
import GestionCamiones from './components/Admin/GestionCamiones';
import './App.css';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = Cookies.get('token');
  const userInfo = Cookies.get('userInfo');

  if (!token || !userInfo) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userInfo);
  if (allowedRole && user.rol !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Rutas del Administrador */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRole="admin">
              <GestionUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/camiones"
          element={
            <ProtectedRoute allowedRole="admin">
              <GestionCamiones />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Conductor y Pasajero */}
        <Route
          path="/conductor"
          element={
            <ProtectedRoute allowedRole="conductor">
              <Conductor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pasajero"
          element={
            <ProtectedRoute allowedRole="pasajero">
              <Pasajero />
            </ProtectedRoute>
          }
          />
        {/* Ruta para manejar páginas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;