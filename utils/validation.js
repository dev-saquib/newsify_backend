const Joi = require('joi');

const querySchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(1000)
    .trim()
    .required(),
  k: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .optional()
    .default(5)
});

const sessionSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
});

module.exports = { querySchema, sessionSchema };