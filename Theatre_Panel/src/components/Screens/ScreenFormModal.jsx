import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createScreen, updateScreen, toggleFormModal, clearScreenError } from '@/Redux/Actions/screensActions';
import { selectScreenFormData, selectScreensLoading, selectScreensError, selectSelectedScreen } from '@/Redux/Selectors/screensSelectors';
import ScreenForm from './ScreenForm';
import { X } from 'lucide-react';

export default function ScreenFormModal({ theatreId, onClose }) {
  const dispatch = useDispatch();
  const formData = useSelector(selectScreenFormData);
  const isLoading = useSelector(selectScreensLoading);
  const error = useSelector(selectScreensError);
  const selectedScreen = useSelector(selectSelectedScreen);

  const handleSubmit = async (data) => {
    try {
      if (selectedScreen?._id) {
        await dispatch(updateScreen(selectedScreen._id, data));
      } else {
        await dispatch(createScreen(theatreId, data));
      }
      handleClose();
    } catch (err) {
      console.error('Error submitting screen form:', err);  
    }
  };

  const handleClose = () => {
    dispatch(clearScreenError());
    dispatch(toggleFormModal(false));
    onClose();
  };

  const errors = error ? { general: error } : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div className="w-full max-w-2xl max-h-[90vh] bg-sidebar border border-sidebar rounded-lg shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0  border-b p-6">
          <h2 className="text-2xl font-bold ">
            {selectedScreen ? 'Edit Screen' : 'Create New Screen'}
          </h2>
          <button
            onClick={handleClose}
            className=" transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          <ScreenForm
            initialData={selectedScreen}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}
