import React, { useState } from 'react';
import api from '../../services/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../../css/Login/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', credentials);
      const data = response.data;

      if (!data.token || !data.usuario) {
        setError('Respuesta del servidor inválida');
        return;
      }

      // Store in secure cookies
      Cookies.set('token', data.token, {
        secure: true,
        sameSite: 'strict',
        expires: 1
      });

      Cookies.set('userInfo', JSON.stringify({
        id: data.usuario._id,
        nombre: data.usuario.nombre,
        rol: data.usuario.rol
      }), {
        secure: true,
        sameSite: 'strict',
        expires: 1
      });

      // Redirect based on role
      const userRole = data.usuario.rol;
      navigate(`/${userRole}`);

    } catch (error) {
      setError(error.response?.data?.error || 'Error de conexión');
      console.error('Error:', error);
    }
  };

  return (
    <Container component="main" maxWidth="xs" className="login-container">
      <Paper elevation={3} className="login-paper">
        <Box className="login-box">
          <LoginIcon className="login-icon" />
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          
          {error && (
            <Alert severity="error" className="login-alert">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="login-form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              error={!!error}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              error={!!error}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="login-button"
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;