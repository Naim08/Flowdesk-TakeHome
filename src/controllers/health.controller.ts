import { Request, Response } from "express";
import {logger } from '../utils/logger';

/**
 * Health check controller to verify service availability.
 */
export const getServiceHealth = async (req: Request, res: Response): Promise<void> => {
  logger.info("Health check request received");
  res.status(200).send("pong");
};

