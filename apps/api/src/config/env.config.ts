import Joi from 'joi';
import { APP_CONSTANTS } from '@school-saas/config';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(APP_CONSTANTS.DEFAULT_PORT),
  API_PREFIX: Joi.string().default(APP_CONSTANTS.DEFAULT_API_PREFIX),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default(APP_CONSTANTS.JWT_ACCESS_EXPIRES_IN),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default(APP_CONSTANTS.JWT_REFRESH_EXPIRES_IN),
  HUBTEL_ENABLED: Joi.string().valid('true', 'false').default('false'),
  HUBTEL_CLIENT_ID: Joi.string().allow('').optional(),
  HUBTEL_CLIENT_SECRET: Joi.string().allow('').optional(),
  HUBTEL_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  PAYSTACK_ENABLED: Joi.string().valid('true', 'false').default('false'),
  PAYSTACK_SECRET_KEY: Joi.string().allow('').optional(),
  PAYSTACK_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  SEED_SUPER_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().min(APP_CONSTANTS.PASSWORD_MIN_LENGTH).optional(),
});
