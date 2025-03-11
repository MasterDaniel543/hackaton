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
import { Delete, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../../css/Admin/GestionUsuarios.css';

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password: '', rol: '' });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [errores, setErrores] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoEliminar, setDialogoEliminar] = useState({ open: false, tipo: '', id: '' });
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const elementosPorPagina = 5;
  const [filtroRol, setFiltroRol] = useState('todos');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cargar usuarios',
        severity: 'error'
      });
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const validarUsuario = (usuario) => {
    const nuevosErrores = {};
    if (!usuario.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!usuario.email.trim()) nuevosErrores.email = 'El correo es requerido';
    if (!/\S+@\S+\.\S+/.test(usuario.email)) nuevosErrores.email = 'Correo no válido';
    if (!usuario.password?.trim() && !usuarioEditando) nuevosErrores.password = 'La contraseña es requerida';
    if (usuario.password && usuario.password.length < 6) nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!usuario.rol) nuevosErrores.rol = 'Selecciona un rol';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarUsuario = async () => {
    if (!validarUsuario(nuevoUsuario)) return;
    try {
      const response = await api.post('/usuarios', nuevoUsuario);
      setUsuarios([...usuarios, response.data]);
      setNuevoUsuario({ nombre: '', email: '', password: '', rol: '' });
      setSnackbar({ open: true, message: 'Usuario agregado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al agregar usuario', 
        severity: 'error' 
      });
    }
  };

  const actualizarUsuario = async (id, datosActualizados) => {
    if (!validarUsuario(datosActualizados)) return;
    try {
      const response = await api.put(`/usuarios/${id}`, datosActualizados);
      setUsuarios(usuarios.map(usuario => 
        usuario._id === id ? response.data : usuario
      ));
      setUsuarioEditando(null);
      setSnackbar({ 
        open: true, 
        message: 'Usuario actualizado correctamente', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al actualizar usuario', 
        severity: 'error' 
      });
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(usuario => usuario._id !== id));
      setSnackbar({ open: true, message: 'Usuario eliminado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al eliminar usuario', 
        severity: 'error' 
      });
    }
  };

  const confirmarEliminacion = (id) => {
    setDialogoEliminar({ open: true, tipo: 'usuario', id });
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar({ open: false, tipo: '', id: '' });
  };

  const ejecutarEliminacion = () => {
    eliminarUsuario(dialogoEliminar.id);
    cerrarDialogoEliminar();
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    (filtroRol === 'todos' || usuario.rol === filtroRol) &&
    (usuario.nombre.toLowerCase().includes(busquedaUsuarios.toLowerCase()) ||
     usuario.email.toLowerCase().includes(busquedaUsuarios.toLowerCase()))
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuarios - 1) * elementosPorPagina,
    paginaUsuarios * elementosPorPagina
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
        Gestión de Usuarios
      </Typography>

      <Paper elevation={3} className="paper-style">
            <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={9}>
            <TextField
              label="Buscar por nombre o correo"
              variant="outlined"
              fullWidth
              value={busquedaUsuarios}
              onChange={(e) => setBusquedaUsuarios(e.target.value)}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              fullWidth
              variant="outlined"
              className="text-field"
            >
              <MenuItem value="todos">Filtrar Por Roles</MenuItem>
              <MenuItem value="pasajero">Pasajeros</MenuItem>
              <MenuItem value="conductor">Conductores</MenuItem>
              <MenuItem value="admin">Administradores</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Typography variant="h6" gutterBottom className="form-section-title">
          Formulario para Agregar Nuevo Usuario
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Nombre"
              variant="outlined"
              fullWidth
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
              error={!!errores.nombre}
              helperText={errores.nombre}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Correo Electrónico"
              variant="outlined"
              fullWidth
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
              error={!!errores.email}
              helperText={errores.email}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              fullWidth
              value={nuevoUsuario.password}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
              error={!!errores.password}
              helperText={errores.password}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Select
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
              fullWidth
              variant="outlined"
              displayEmpty
              error={!!errores.rol}
              className="text-field"
            >
              <MenuItem value="">Selecciona un rol</MenuItem>
              <MenuItem value="pasajero">Pasajero</MenuItem>
              <MenuItem value="conductor">Conductor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button 
              variant="contained" 
              className="button-primary" 
              onClick={agregarUsuario} 
              fullWidth
            >
              Agregar
            </Button>
          </Grid>
        </Grid>
        <List>
          {usuariosPaginados.map(usuario => (
            <ListItem key={usuario._id} divider>
              {usuarioEditando?._id === usuario._id ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      value={usuarioEditando.nombre}
                      onChange={(e) => setUsuarioEditando({
                        ...usuarioEditando,
                        nombre: e.target.value
                      })}
                      placeholder="Nombre"
                      error={!!errores.nombre}
                      helperText={errores.nombre}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      value={usuarioEditando.email}
                      onChange={(e) => setUsuarioEditando({
                        ...usuarioEditando,
                        email: e.target.value
                      })}
                      placeholder="Email"
                      error={!!errores.email}
                      helperText={errores.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="password"
                      value={usuarioEditando.password || ''}
                      onChange={(e) => setUsuarioEditando({
                        ...usuarioEditando,
                        password: e.target.value
                      })}
                      placeholder="Nueva contraseña (opcional)"
                      error={!!errores.password}
                      helperText={errores.password}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Select
                      fullWidth
                      value={usuarioEditando.rol}
                      onChange={(e) => setUsuarioEditando({
                        ...usuarioEditando,
                        rol: e.target.value
                      })}
                      error={!!errores.rol}
                    >
                      <MenuItem value="pasajero">Pasajero</MenuItem>
                      <MenuItem value="conductor">Conductor</MenuItem>
                      <MenuItem value="admin">Administrador</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      onClick={() => actualizarUsuario(usuario._id, usuarioEditando)}
                      variant="contained"
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={() => {
                        setUsuarioEditando(null);
                        setErrores({});
                      }}
                      variant="outlined"
                    >
                      Cancelar
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <>
                  <ListItemText
                    primary={usuario.nombre}
                    secondary={`${usuario.email} - ${usuario.rol}`}
                  />
                  <IconButton 
                    onClick={() => setUsuarioEditando({ ...usuario })}
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    onClick={() => confirmarEliminacion(usuario._id)}
                  >
                    <Delete />
                  </IconButton>
                </>
              )}
            </ListItem>
          ))}
        </List>
        <Pagination
          count={Math.ceil(usuariosFiltrados.length / elementosPorPagina)}
          page={paginaUsuarios}
          onChange={(e, pagina) => setPaginaUsuarios(pagina)}
          className="pagination"
        />
      </Paper>

      <Dialog
        open={dialogoEliminar.open}
        onClose={cerrarDialogoEliminar}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar este usuario?
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar}>Cancelar</Button>
          <Button onClick={ejecutarEliminacion} className="button-secondary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionUsuarios;