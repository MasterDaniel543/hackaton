const mongoose = require('mongoose');

const incidenciaSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true
  },
  camionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camion',
    required: true
  },
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'resuelta'],
    default: 'pendiente'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Incidencia', incidenciaSchema);