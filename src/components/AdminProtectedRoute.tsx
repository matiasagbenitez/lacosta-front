import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  adminPassword: string; // Contraseña en texto plano
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  adminPassword,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si hay una contraseña en los query params
    const params = new URLSearchParams(location.search);
    const passParam = params.get('admin_pass');

    if (passParam && passParam === adminPassword) {
      // Contraseña correcta en la URL
      setIsAuthorized(true);
      // Guardar en sessionStorage para esta sesión
      sessionStorage.setItem('admin_authorized', 'true');
    } else {
      // Verificar si está autorizado en sessionStorage
      const storedAuth = sessionStorage.getItem('admin_authorized');
      if (storedAuth === 'true') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    }
  }, [location.search, adminPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inputPassword === adminPassword) {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_authorized', 'true');
      toast.success('✅ Acceso autorizado');
      // Limpiar la URL de los parámetros si existen
      navigate('/', { replace: true });
    } else {
      setError('Contraseña incorrecta');
      toast.error('Contraseña incorrecta');
      // Redirigir a listado después de 1 segundo
      setTimeout(() => {
        navigate('/listado');
      }, 1000);
    }
  };

  // Mostrar formulario de contraseña si no está autorizado
  if (isAuthorized === false) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
      >
        <Card style={{ width: '100%', maxWidth: '400px' }}>
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="img-fluid mb-3"
                style={{ width: '120px' }}
              />
              <h2 className="mb-2">Acceso de Administración</h2>
              <p className="text-muted">Ingresa la contraseña de administrador</p>
            </div>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña de Administrador</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  required
                  autoFocus
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100">
                Ingresar
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Mostrar loading mientras verifica
  if (isAuthorized === null) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Verificando acceso...</p>
        </div>
      </Container>
    );
  }

  // Mostrar contenido protegido
  return <>{children}</>;
};

export default AdminProtectedRoute;

