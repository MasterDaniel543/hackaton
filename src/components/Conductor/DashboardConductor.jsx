import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { DirectionsBus, Warning, LocationOn, Error, Logout } from '@mui/icons-material';
import api from '../../services/api';

const DashboardConductor = () => {
  const navigate = useNavigate();
  const [conductor, setConductor] = useState(null);
  const [camionAsignado, setCamionAsignado] = useState(null);
  const [openIncidencia, setOpenIncidencia] = useState(false);
  const [incidencia, setIncidencia] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [ubicacion, setUbicacion] = useState({ lat: '', lng: '' });
  const [incidenciasPendientes, setIncidenciasPendientes] = useState([]);

  useEffect(() => {
    cargarDatosConductor();
    cargarIncidenciasPendientes();

    // Actualización cada 2 minutos en lugar de 30 segundos
    const locationInterval = setInterval(() => {
      if (camionAsignado && document.visibilityState === 'visible') {
        actualizarUbicacion(false);
      }
    }, 120000); // 2 minutos

    // Agregar listener para el estado de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && camionAsignado) {
        actualizarUbicacion(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup al desmontar el componente
    return () => {
      clearInterval(locationInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [camionAsignado]);

  // Update actualizarUbicacion to handle silent updates
  const actualizarUbicacion = async (showNotification = true) => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const nuevaUbicacion = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          await api.put('/conductor/ubicacion', {
            ubicacion: nuevaUbicacion,
            camionId: camionAsignado._id
          });
          setUbicacion(nuevaUbicacion);
          
          // Only show notification if explicitly requested
          if (showNotification) {
            setSnackbar({
              open: true,
              message: 'Ubicación actualizada correctamente',
              severity: 'success'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      if (showNotification) {
        setSnackbar({
          open: true,
          message: 'Error al actualizar la ubicación',
          severity: 'error'
        });
      }
    }
  };
  const cargarIncidenciasPendientes = async () => {
    try {
      const response = await api.get('/conductor/incidencias-pendientes');
      setIncidenciasPendientes(response.data);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token', { secure: true, sameSite: 'strict' });
    Cookies.remove('userInfo', { secure: true, sameSite: 'strict' });
    navigate('/');
  };

  const cargarDatosConductor = async () => {
    try {
      const conductorResponse = await api.get('/conductor/info');
      
      if (!conductorResponse.data.usuario || conductorResponse.data.usuario.rol !== 'conductor') {
        setSnackbar({
          open: true,
          message: 'No tienes permisos de conductor',
          severity: 'error'
        });
        return;
      }

      setConductor(conductorResponse.data.usuario);
      setCamionAsignado(conductorResponse.data.camionAsignado);
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al cargar los datos',
        severity: 'error'
      });
    }
  };

  const reportarIncidencia = async () => {
    try {
      await api.post('/conductor/incidencias', {
        descripcion: incidencia,
        camionId: camionAsignado._id
      });
      setSnackbar({
        open: true,
        message: 'Incidencia reportada correctamente',
        severity: 'success'
      });
      setOpenIncidencia(false);
      setIncidencia('');
      cargarIncidenciasPendientes();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al reportar la incidencia',
        severity: 'error'
      });
    }
  };

  return (
    <Container>
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleLogout}
        startIcon={<Logout />}
        sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20 
        }}
      >
        Cerrar Sesión
      </Button>

      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Dashboard del Conductor
      </Typography>

      {incidenciasPendientes.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<Error />}
          sx={{ mb: 2 }}
        >
          Tienes {incidenciasPendientes.length} incidencia(s) pendiente(s) de resolución
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información del Camión */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DirectionsBus sx={{ mr: 1 }} />
                Información del Camión Asignado
              </Typography>
              {camionAsignado ? (
                <List>
                  <ListItem>
                    <ListItemText primary="Placa" secondary={camionAsignado.placa} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Ruta" secondary={camionAsignado.ruta} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Horario" 
                      secondary={`${camionAsignado.horarioInicio} - ${camionAsignado.horarioFin}`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Días de trabajo" 
                      secondary={camionAsignado.diasTrabajo?.join(', ')} 
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography>No hay camión asignado</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Acciones del Conductor */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Warning />}
                  onClick={() => setOpenIncidencia(true)}
                  fullWidth
                >
                  Reportar Incidencia
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<LocationOn />}
                  onClick={actualizarUbicacion}
                  fullWidth
                >
                  Actualizar Ubicación
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Lista de Incidencias Pendientes */}
        <Grid item xs={12}>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                Incidencias Pendientes
              </Typography>
              {incidenciasPendientes.length > 0 ? (
                <List>
                  {incidenciasPendientes.map((incidencia, index) => (
                    <React.Fragment key={incidencia._id}>
                      <ListItem>
                        <ListItemText
                          primary={incidencia.descripcion}
                          secondary={`Reportada el: ${new Date(incidencia.fecha).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {index < incidenciasPendientes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No hay incidencias pendientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para reportar incidencia */}
      <Dialog open={openIncidencia} onClose={() => setOpenIncidencia(false)}>
        <DialogTitle>Reportar Incidencia</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descripción de la incidencia"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={incidencia}
            onChange={(e) => setIncidencia(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIncidencia(false)}>Cancelar</Button>
          <Button onClick={reportarIncidencia} variant="contained" color="primary">
            Reportar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DashboardConductor;