import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, List, ListItem, 
  ListItemText, Divider, Button, TextField, Dialog, DialogContent,
  AppBar, Toolbar, Box
} from '@mui/material';
import { DirectionsBus, LocationOn, Search, Logout } from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DashboardPasajero = () => {
  const [camiones, setCamiones] = useState([]);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [openMap, setOpenMap] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCamiones();
    // Actualizar ubicaciones cada 2 minutos
    const interval = setInterval(cargarCamiones, 120000);
    return () => clearInterval(interval);
  }, []);

  const cargarCamiones = async () => {
    try {
      const response = await api.get('/camiones');
      const camionesActivos = response.data
        .filter(camion => camion.estado === 'activo' && camion.ubicacion)
        .map(camion => ({
          ...camion,
          ubicacion: camion.ubicacion ? {
            ...camion.ubicacion,
            lat: Number(camion.ubicacion.lat),
            lng: Number(camion.ubicacion.lng)
          } : null
        }));
      setCamiones(camionesActivos);
    } catch (error) {
      console.error('Error al cargar camiones:', error);
      setError('Error al cargar la información de los camiones');
    }
  };

  const camionesFiltrados = camiones.filter(camion => 
    camion.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
    camion.ruta.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleOpenMap = (camion) => {
    setSelectedCamion(camion);
    setOpenMap(true);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };


  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Rutas Disponibles
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por placa o ruta..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {camionesFiltrados.map((camion) => (
          <Grid item xs={12} md={6} key={camion._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DirectionsBus sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ruta: {camion.ruta}
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Placa" 
                      secondary={camion.placa} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Horario" 
                      secondary={`${camion.horarioInicio} - ${camion.horarioFin}`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Última ubicación" 
                      secondary={
                        camion.ubicacion ? 
                        `Lat: ${Number(camion.ubicacion.lat).toFixed(6)}, Lng: ${Number(camion.ubicacion.lng).toFixed(6)}` :
                        'No disponible'
                      }
                    />
                    {camion.ubicacion && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<LocationOn />}
                        onClick={() => handleOpenMap(camion)}
                        sx={{ mt: 2 }}
                      >
                        Ver en Mapa
                      </Button>
                    )}
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Última actualización" 
                      secondary={
                        camion.ubicacion?.ultimaActualizacion ? 
                        new Date(camion.ubicacion.ultimaActualizacion).toLocaleString() :
                        'No disponible'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openMap}
        onClose={() => setOpenMap(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedCamion && (
            <LoadScript googleMapsApiKey="AIzaSyCSQgD0WIKsinTPjJCagpvZ2SnQrHOdz1o">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{
                  lat: selectedCamion.ubicacion.lat,
                  lng: selectedCamion.ubicacion.lng
                }}
                zoom={15}
              >
                <Marker
                  position={{
                    lat: selectedCamion.ubicacion.lat,
                    lng: selectedCamion.ubicacion.lng
                  }}
                  title={`${selectedCamion.placa} - ${selectedCamion.ruta}`}
                />
              </GoogleMap>
            </LoadScript>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DashboardPasajero;