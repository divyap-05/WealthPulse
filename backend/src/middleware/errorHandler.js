export const errorHandler = (err, req, res, next) => {
  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Database Conflict] Duplicate key rejected.');
    }
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation failed',
      errors: messages,
    });
  }

  // Cast error (invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large.' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body.' });
  }

  if (process.env.NODE_ENV === 'production') {
    const logDetails = { name: err.name || 'Error' };
    if (Number.isInteger(err.code)) logDetails.code = err.code;
    if (typeof err.codeName === 'string') logDetails.codeName = err.codeName;
    console.error('[App Error]', logDetails);
  } else {
    console.error('[App Error]', err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
