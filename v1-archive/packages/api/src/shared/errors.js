export class AppError extends Error {
  constructor(message, status = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl
  });
};

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  const response = {
    error: message
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    response.debug = error.message;
  }

  res.status(status).json(response);
};
