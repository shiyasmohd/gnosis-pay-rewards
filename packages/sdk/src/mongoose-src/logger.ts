import { FilterQuery, Model, Mongoose, Schema } from 'mongoose';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export type LoggerDocumentFieldsType = {
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
};

const loggerSchema = new Schema<LoggerDocumentFieldsType>(
  {
    level: {
      type: String,
      enum: Object.values(LogLevel),
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true },
);

const loggerModelName = 'Logger' as const;

export function getLoggerModel(mongooseConnection: Mongoose) {
  // Return cached model if it exists
  if (mongooseConnection.models[loggerModelName]) {
    return mongooseConnection.models[loggerModelName] as Model<LoggerDocumentFieldsType>;
  }

  return mongooseConnection.model(loggerModelName, loggerSchema);
}

export function log(model: Model<LoggerDocumentFieldsType>, params: LoggerDocumentFieldsType) {
  try {
    return model.create(params);
  } catch (error) {
    console.error(error);
  }
}

export function createMongooseLogger(loggerModel: ReturnType<typeof getLoggerModel>) {
  return {
    log: (params: LoggerDocumentFieldsType) => log(loggerModel, params),
    logError: (params: Omit<LoggerDocumentFieldsType, 'level'>) =>
      log(loggerModel, { ...params, level: LogLevel.ERROR }),
    logInfo: (params: Omit<LoggerDocumentFieldsType, 'level'>) => log(loggerModel, { ...params, level: LogLevel.INFO }),
    logDebug: (params: Omit<LoggerDocumentFieldsType, 'level'>) =>
      log(loggerModel, { ...params, level: LogLevel.DEBUG }),
    logWarn: (params: Omit<LoggerDocumentFieldsType, 'level'>) => log(loggerModel, { ...params, level: LogLevel.WARN }),
    getLoggerModel: () => loggerModel,
    getLogs(params: { start?: Date; end?: Date; level?: LogLevel }) {
      const query = {} as FilterQuery<LoggerDocumentFieldsType>;
      if (params.start) query['createdAt'] = { $gte: params.start };
      if (params.end) query['createdAt'] = { ...query['createdAt'], $lte: params.end };
      if (params.level) query['level'] = params.level;
      return loggerModel.find(query);
    },
  };
}
