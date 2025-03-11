const mongoose = require('mongoose');

// Add this to your existing Camion schema
// Agregar el campo ubicacion al schema existente
const camionSchema = new mongoose.Schema({
  placa: { type: String, required: true, unique: true },
  ruta: { type: String, required: true },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  horarioInicio: { type: String, default: '05:00' },
  horarioFin: { type: String, default: '22:00' },
  diasTrabajo: {
    type: [String],
    default: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    validate: {
      validator: function(dias) {
        const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        return dias.every(dia => diasValidos.includes(dia));
      },
      message: 'Días de trabajo no válidos'
    }
  },
  ubicacion: {
    lat: String,
    lng: String,
    ultimaActualizacion: {
      type: Date,
      default: Date.now
    }
  }
});

module.exports = mongoose.model('Camion', camionSchema);