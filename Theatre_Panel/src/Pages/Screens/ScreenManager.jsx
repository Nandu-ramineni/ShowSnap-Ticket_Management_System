import React, { useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScreens, toggleFormModal, setSelectedScreen } from '@/Redux/Actions/screensActions';
import {
  selectAllScreens,
  selectScreensLoading,
  selectScreensError,
  selectIsFormOpen,
} from '@/Redux/Selectors/screensSelectors';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import ScreensList from '@/components/Screens/ScreensList';
import ScreenFormModal from '@/components/Screens/ScreenFormModal';

export default function ScreenManager() {
  const dispatch = useDispatch();
  const screens = useSelector(selectAllScreens);
  const loading = useSelector(selectScreensLoading);
  const error = useSelector(selectScreensError);
  const isFormOpen = useSelector(selectIsFormOpen);
  const currentUser = useSelector((state) => state.auth.user);

  const theatreId = currentUser?.ownedTheatre?._id;

  useEffect(() => {
    if (theatreId) {
      dispatch(fetchScreens(theatreId));
    }
  }, [theatreId, dispatch]);

  const handleAddScreen = () => {
    dispatch(setSelectedScreen(null));
    dispatch(toggleFormModal(true));
  };

  const handleCloseForm = () => {
    dispatch(toggleFormModal(false));
    dispatch(setSelectedScreen(null));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ">Screen Management</h1>
          <p className="mt-1 text-muted-foreground">Create and manage screens for your theatre</p>
        </div>
        <Button onClick={handleAddScreen} >
          + Add Screen
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-muted bg-opacity-10 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Error loading screens</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="rounded-lg bg-sidebar shadow">
        {loading && !screens.length ? (
          <div className="flex justify-center py-12">
            <div className="space-y-3 text-center">
              <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 h-8 w-8"></div>
              <p className="text-gray-500">Loading screens...</p>
            </div>
          </div>
        ) : screens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold ">No screens yet</h3>
              <p className="mt-2 text-muted-foreground">Create your first screen to get started</p>
              <Button
                onClick={handleAddScreen}
                className="mt-4 "
              >
                Create First Screen
              </Button>
            </div>
          </div>
        ) : (
          <ScreensList screens={screens} theatreId={theatreId} />
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <ScreenFormModal theatreId={theatreId} onClose={handleCloseForm} />
      )}
    </div>
  );
}
