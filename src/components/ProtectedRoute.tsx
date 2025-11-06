import React, { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/check`, {
        withCredentials: true,
      });
      const isAuth = response.data.authenticated === true;
      setIsAuthenticated(isAuth);
      
      if (!isAuth) {
        console.log('Usuario no autenticado, redirigiendo al login');
      }
    } catch (error: any) {
      console.error('Error al verificar autenticación:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Verificando autenticación...</p>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    navigate('/login', { replace: true });
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

