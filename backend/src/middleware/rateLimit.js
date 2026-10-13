import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.rateLimited('Too many requests from this IP, please try again after 15 minutes'));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit login attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.rateLimited('Too many login attempts. Please try again after 15 minutes.'));
  },
});

export default {
  generalLimiter,
  authLimiter,
};
