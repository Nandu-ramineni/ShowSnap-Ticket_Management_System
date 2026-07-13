import React, { useState, useEffect } from 'react';
import { SCREEN_TYPES, SEAT_TYPES } from '@/utils/constants';
import SeatLayoutEditor from './SeatLayoutEditor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ScreenForm({ initialData = null, onSubmit, isLoading = false, errors = {} }) {
  const [formData, setFormData] = useState({
    name: '',
    screenType: 'STANDARD',
    soundSystem: '',
    projectionType: '',
    pricing: {
      silver: 0,
      gold: 0,
      premium: 0,
      recliner: 0,
    },
    seatLayout: [],
    ...initialData,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        pricing: initialData.pricing || prev.pricing,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    setFieldErrors(errors);
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePricingChange = (seatType, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [seatType]: Math.max(0, parseInt(value) || 0),
      },
    }));
    const pricingKey = `pricing.${seatType}`;
    if (fieldErrors[pricingKey]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[pricingKey];
        return newErrors;
      });
    }
  };

  const handleSeatLayoutChange = (newLayout) => {
    setFormData(prev => ({
      ...prev,
      seatLayout: newLayout,
    }));
    if (fieldErrors.seatLayout) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.seatLayout;
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Screen name is required';
    if (!formData.screenType) newErrors.screenType = 'Screen type is required';
    if (formData.seatLayout.length === 0) newErrors.seatLayout = 'Add at least one seat';

    Object.entries(formData.pricing).forEach(([type, price]) => {
      if (typeof price !== 'number' || price < 0) {
        newErrors[`pricing.${type}`] = `Price must be a non-negative number`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold ">Screen Information</h3>

        <div>
          <label className="block text-sm font-medium  mb-1">
            Screen Name *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Screen 1, IMAX Hall, Audi 3"
            className={fieldErrors.name ? 'border-red-500' : ''}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium  mb-1">
              Screen Type *
            </label>
            <select
              name="screenType"
              value={formData.screenType}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.screenType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {Object.entries(SCREEN_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {fieldErrors.screenType && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.screenType}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium  mb-1">
              Sound System
            </label>
            <Input
              type="text"
              name="soundSystem"
              value={formData.soundSystem}
              onChange={handleChange}
              placeholder="e.g., Dolby Atmos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium  mb-1">
              Projection Type
            </label>
            <Input
              type="text"
              name="projectionType"
              value={formData.projectionType}
              onChange={handleChange}
              placeholder="e.g., 4K Laser"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4 p-4 bg-input/20  rounded-lg border">
        <h3 className="font-semibold ">Seat Type Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.pricing).map(([type, price]) => (
            <div key={type}>
              <label className="block text-sm font-medium  mb-1 capitalize">
                {type} Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1 ">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => handlePricingChange(type, e.target.value)}
                  placeholder="0"
                  className="pl-6"
                />
              </div>
              {fieldErrors[`pricing.${type}`] && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors[`pricing.${type}`]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seat Layout */}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium  mb-2">
            Seat Layout *
          </label>
          {fieldErrors.seatLayout && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.seatLayout}
              </p>
            </div>
          )}
        </div>
        <SeatLayoutEditor
          initialLayout={formData.seatLayout}
          onLayoutChange={handleSeatLayoutChange}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Screen' : 'Create Screen'}
        </Button>
      </div>
    </form>
  );
}
