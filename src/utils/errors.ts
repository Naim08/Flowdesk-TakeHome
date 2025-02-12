// src/utils/errors.ts
export class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public details?: any
    ) {
      super(message);
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  
  export class ExchangeError extends ApiError {
    constructor(exchange: string, message: string) {
      super(503, `${exchange} Error: ${message}`);
    }
  }
  
  export class ValidationError extends ApiError {
    constructor(field: string, message: string) {
      super(400, `Validation Error: ${field} - ${message}`);
    }
  }