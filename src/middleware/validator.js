import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Process validation results and throw on errors.
 */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));
    throw new ValidationError('Validation failed', details);
  }
  next();
};

/**
 * Solana address validator — base58, 32-44 chars.
 */
const isValidSolanaAddress = (value) => {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
    throw new Error('Invalid Solana address format');
  }
  return true;
};

// --- Validation chains ---

export const validateAddress = [
  param('address')
    .trim()
    .custom(isValidSolanaAddress)
    .withMessage('Invalid Solana address'),
  handleValidation,
];

export const validateAirdrop = [
  body('address')
    .trim()
    .custom(isValidSolanaAddress)
    .withMessage('Invalid Solana address'),
  body('amount')
    .optional()
    .isFloat({ min: 0.001, max: 1000 })
    .withMessage('Amount must be between 0.001 and 1000 SOL'),
  handleValidation,
];

export const validateTransfer = [
  body('encryptedPrivateKey')
    .isString()
    .notEmpty()
    .withMessage('Encrypted private key is required'),
  body('to')
    .trim()
    .custom(isValidSolanaAddress)
    .withMessage('Invalid recipient address'),
  body('amount')
    .isFloat({ min: 0.000000001 })
    .withMessage('Amount must be a positive number'),
  handleValidation,
];

export const validateImportWallet = [
  body('privateKey')
    .isString()
    .notEmpty()
    .withMessage('Private key is required'),
  handleValidation,
];

export const validateExplain = [
  body('topic')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Topic is required (max 500 chars)'),
  body('mode')
    .optional()
    .isIn(['normal', 'eli5'])
    .withMessage('Mode must be "normal" or "eli5"'),
  handleValidation,
];

export const validateChat = [
  body('message')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message is required (max 2000 chars)'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string'),
  handleValidation,
];

export const validateExplainTransaction = [
  body('transaction')
    .isObject()
    .withMessage('Transaction data object is required'),
  body('mode')
    .optional()
    .isIn(['normal', 'eli5'])
    .withMessage('Mode must be "normal" or "eli5"'),
  handleValidation,
];

export const validateSuggest = [
  body('context')
    .isObject()
    .withMessage('Context object is required'),
  handleValidation,
];

export const validateLearn = [
  body('topic')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic is required (max 200 chars)'),
  handleValidation,
];

export const validateLesson = [
  body('topic')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic is required (max 200 chars)'),
  handleValidation,
];

export const validatePractice = [
  body('scenario')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Scenario is required (max 200 chars)'),
  handleValidation,
];

export const validateWhy = [
  body('topic')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic is required (max 200 chars)'),
  handleValidation,
];

export const validateCompare = [
  body('a')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('First comparison term is required'),
  body('b')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Second comparison term is required'),
  handleValidation,
];

export default {
  validateAddress,
  validateAirdrop,
  validateTransfer,
  validateImportWallet,
  validateExplain,
  validateChat,
  validateExplainTransaction,
  validateSuggest,
  validateLearn,
  validateLesson,
  validatePractice,
  validateWhy,
  validateCompare,
  handleValidation,
};
