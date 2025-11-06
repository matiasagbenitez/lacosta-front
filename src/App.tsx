import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Login from "./components/Login";
import ProductListing from "./components/ProductListing";
import ProductManagement from "./components/ProductManagement";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";

// Contraseña de administrador (en texto plano como solicita el usuario)
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Ruta de login pública */}
        <Route path="/login" element={<Login onLoginSuccess={() => {}} />} />

        {/* Ruta de administración protegida con contraseña adicional */}
        <Route
          path="/"
          element={
            <AdminProtectedRoute adminPassword={ADMIN_PASSWORD}>
              <ProtectedRoute>
                <ProductManagement />
              </ProtectedRoute>
            </AdminProtectedRoute>
          }
        />

        {/* Ruta de listado protegida solo con access code */}
        <Route
          path="/listado"
          element={
            <ProtectedRoute>
              <ProductListing />
            </ProtectedRoute>
          }
        />

        {/* Redirigir rutas no encontradas al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4aed88",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ff4b4b",
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
};

export default App;
