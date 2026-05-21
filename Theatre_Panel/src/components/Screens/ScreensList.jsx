import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedScreen, toggleFormModal, deleteScreen as deleteScreenAction } from '@/Redux/Actions/screensActions';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScreensList({ screens = [], theatreId }) {
  const dispatch = useDispatch();

  const handleEdit = (screen) => {
    dispatch(setSelectedScreen(screen));
    dispatch(toggleFormModal(true));
  };

  const handleDelete = (screenId) => {
    if (window.confirm('Are you sure you want to delete this screen?')) {
      dispatch(deleteScreenAction(screenId));
    }
  };

  if (!screens || screens.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Seats</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sound System</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Projection</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {screens.map((screen, index) => (
            <tr key={screen._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{screen.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{screen.screenType || 'STANDARD'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{screen.totalSeats || 0}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{screen.soundSystem || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{screen.projectionType || '—'}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    screen.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {screen.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-sm">
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => handleEdit(screen)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(screen._id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
