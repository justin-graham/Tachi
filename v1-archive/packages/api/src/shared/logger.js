import winston from 'winston';

const createTransports = () => {
  const transports = [];

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  } else {
    transports.push(new winston.transports.Console({
      format: winston.format.json()
    }));
  }

  return transports;
};

export const createLogger = () => {
  const level = process.env.LOG_LEVEL || 'info';

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'tachi-api' },
    transports: createTransports()
  });
};

export const logger = createLogger();
