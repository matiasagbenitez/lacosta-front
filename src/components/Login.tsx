import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LoginProps {
  onLoginSuccess: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { access_code: accessCode },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500, // No lanzar error para 4xx
        }
      );

      console.log('Login response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Verificar si la respuesta fue exitosa
      if (response.status === 200 && response.data?.success) {
        toast.success('✅ Autenticación exitosa');
        onLoginSuccess();
        // Usar navigate de react-router en lugar de window.location para evitar redirects del servidor
        // Esperar un momento para asegurar que la cookie se establezca antes de redirigir
        setTimeout(() => {
          navigate('/listado', { replace: true });
        }, 300);
      } else {
        const errorMsg = response.data?.message || 'Código de acceso incorrecto';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      console.error('Response:', err.response);
      console.error('Request:', err.request);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = err.response?.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se recibió respuesta del servidor. Verifica tu conexión.';
      } else {
        // Algo pasó al configurar la petición
        errorMessage = err.message || 'Error al configurar la petición';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="mb-2">Acceso Restringido</h2>
            <p className="text-muted">Ingresa el código de acceso para continuar</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Código de Acceso</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa el código de acceso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading || !accessCode}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;

