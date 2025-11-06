import React, { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await api.get('/auth/check');
      const isAuth = response.data?.authenticated === true;
      setIsAuthenticated(isAuth);
      
      if (!isAuth) {
        console.log('Usuario no autenticado, redirigiendo al login');
      }
    } catch (error: any) {
      console.error('Error al verificar autenticación:', error);
      // Si hay un error de red o el servidor no responde, asumir no autenticado
      // pero solo si no es un error 401 (que ya indica no autenticado)
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsAuthenticated(false);
      } else {
        // Para otros errores (red, etc.), intentar verificar si hay una respuesta
        const isAuth = error.response?.data?.authenticated === true;
        setIsAuthenticated(isAuth || false);
      }
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

