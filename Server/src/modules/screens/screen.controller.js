import * as screenService from './screen.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse.js';
import logger from '../../utils/logger.js';

/**
 * POST /theatres/:theatreId/screens
 *
 * BUG FIXED — theatreId was read from req.params in the error-logger but
 * was NEVER actually forwarded to screenService.createScreen(). The service
 * signature is createScreen(data, userId, role, theatreId).  Without it:
 *
 *  • Theatre owners always got "No theatre linked to this owner" if their
 *    ownedTheatre wasn't set yet — even when passing theatreId in the URL.
 *  • Admin always got "Theatre ID is required" because data.theatreId comes
 *    from req.body, not the URL param — so admins had to duplicate the ID in
 *    both the URL and the body, which is inconsistent and error-prone.
 *
 * Fix: extract req.params.theatreId and pass it as the 4th argument.
 * The service now merges URL-param theatreId with body theatreId (URL wins).
 */
export const createScreen = async (req, res, next) => {
  try {
    const screen = await screenService.createScreen(
      req.body,
      req.user.id,
      req.user.role,
      req.params.theatreId,   // ← THE FIX: was missing entirely
    );
    sendCreated(res, { screen }, 'Screen created successfully');
  } catch (e) {
    logger.error('Failed to create screen', {
      error: e.message,
      theatreId: req.params.theatreId,
      userId: req.user.id,
    });
    next(e);
  }
};

export const getScreenById = async (req, res, next) => {
  try {
    const screen = await screenService.getScreenById(req.params.id);
    sendSuccess(res, { screen });
  } catch (e) {
    logger.error('Failed to fetch screen', { error: e.message, screenId: req.params.id });
    next(e);
  }
};

export const getSeatLayout = async (req, res, next) => {
  try {
    const layout = await screenService.getSeatLayout(req.params.id);
    sendSuccess(res, layout);
  } catch (e) {
    logger.error('Failed to fetch seat layout', { error: e.message, screenId: req.params.id });
    next(e);
  }
};

export const updateScreen = async (req, res, next) => {
  try {
    const screen = await screenService.updateScreen(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
    );
    sendSuccess(res, { screen }, 'Screen updated successfully');
  } catch (e) {
    logger.error('Failed to update screen', {
      error: e.message,
      screenId: req.params.id,
      userId: req.user.id,
    });
    next(e);
  }
};

export const deleteScreen = async (req, res, next) => {
  try {
    await screenService.deleteScreen(req.params.id, req.user.id, req.user.role);
    sendNoContent(res);
  } catch (e) {
    logger.error('Failed to delete screen', {
      error: e.message,
      screenId: req.params.id,
      userId: req.user.id,
    });
    next(e);
  }
};
