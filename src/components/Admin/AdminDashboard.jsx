import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Button } from '@mui/material';
import { PeopleAlt, DirectionsBus, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '..//../css/Admin/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Administrador');

  useEffect(() => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      setAdminName(parsedInfo.nombre || 'Administrador');
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('token', { secure: true, sameSite: 'strict' });
    Cookies.remove('userInfo', { secure: true, sameSite: 'strict' });
    navigate('/');
  };

  return (
    <Container className="admin-dashboard">
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleLogout}
        startIcon={<Logout />}
        className="logout-button"
      >
        Cerrar Sesión
      </Button>  
      <Typography variant="h3" gutterBottom className="welcome-title">
        Bienvenid@ {adminName}
      </Typography>
      <Typography variant="h5" gutterBottom className="dashboard-subtitle">
        Seleccione una opción para gestionar
      </Typography>

      <Grid container spacing={4} className="dashboard-options">
        <Grid item xs={12} md={6}>
          <Paper 
            className="dashboard-option" 
            onClick={() => navigate('/admin/usuarios')}
          >
            <PeopleAlt className="dashboard-icon" />
            <Typography variant="h4">Gestión de Usuarios</Typography>
            <Typography variant="body1">
              Administre usuarios, conductores y pasajeros
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            className="dashboard-option" 
            onClick={() => navigate('/admin/camiones')}
          >
            <DirectionsBus className="dashboard-icon" />
            <Typography variant="h4">Gestión de Camiones</Typography>
            <Typography variant="body1">
              Administre la flota de camiones y rutas
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;