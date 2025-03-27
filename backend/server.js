// Importar dependencias
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const path = require('path');


// Importaciones de Seguridad
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const { AppError, handleError } = require('./utils/errorHandler');
const helmet = require('helmet');

// Importar modelos
const Usuario = require('./models/Usuario');
const Camion = require('./models/Camion');
const Incidencia = require('./models/Incidencia');

// Configuración
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'xK9#mP2$vL5*nQ8@jR3&hT6%wY4^cF7';

// Middleware de seguridad helmet
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "*.googleapis.com", "*.gstatic.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "*.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "*.googleapis.com", "*.gstatic.com"],
    connectSrc: ["'self'", "*.googleapis.com"],
    fontSrc: ["'self'", "*.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "*.google.com"]
  }
}));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(helmet.crossOriginOpenerPolicy({ policy: "same-origin" }));

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validaciones para usuarios
const userValidations = [
  body('nombre').trim().notEmpty().escape()
    .withMessage('El nombre es requerido'),
  body('email').trim().isEmail().normalizeEmail()
    .withMessage('Email no válido'),
  body('password').isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(['pasajero', 'conductor', 'admin'])
    .withMessage('Rol no válido'),
  body('ubicacion').optional().trim().escape(),
  body('ruta').optional().trim().escape()
];

// Validaciones para camiones
const truckValidations = [
  // ... validaciones existentes ...
  body('horarioInicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inicio no válido (HH:mm)'),
  body('horarioFin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora fin no válido (HH:mm)'),
  body('diasTrabajo').isArray()
    .withMessage('Los días de trabajo deben ser un array')
    .custom(dias => {
      const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      return dias.every(dia => diasValidos.includes(dia));
    })
    .withMessage('Días de trabajo no válidos')
];

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

app.use('/uploads', express.static('uploads'));

// Rutas públicas
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const isValidPassword = await bcrypt.compare(password, usuario.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const usuarioSinPassword = usuario.toObject();
    delete usuarioSinPassword.password;
    res.json({
      usuario: usuarioSinPassword,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas protegidas - Usuarios
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', authenticateToken, userValidations, validateRequest, async (req, res, next) =>  {
  const { nombre, email, password, rol, ubicacion, ruta } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Correo no válido' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!['pasajero', 'conductor', 'admin'].includes(rol)) {
    return res.status(400).json({ error: 'Rol no válido' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      rol,
      ubicacion,
      ruta
    });
    await nuevoUsuario.save();

    const usuarioSinPassword = nuevoUsuario.toObject();
    delete usuarioSinPassword.password;
    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    next(new AppError(error.message, 400));
  }
});

app.put('/api/usuarios/:id', authenticateToken, [
  param('id').isMongoId().withMessage('ID no válido'),
  ...userValidations
], validateRequest, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, rol, ubicacion, ruta } = req.body;

  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: 'Nombre, email y rol son requeridos' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Correo no válido' });
  }
  if (!['pasajero', 'conductor', 'admin'].includes(rol)) {
    return res.status(400).json({ error: 'Rol no válido' });
  }

  try {
    let datosActualizados = { nombre, email, rol, ubicacion, ruta };
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      const salt = await bcrypt.genSalt(10);
      datosActualizados.password = await bcrypt.hash(password, salt);
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true }
    ).select('-password');

    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarioActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas protegidas - Camiones
app.get('/api/camiones', authenticateToken, async (req, res) => {
  try {
    const camiones = await Camion.find().populate('conductor', 'nombre email');
    res.json(camiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/camiones', authenticateToken, truckValidations, validateRequest, async (req, res) => {
  const { placa, ruta, estado, conductor, horarioInicio, horarioFin, diasTrabajo } = req.body;

  if (!placa || !ruta || !estado || !horarioInicio || !horarioFin || !diasTrabajo) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(placa)) {
    return res.status(400).json({ error: 'Formato de placa no válido (ej: ABP468B)' });
  }
  if (!ruta.trim()) {
    return res.status(400).json({ error: 'La ruta es requerida' });
  }
  if (!['activo', 'inactivo'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    const nuevoCamion = new Camion({ 
      placa, 
      ruta, 
      estado, 
      conductor,
      horarioInicio,
      horarioFin,
      diasTrabajo 
    });
    await nuevoCamion.save();
    const camionPopulado = await Camion.findById(nuevoCamion._id).populate('conductor', 'nombre email');
    res.status(201).json(camionPopulado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/camiones/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { placa, ruta, estado, conductor, horarioInicio, horarioFin, diasTrabajo } = req.body;

  try {
    // Validate required fields
    if (!placa || !ruta || !estado) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validate plate format
    if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(placa)) {
      return res.status(400).json({ error: 'Formato de placa no válido (ej: ABP468B)' });
    }

    // Validate route
    if (!ruta.trim()) {
      return res.status(400).json({ error: 'La ruta es requerida' });
    }

    // Validate status
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const updateData = {
      placa: placa.trim().toUpperCase(),
      ruta: ruta.trim(),
      estado,
      conductor: conductor === null ? null : (conductor?._id || conductor),
      horarioInicio,
      horarioFin,
      diasTrabajo
    };

    const camionActualizado = await Camion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('conductor', 'nombre email');

    if (!camionActualizado) {
      return res.status(404).json({ error: 'Camión no encontrado' });
    }

    res.json(camionActualizado);
  } catch (error) {
    console.error('Error updating:', error);
    res.status(400).json({ error: error.message });
  }
});

// Modificar la ruta DELETE de camiones
app.delete('/api/camiones/:id', authenticateToken, async (req, res) => {
  try {
    const camionEliminado = await Camion.findByIdAndDelete(req.params.id);
    
    if (!camionEliminado) {
      return res.status(404).json({ error: 'Camión no encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Ruta para obtener incidencias de un camión
app.get('/api/camiones/:id/incidencias', authenticateToken, async (req, res) => {
  try {
    const incidencias = await Incidencia.find({ camionId: req.params.id })
      .sort({ fecha: -1 })
      .populate('conductorId', 'nombre');
    res.json(incidencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas protegidas - Conductores
app.get('/api/conductores-disponibles', authenticateToken, async (req, res) => {
  try {
    const conductores = await Usuario.find({ rol: 'conductor' }).select('-password');
    const camionesActivos = await Camion.find({ estado: 'activo' });
    const conductoresAsignados = camionesActivos.map(camion => camion.conductor?.toString());
    const conductoresDisponibles = conductores.filter(conductor => 
      !conductoresAsignados.includes(conductor._id.toString())
    );
    res.json(conductoresDisponibles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener incidencias pendientes del conductor
app.get('/api/conductor/incidencias-pendientes', authenticateToken, async (req, res) => {
  try {
    const incidencias = await Incidencia.find({
      conductorId: req.user.id,
      estado: 'pendiente'
    }).sort({ fecha: -1 });
    
    res.json(incidencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route for getting all incidencias
app.get('/api/admin/incidencias', authenticateToken, async (req, res) => {
  try {
    // First verify if the user is admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const incidencias = await Incidencia.find()
      .populate('conductorId', 'nombre email')
      .populate('camionId', 'placa ruta')
      .sort({ fecha: -1 });

    res.json(incidencias);
  } catch (error) {
    console.error('Error en /api/admin/incidencias:', error);
    res.status(500).json({ 
      error: 'Error al obtener incidencias',
      details: error.message 
    });
  }
});

// Route for updating incidencia status
app.put('/api/admin/incidencias/:id', authenticateToken, async (req, res) => {
  try {
    const incidencia = await Incidencia.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    )
    .populate('conductorId', 'nombre')
    .populate('camionId', 'placa');
    
    if (!incidencia) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }
    
    res.json(incidencia);
  } catch (error) {
    console.error('Error updating incidencia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rutas protegidas - Admin
app.get('/api/admin/:id', authenticateToken, async (req, res) => {
  try {
    const admin = await Usuario.findById(req.params.id).select('-password');
    if (!admin || admin.rol !== 'admin') {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalConductores = await Usuario.countDocuments({ rol: 'conductor' });
    const totalPasajeros = await Usuario.countDocuments({ rol: 'pasajero' });
    const totalCamiones = await Camion.countDocuments();
    const camionesActivos = await Camion.countDocuments({ estado: 'activo' });

    res.json({
      totalUsuarios,
      totalConductores,
      totalPasajeros,
      totalCamiones,
      camionesActivos,
      camionesInactivos: totalCamiones - camionesActivos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas para conductores
app.get('/api/conductor/info', authenticateToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario || usuario.rol !== 'conductor') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const camionAsignado = await Camion.findOne({ conductor: usuario._id, estado: 'activo' });
    if (!camionAsignado) {
      return res.status(404).json({ error: 'No hay camión asignado' });
    }

    res.json({
      usuario,
      camionAsignado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para crear una nueva incidencia
app.post('/api/conductor/incidencias', authenticateToken, upload.single('imagen'), async (req, res) => {
  try {
    const { descripcion, camionId } = req.body;
    
    const nuevaIncidencia = new Incidencia({
      descripcion,
      camionId,
      conductorId: req.user.id,
      fecha: new Date(),
      imagen: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevaIncidencia.save();
    res.status(201).json(nuevaIncidencia);
  } catch (error) {
    console.error('Error creating incidencia:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/conductor/ubicacion', authenticateToken, async (req, res) => {
  try {
    const { ubicacion, camionId } = req.body;
    
    const camion = await Camion.findById(camionId);
    if (!camion) {
      return res.status(404).json({ error: 'Camión no encontrado' });
    }

    camion.ubicacion = {
      ...ubicacion,
      ultimaActualizacion: new Date()
    };

    await camion.save();
    res.json(camion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Add these routes before the error handling middleware
// Middleware de manejo de errores
app.use(handleError);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
