import {createLogger, format, transports} from 'winston';

const pseudoDB = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.colorize(),
    format.errors({stack: true}),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `tmp-elrond-bridge-combined.log`.
    // - Write all logs error (and below) to `tmp-elrond-bridge-error.log`.
    //
    new transports.Console(),
    new transports.File({
      filename: '../logs/tmp-elrond-bridge-error.log',
      level: 'error',
    }),
    new transports.File({
      filename: '../logs/tmp-elrond-bridge-combined.log',
    }),
  ],
});

export default pseudoDB;