class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  const handleError = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    if (process.env.NODE_ENV === 'development') {
      // Detallado para desarrollo
      console.error('ERROR:', {
        message: err.message,
        stack: err.stack,
        status: err.status
      });
  
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
      });
    } else {
      // Simplificado para producción
      console.error('ERROR:', err.message);
  
      // Errores operacionales conocidos
      if (err.isOperational) {
        res.status(err.statusCode).json({
          status: err.status,
          message: err.message
        });
      } else {
        // Errores de programación o desconocidos
        res.status(500).json({
          status: 'error',
          message: 'Algo salió mal'
        });
      }
    }
  };
  
  // Errores comunes predefinidos
  const commonErrors = {
    notFound: (resource) => new AppError(`${resource} no encontrado`, 404),
    invalidCredentials: () => new AppError('Credenciales incorrectas', 401),
    unauthorized: () => new AppError('No autorizado', 401),
    forbidden: () => new AppError('Acceso denegado', 403),
    badRequest: (message) => new AppError(message || 'Solicitud inválida', 400),
    conflict: (message) => new AppError(message || 'Conflicto con el recurso', 409)
  };
  
  module.exports = {
    AppError,
    handleError,
    commonErrors
  };