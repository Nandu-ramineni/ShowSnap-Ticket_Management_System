import React, { useState } from 'react';
import { SEAT_TYPES } from '@/utils/constants';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const seatTypeColors = {
  silver: '#9CA3AF',
  gold: '#FBBF24',
  premium: '#3B82F6',
  recliner: '#EF4444',
};

export default function SeatLayoutEditor({ initialLayout = [], onLayoutChange }) {
  const [seats, setSeats] = useState(initialLayout.length > 0 ? initialLayout : []);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [rows, setRows] = useState(initialLayout.length > 0 ? Math.max(...initialLayout.map(s => s.row.charCodeAt(0))) - 64 : 5);
  const [seatsPerRow, setSeatsPerRow] = useState(initialLayout.length > 0 ? Math.max(...initialLayout.map(s => s.number)) : 10);

  const generateLayout = () => {
    const newSeats = [];
    const rows_array = [];
    for (let i = 0; i < rows; i++) {
      rows_array.push(String.fromCharCode(65 + i));
    }

    rows_array.forEach((row, rowIdx) => {
      for (let num = 1; num <= seatsPerRow; num++) {
        const xPos = (num - 1) * 40;
        const yPos = rowIdx * 40;
        newSeats.push({
          row,
          number: num,
          label: `${row}${num}`,
          type: 'silver',
          x: xPos,
          y: yPos,
          isBlocked: false,
        });
      }
    });

    setSeats(newSeats);
    onLayoutChange(newSeats);
  };

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  const handleSeatTypeChange = (newType) => {
    if (!selectedSeat) return;
    const updated = seats.map(s =>
      s.label === selectedSeat.label ? { ...s, type: newType } : s
    );
    const updatedSelected = { ...selectedSeat, type: newType };
    setSelectedSeat(updatedSelected);
    setSeats(updated);
    onLayoutChange(updated);
  };

  const handleRemoveSeat = () => {
    if (!selectedSeat) return;
    const updated = seats.filter(s => s.label !== selectedSeat.label);
    setSeats(updated);
    setSelectedSeat(null);
    onLayoutChange(updated);
  };

  const canvasWidth = Math.max(seatsPerRow * 40 + 20, 200);
  const canvasHeight = Math.max(rows * 40 + 20, 150);

  return (
    <div className="space-y-4 p-4 rounded-lg border">
      <div>
        <h3 className="font-semibold  mb-3">Seat Layout Editor</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium  mb-1">
              Rows: {rows}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="26"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <Button
                onClick={() => setRows(r => Math.min(26, r + 1))}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setRows(r => Math.max(1, r - 1))}
                size="sm"
                variant="outline"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium  mb-1">
              Seats Per Row: {seatsPerRow}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <Button
                onClick={() => setSeatsPerRow(s => Math.min(50, s + 1))}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setSeatsPerRow(s => Math.max(1, s - 1))}
                size="sm"
                variant="outline"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={generateLayout} className="w-full bg-blue-600 hover:bg-blue-700">
          Generate Layout
        </Button>
      </div>

      {/* Canvas */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-sidebar p-4 overflow-auto max-h-80">
        <svg width={canvasWidth} height={canvasHeight} className="bg-sidebar">
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Seats */}
          {seats.map((seat) => (
            <g key={seat.label}>
              <rect
                x={seat.x + 10}
                y={seat.y + 10}
                width="30"
                height="30"
                fill={seatTypeColors[seat.type] || seatTypeColors.silver}
                stroke={selectedSeat?.label === seat.label ? '#000' : '#9CA3AF'}
                strokeWidth={selectedSeat?.label === seat.label ? 2 : 1}
                rx="3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSeatClick(seat)}
              />
              <text
                x={seat.x + 25}
                y={seat.y + 29}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#fff"
                pointerEvents="none"
              >
                {seat.number}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend & Selected Seat Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Seat Types</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(seatTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                <span className="text-gray-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seat Editor */}
        {selectedSeat && (
          <div className="space-y-3 p-3 bg-sidebar rounded-lg border border-blue-200">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">Selected: {selectedSeat.label}</h4>
              <p className="text-xs text-gray-600">Row {selectedSeat.row}, Seat {selectedSeat.number}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Change Type:</label>
              <div className="grid grid-cols-2 gap-1">
                {Object.keys(SEAT_TYPES).map((typeKey) => (
                  <button
                    key={typeKey}
                    onClick={() => handleSeatTypeChange(SEAT_TYPES[typeKey])}
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      selectedSeat.type === SEAT_TYPES[typeKey]
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {SEAT_TYPES[typeKey]}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleRemoveSeat}
              size="sm"
              variant="destructive"
              className="w-full text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Remove Seat
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600">
        Total Seats: {seats.length} | Click on a seat to select and edit its type
      </div>
    </div>
  );
}
