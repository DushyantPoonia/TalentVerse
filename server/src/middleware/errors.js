export function notFound(req, res) {
  res.status(404).json({ message: 'The requested resource was not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'ZodError') return res.status(400).json({ message: 'Please check the provided information.', details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) });
  if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'The provided information is invalid.' });
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  res.status(error.status || 500).json({ message: error.expose ? error.message : 'Something went wrong. Please try again later.' });
}
