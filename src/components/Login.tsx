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
        }
      );

      if (response.data.success) {
        toast.success('✅ Autenticación exitosa');
        onLoginSuccess();
        // Redirigir directamente al listado después del login
        setTimeout(() => {
          navigate('/listado', { replace: true });
        }, 500);
      } else {
        setError('Código de acceso incorrecto');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión';
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

