import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import { Edit, Delete, Assessment, Close, Save, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../../css/Admin/GestionCamiones.css';
import { FormControl, InputLabel } from '@mui/material';

const GestionCamiones = () => {
  const navigate = useNavigate();
  const [camiones, setCamiones] = useState([]);
  const [conductoresDisponibles, setConductoresDisponibles] = useState([]);
  const [nuevoCamion, setNuevoCamion] = useState({ 
    placa: '', 
    ruta: '', 
    estado: 'activo', 
    conductor: '', 
    horarioInicio: '05:00',
    horarioFin: '22:00',
    diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], // Asegurarse que sea array
    imagen: '' 
  });
  const [busquedaCamiones, setBusquedaCamiones] = useState('');
  const [camionEditando, setCamionEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoEliminar, setDialogoEliminar] = useState({ open: false, tipo: '', id: '' });
  const [paginaCamiones, setPaginaCamiones] = useState(1);
  const elementosPorPagina = 5;
  const [estadisticasDialog, setEstadisticasDialog] = useState({ open: false, camion: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [camionesResponse, conductoresResponse] = await Promise.all([
        api.get('/camiones'),
        api.get('/conductores-disponibles')
      ]);
      setCamiones(camionesResponse.data);
      setConductoresDisponibles(conductoresResponse.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al cargar datos',
        severity: 'error'
      });
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const validarCamion = () => {
    const nuevosErrores = {};
    if (!nuevoCamion.placa.trim()) nuevosErrores.placa = 'La placa es requerida';
    if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(nuevoCamion.placa)) nuevosErrores.placa = 'Formato de placa no válido (ej: ABP468B)';
    if (!nuevoCamion.ruta.trim()) nuevosErrores.ruta = 'La ruta es requerida';
    if (nuevoCamion.ruta.length < 2) nuevosErrores.ruta = 'La ruta debe tener al menos 2 caracteres';
    if (!nuevoCamion.diasTrabajo || nuevoCamion.diasTrabajo.length === 0) {
      nuevosErrores.diasTrabajo = 'Debe seleccionar al menos un día de trabajo';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarCamion = async () => {
    if (!validarCamion()) return;
    try {
      const camionData = {
        placa: nuevoCamion.placa.trim().toUpperCase(),
        ruta: nuevoCamion.ruta.trim().toUpperCase(),
        estado: nuevoCamion.estado,
        conductor: nuevoCamion.conductor || null,
        horarioInicio: nuevoCamion.horarioInicio,
        horarioFin: nuevoCamion.horarioFin,
        diasTrabajo: nuevoCamion.diasTrabajo // Agregamos los días de trabajo
      };
  
      console.log('Datos a enviar:', camionData);
  
      const response = await api.post('/camiones', camionData);
      console.log('Respuesta del servidor:', response.data);
  
      setCamiones([...camiones, response.data]);
      setNuevoCamion({ 
        placa: '', 
        ruta: '', 
        estado: 'activo', 
        conductor: '',
        horarioInicio: '05:00',
        horarioFin: '22:00',
        diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], // Mantener el array
        imagen: '' 
      });
      setSnackbar({ 
        open: true, 
        message: 'Camión agregado correctamente', 
        severity: 'success' 
      });
      fetchData();
    } catch (error) {
      console.error('Error completo:', error);
      console.log('Error details:', error.response?.data);
      
      let errorMessage = 'Error al agregar camión';
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
  
      setSnackbar({ 
        open: true, 
        message: errorMessage,
        severity: 'error' 
      });
    }
  };

  const actualizarCamion = async (id, datosActualizados) => {
    // Validaciones antes de enviar al servidor
    const erroresValidacion = {};
    
    if (!datosActualizados.placa || !datosActualizados.placa.trim()) {
      erroresValidacion.placa = 'La placa es requerida';
    } else if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(datosActualizados.placa)) {
      erroresValidacion.placa = 'Formato de placa no válido (ej: ABP468B)';
    }
  
    if (!datosActualizados.ruta || !datosActualizados.ruta.trim()) {
      erroresValidacion.ruta = 'La ruta es requerida';
    } else if (datosActualizados.ruta.length < 2) {
      erroresValidacion.ruta = 'La ruta debe tener al menos 2 caracteres';
    }
  
    if (!datosActualizados.estado || !['activo', 'inactivo'].includes(datosActualizados.estado)) {
      erroresValidacion.estado = 'Estado no válido';
    }
  
    // Si hay errores, mostrar mensaje y detener la actualización
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      setSnackbar({
        open: true,
        message: 'Por favor, corrija los errores en el formulario',
        severity: 'error'
      });
      return;
    }
  
    try {
      const datosFiltrados = {
        placa: datosActualizados.placa.trim().toUpperCase(),
        ruta: datosActualizados.ruta.trim().toUpperCase(),
        estado: datosActualizados.estado,
        conductor: datosActualizados.conductor || null,
        horarioInicio: datosActualizados.horarioInicio,
        horarioFin: datosActualizados.horarioFin,
        diasTrabajo: Array.isArray(datosActualizados.diasTrabajo) ? datosActualizados.diasTrabajo : [] // Asegurar array
      };
      console.log('Datos a actualizar:', datosFiltrados);
      console.log('ID del camión:', id);
  
      const response = await api.put(`/camiones/${id}`, datosFiltrados);
      console.log('Respuesta del servidor:', response.data);
      
      setCamiones(camiones.map(camion => (camion._id === id ? response.data : camion)));
      setSnackbar({ 
        open: true, 
        message: 'Camión actualizado correctamente', 
        severity: 'success' 
      });
      setErrores({});
      fetchData();
      setCamionEditando(null);
    } catch (error) {
      console.error('Error completo:', error);
      console.log('Error details:', error.response?.data);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || error.response?.data?.error || 'Error al actualizar camión', 
        severity: 'error' 
      });
    }
  };

  const confirmarEliminacion = (id) => {
    setDialogoEliminar({ open: true, tipo: 'camion', id });
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar({ open: false, tipo: '', id: '' });
  };

const ejecutarEliminacion = async () => {
  try {
    await api.delete(`/camiones/${dialogoEliminar.id}`);
    setCamiones(camiones.filter(camion => camion._id !== dialogoEliminar.id));
    setSnackbar({
      open: true,
      message: 'Camión eliminado correctamente',
      severity: 'success'
    });
    cerrarDialogoEliminar();
    fetchData();
  } catch (error) {
    setSnackbar({
      open: true,
      message: error.response?.data?.error || 'Error al eliminar el camión',
      severity: 'error'
    });
  }
};

  const camionesFiltrados = camiones.filter(camion =>
    camion.placa.toLowerCase().includes(busquedaCamiones.toLowerCase()) ||
    camion.ruta.toLowerCase().includes(busquedaCamiones.toLowerCase()) ||
    (camion.conductor && camion.conductor.nombre.toLowerCase().includes(busquedaCamiones.toLowerCase()))
  );

  const abrirEstadisticas = (camion) => {
    setEstadisticasDialog({ open: true, camion });
  };
  
  const cerrarEstadisticas = () => {
    setEstadisticasDialog({ open: false, camion: null });
  };

  const camionesPaginados = camionesFiltrados.slice(
    (paginaCamiones - 1) * elementosPorPagina,
    paginaCamiones * elementosPorPagina
  );

  

  return (
    <Container className="admin-container">
      <Button 
        variant="contained" 
        onClick={() => navigate('/admin')} 
        className="back-button"
        style={{ marginBottom: '20px' }}
      >
        Volver al Dashboard
      </Button>
  
      <Typography variant="h4" gutterBottom>
        Gestión de Camiones
      </Typography>
  
      <Paper elevation={3} className="paper-style">
        <TextField
          label="Buscar por placa, ruta o conductor"
          variant="outlined"
          fullWidth
          value={busquedaCamiones}
          onChange={(e) => setBusquedaCamiones(e.target.value)}
          className="text-field"
        />
        <Typography variant="h6" gutterBottom className="form-section-title">
          Formulario para Agregar Nuevo Camión
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Placa"
              variant="outlined"
              fullWidth
              value={nuevoCamion.placa}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, placa: e.target.value })}
              error={!!errores.placa}
              helperText={errores.placa}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Ruta"
              variant="outlined"
              fullWidth
              value={nuevoCamion.ruta}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, ruta: e.target.value })}
              error={!!errores.ruta}
              helperText={errores.ruta}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Select
              value={nuevoCamion.estado}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, estado: e.target.value })}
              fullWidth
              variant="outlined"
              error={!!errores.estado}
              className="text-field"
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Select
              value={nuevoCamion.conductor}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, conductor: e.target.value })}
              fullWidth
              variant="outlined"
              displayEmpty
              error={!!errores.conductor}
              className="text-field"
            >
              <MenuItem value="">Selecciona un conductor</MenuItem>
              {conductoresDisponibles.map(conductor => (
                <MenuItem key={conductor._id} value={conductor._id}>
                  {conductor.nombre} - {conductor.email}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Hora inicio"
              type="time"
              variant="outlined"
              fullWidth
              value={nuevoCamion.horarioInicio}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, horarioInicio: e.target.value })}
              className="text-field"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Hora fin"
              type="time"
              variant="outlined"
              fullWidth
              value={nuevoCamion.horarioFin}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, horarioFin: e.target.value })}
              className="text-field"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Días de trabajo</InputLabel>
              <Select
                multiple
                value={nuevoCamion.diasTrabajo}
                onChange={(e) => setNuevoCamion({ ...nuevoCamion, diasTrabajo: e.target.value })}
                renderValue={(selected) => selected.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ')}
              >
                <MenuItem value="lunes">Lunes</MenuItem>
                <MenuItem value="martes">Martes</MenuItem>
                <MenuItem value="miercoles">Miércoles</MenuItem>
                <MenuItem value="jueves">Jueves</MenuItem>
                <MenuItem value="viernes">Viernes</MenuItem>
                <MenuItem value="sabado">Sábado</MenuItem>
                <MenuItem value="domingo">Domingo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button variant="contained" className="button-primary" onClick={agregarCamion} fullWidth>
              Agregar
            </Button>
          </Grid>
        </Grid>
        <List>
          {camionesPaginados.map(camion => (
            <ListItem key={camion._id} divider>
              <ListItemText
                primary={`${camion.placa} - ${camion.ruta}`}
                secondary={
                  <>
                    {`Estado: ${camion.estado} - Conductor: ${camion.conductor ? camion.conductor.nombre : 'Sin conductor'}`}
                    <br />
                    {`Horario: ${camion.horarioInicio || '05:00'} - ${camion.horarioFin || '22:00'}`}
                    <br />
                    {`Días: ${camion.diasTrabajo ? camion.diasTrabajo.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ') : 'No especificados'}`}
                  </>
                }
              />
              <IconButton className="icon-button" onClick={() => abrirEstadisticas(camion)}>
                <Assessment />
              </IconButton>
              <IconButton className="icon-button" onClick={() => setCamionEditando(camion)}>
                <Edit />
              </IconButton>
              <IconButton className="icon-button" onClick={() => confirmarEliminacion(camion._id)}>
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
        <Pagination
          count={Math.ceil(camionesFiltrados.length / elementosPorPagina)}
          page={paginaCamiones}
          onChange={(e, pagina) => setPaginaCamiones(pagina)}
          className="pagination"
        />
      </Paper>
  
      {/* Formulario de Edición de Camión */}
      {camionEditando && (
        <Paper elevation={3} className="paper-style">
          <Typography variant="h5" gutterBottom>
            Editar Camión
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Placa"
                variant="outlined"
                fullWidth
                value={camionEditando.placa}
                onChange={(e) => setCamionEditando({ ...camionEditando, placa: e.target.value })}
                error={!!errores.placa}
                helperText={errores.placa}
                className="text-field"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Ruta"
                variant="outlined"
                fullWidth
                value={camionEditando.ruta}
                onChange={(e) => setCamionEditando({ ...camionEditando, ruta: e.target.value })}
                error={!!errores.ruta}
                helperText={errores.ruta}
                className="text-field"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Select
                value={camionEditando.estado}
                onChange={(e) => setCamionEditando({ ...camionEditando, estado: e.target.value })}
                fullWidth
                variant="outlined"
                error={!!errores.estado}
                className="text-field"
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Select
                value={camionEditando.conductor || ''}
                onChange={(e) => setCamionEditando({ ...camionEditando, conductor: e.target.value })}
                fullWidth
                variant="outlined"
                displayEmpty
                error={!!errores.conductor}
                className="text-field"
              >
                <MenuItem value="">Selecciona un conductor</MenuItem>
                {conductoresDisponibles.map(conductor => (
                  <MenuItem key={conductor._id} value={conductor._id}>
                    {conductor.nombre} - {conductor.email}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Hora inicio"
                type="time"
                variant="outlined"
                fullWidth
                value={camionEditando.horarioInicio || '05:00'}
                onChange={(e) => setCamionEditando({ ...camionEditando, horarioInicio: e.target.value })}
                className="text-field"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Hora fin"
                type="time"
                variant="outlined"
                fullWidth
                value={camionEditando.horarioFin || '22:00'}
                onChange={(e) => setCamionEditando({ ...camionEditando, horarioFin: e.target.value })}
                className="text-field"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {/* Nuevo campo: Días de trabajo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Días de trabajo</InputLabel>
                <Select
                  multiple
                  value={camionEditando.diasTrabajo || []} // Asegurar que sea array
                  onChange={(e) => setCamionEditando({ 
                    ...camionEditando, 
                    diasTrabajo: Array.isArray(e.target.value) ? e.target.value : [] 
                  })}
                  renderValue={(selected) => selected.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ')}
                >
                  <MenuItem value="lunes">Lunes</MenuItem>
                  <MenuItem value="martes">Martes</MenuItem>
                  <MenuItem value="miercoles">Miércoles</MenuItem>
                  <MenuItem value="jueves">Jueves</MenuItem>
                  <MenuItem value="viernes">Viernes</MenuItem>
                  <MenuItem value="sabado">Sábado</MenuItem>
                  <MenuItem value="domingo">Domingo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button variant="contained" className="button-primary" onClick={() => actualizarCamion(camionEditando._id, camionEditando)}>
                <Save />
              </Button>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button variant="contained" className="button-secondary" onClick={() => setCamionEditando(null)}>
                <Cancel />
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
  
      {/* Diálogo de Confirmación para Eliminar */}
      <Dialog
        open={dialogoEliminar.open}
        onClose={cerrarDialogoEliminar}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar este camión?
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar}>Cancelar</Button>
          <Button onClick={ejecutarEliminacion} className="button-secondary">Eliminar</Button>
        </DialogActions>
      </Dialog>
  
      {/* Diálogo de Estadísticas */}
      <Dialog
        open={estadisticasDialog.open}
        onClose={cerrarEstadisticas}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Estadísticas del Camión
          <IconButton
            aria-label="close"
            onClick={cerrarEstadisticas}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {estadisticasDialog.camion && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">Información General</Typography>
                <Typography>Placa: {estadisticasDialog.camion.placa}</Typography>
                <Typography>Ruta: {estadisticasDialog.camion.ruta}</Typography>
                <Typography>Estado: {estadisticasDialog.camion.estado}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Horarios</Typography>
                <Typography>Inicio: {estadisticasDialog.camion.horarioInicio || '05:00'}</Typography>
                <Typography>Fin: {estadisticasDialog.camion.horarioFin || '22:00'}</Typography>
                <Typography>
                  Días de trabajo: {estadisticasDialog.camion.diasTrabajo?.map(dia => 
                    dia.charAt(0).toUpperCase() + dia.slice(1)
                  ).join(', ') || 'No especificados'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Conductor Asignado</Typography>
                <Typography>
                  {estadisticasDialog.camion.conductor ? 
                    `${estadisticasDialog.camion.conductor.nombre} - ${estadisticasDialog.camion.conductor.email}` : 
                    'Sin conductor asignado'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionCamiones;
