const mongoose = require('mongoose');

// Esquema para usuarios
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['pasajero', 'conductor', 'admin'], required: true },
  ubicacion: {  // Solo para conductores
    lat: { type: Number },
    lng: { type: Number }
  },
  ruta: { type: String }  // Solo para conductores
});

// Crear el modelo Usuario
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Exportar el modelo
module.exports = Usuario;