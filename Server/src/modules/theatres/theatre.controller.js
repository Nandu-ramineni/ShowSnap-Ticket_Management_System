import * as theatreService from './theatre.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/ApiResponse.js';
import { paginate } from '../../utils/validate.js';

export const listTheatres = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { theatres, total } = await theatreService.listTheatres({ ...req.query, page, limit, skip });
    sendPaginated(res, theatres, { total, page, limit });
  } catch (e) { next(e); }
};

export const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await theatreService.getTheatreById(req.params.id);
    sendSuccess(res, { theatre });
  } catch (e) { next(e); }
};

export const createTheatre = async (req, res, next) => {
  try {
    const theatre = await theatreService.createTheatre(req.body, req.user.id);
    sendCreated(res, { theatre }, 'Theatre created');
  } catch (e) { next(e); }
};

export const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await theatreService.updateTheatre(req.params.id, req.body, req.user.id, req.user.role);
    sendSuccess(res, { theatre }, 'Theatre updated');
  } catch (e) { next(e); }
};

export const getTheatreScreens = async (req, res, next) => {
  try {
    const screens = await theatreService.getTheatreScreens(req.params.id);
    sendSuccess(res, { screens });
  } catch (e) { next(e); }
};

export const getNearbyTheatres = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const theatres = await theatreService.getNearbyTheatres(Number(lat), Number(lng), Number(radius));
    sendSuccess(res, { theatres });
  } catch (e) { next(e); }
};

export const deleteTheatre = async (req, res, next) => {
  try {
    await theatreService.deleteTheatre(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, null, 'Theatre deleted');
  } catch (e) { next(e); }
};