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
  MTN_MOMO_BASE_URL: Joi.string().uri().default('https://sandbox.momodeveloper.mtn.com'),
  MTN_MOMO_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  MTN_MOMO_COLLECTION_API_KEY: Joi.string().allow('').optional(),
  MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY: Joi.string().allow('').optional(),
  MTN_MOMO_COLLECTION_USER_ID: Joi.string().allow('').optional(),
  MTN_MOMO_CURRENCY: Joi.string().length(3).uppercase().default('GHS'),
  MTN_MOMO_TARGET_ENVIRONMENT: Joi.string().default('sandbox'),
  SEED_SUPER_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().min(APP_CONSTANTS.PASSWORD_MIN_LENGTH).optional(),
});
