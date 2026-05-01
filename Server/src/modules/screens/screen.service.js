import Screen from './screen.model.js';
import Theatre from '../theatres/theatre.model.js';
import ApiError from '../../utils/ApiError.js';

export const createScreen = async (theatreId, data, userId, role) => {
  const theatre = await Theatre.findById(theatreId);
  if (!theatre) throw ApiError.notFound('Theatre not found');
  if (role !== 'admin' && theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }

  const screen = await Screen.create({ ...data, theatre: theatreId });

  // Update theatre screen count
  await Theatre.findByIdAndUpdate(theatreId, { $inc: { totalScreens: 1 } });

  return screen;
};

export const updateScreen = async (screenId, data, userId, role) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'owner');
  if (!screen) throw ApiError.notFound('Screen not found');

  if (role !== 'admin' && screen.theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }

  Object.assign(screen, data);
  await screen.save();
  return screen;
};

export const getScreenById = async (screenId) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'name location');
  if (!screen) throw ApiError.notFound('Screen not found');
  return screen;
};

export const deleteScreen = async (screenId, userId, role) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'owner');
  if (!screen) throw ApiError.notFound('Screen not found');
  if (role !== 'admin' && screen.theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }

  screen.isActive = false;
  await screen.save();
  await Theatre.findByIdAndUpdate(screen.theatre._id, { $inc: { totalScreens: -1 } });
};

/**
 * Returns a seat map grouped by row for frontend rendering
 */
export const getSeatLayout = async (screenId) => {
  const screen = await Screen.findById(screenId).select('seatLayout pricing name screenType');
  if (!screen) throw ApiError.notFound('Screen not found');

  const rowMap = {};
  for (const seat of screen.seatLayout) {
    if (!rowMap[seat.row]) rowMap[seat.row] = [];
    rowMap[seat.row].push(seat);
  }

  const rows = Object.entries(rowMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, seats]) => ({
      row,
      seats: seats.sort((a, b) => a.number - b.number),
    }));

  return { screen: { name: screen.name, type: screen.screenType, pricing: screen.pricing }, rows };
};
