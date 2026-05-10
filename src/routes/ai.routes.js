import { Router } from 'express';
import aiService from '../services/ai.service.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  validateExplain,
  validateChat,
  validateExplainTransaction,
  validateSuggest,
  validateLearn,
  validateLesson,
  validatePractice,
  validateWhy,
  validateCompare,
} from '../middleware/validator.js';

const router = Router();

/**
 * POST /api/ai/explain — Explain a Solana topic
 */
router.post('/explain', aiLimiter, validateExplain, async (req, res, next) => {
  try {
    const { topic, mode = 'normal', sessionId } = req.body;
    const result = await aiService.explain(topic, mode, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/explain-transaction — Explain a transaction
 */
router.post('/explain-transaction', aiLimiter, validateExplainTransaction, async (req, res, next) => {
  try {
    const { transaction, mode = 'normal', sessionId } = req.body;
    const result = await aiService.explainTransaction(transaction, mode, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/suggest — Suggest next steps
 */
router.post('/suggest', aiLimiter, validateSuggest, async (req, res, next) => {
  try {
    const { context, sessionId } = req.body;
    const result = await aiService.suggestNextSteps(context, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/chat — Free-form Solana chat
 */
router.post('/chat', aiLimiter, validateChat, async (req, res, next) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    const result = await aiService.chat(message, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/learn — Structured learning about a topic
 */
router.post('/learn', aiLimiter, validateLearn, async (req, res, next) => {
  try {
    const { topic, sessionId } = req.body;
    const result = await aiService.learn(topic, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/lesson — Structured mini-lesson
 */
router.post('/lesson', aiLimiter, validateLesson, async (req, res, next) => {
  try {
    const { topic, sessionId } = req.body;
    const result = await aiService.lesson(topic, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/practice — Practice task generation
 */
router.post('/practice', aiLimiter, validatePractice, async (req, res, next) => {
  try {
    const { scenario, sessionId } = req.body;
    const result = await aiService.practice(scenario, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/why — Explain why a concept matters
 */
router.post('/why', aiLimiter, validateWhy, async (req, res, next) => {
  try {
    const { topic, sessionId } = req.body;
    const result = await aiService.why(topic, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/compare — Compare two concepts
 */
router.post('/compare', aiLimiter, validateCompare, async (req, res, next) => {
  try {
    const { a, b, sessionId } = req.body;
    const result = await aiService.compare(a, b, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
