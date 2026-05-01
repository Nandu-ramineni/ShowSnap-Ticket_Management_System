import * as screenService from './screen.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse.js';

export const createScreen = async (req, res, next) => {
  try {
    const screen = await screenService.createScreen(req.params.theatreId, req.body, req.user.id, req.user.role);
    sendCreated(res, { screen }, 'Screen created');
  } catch (e) { next(e); }
};

export const getScreenById = async (req, res, next) => {
  try {
    const screen = await screenService.getScreenById(req.params.id);
    sendSuccess(res, { screen });
  } catch (e) { next(e); }
};

export const getSeatLayout = async (req, res, next) => {
  try {
    const layout = await screenService.getSeatLayout(req.params.id);
    sendSuccess(res, layout);
  } catch (e) { next(e); }
};

export const updateScreen = async (req, res, next) => {
  try {
    const screen = await screenService.updateScreen(req.params.id, req.body, req.user.id, req.user.role);
    sendSuccess(res, { screen }, 'Screen updated');
  } catch (e) { next(e); }
};

export const deleteScreen = async (req, res, next) => {
  try {
    await screenService.deleteScreen(req.params.id, req.user.id, req.user.role);
    sendNoContent(res);
  } catch (e) { next(e); }
};
