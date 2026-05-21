# Screen Management Module - Testing Documentation

## Test Environment Setup
- Backend running on http://localhost:5000
- Frontend running on http://localhost:5173 (or Vite dev server)
- Logged in as a theatre owner with an onboarded theatre

---

## Test Scenarios

### 1. Load Screen Manager Page
**Steps:**
1. Navigate to `/screens` in the app
2. Wait for initial data load

**Expected:**
- Page title "Screen Management" displays
- "Add Screen" button visible
- If no screens exist: Empty state message "No screens yet" with "Create First Screen" button
- If screens exist: Table loads with list of screens
- Loading spinner shows during fetch

---

### 2. Create New Screen - Happy Path
**Steps:**
1. Click "Add Screen" button
2. Fill form:
   - Screen Name: "Screen 1 — IMAX"
   - Screen Type: "IMAX"
   - Sound System: "Dolby Atmos"
   - Projection Type: "4K Laser"
3. Set Pricing:
   - Silver: 200
   - Gold: 300
   - Premium: 400
   - Recliner: 500
4. Generate Seat Layout:
   - Rows: 5
   - Seats Per Row: 10
   - Click "Generate Layout"
5. Visual canvas shows 50 seats in 5×10 grid
6. Click "Create Screen" button
7. Wait for submission

**Expected:**
- Form submits successfully
- Modal closes
- New screen appears in list
- Success toast: "Screen created successfully!"
- Screen shows as "Active" in table

---

### 3. Seat Layout Editor - Interactive Testing
**Steps:**
1. In Create Screen form, scroll to Seat Layout Editor
2. Click "Generate Layout" with default values (5 rows, 10 seats/row)
3. Canvas displays seats in grid (50 total)
4. Click on a seat (e.g., seat "A1")
5. Right panel shows: "Selected: A1", Row A, Seat 1
6. Click different seat type buttons (silver, gold, premium, recliner)
7. Observe seat color changes in canvas
8. Try adding/removing rows and seats per row
9. Click seat again and select "Remove Seat"

**Expected:**
- Canvas updates in real-time
- Selected seat highlights with black border
- Seat colors match legend
- Right panel updates for each selected seat
- Row/seat numbers can be adjusted
- Seat can be removed
- Total seat count updates

---

### 4. Form Validation - Errors
**Steps:**
1. Click "Add Screen"
2. Try submitting with empty Screen Name
3. Try with no seat layout generated
4. Try with invalid pricing (negative number)

**Expected:**
- Inline error below "Screen Name": "Screen name is required"
- Inline error for Seat Layout: "Add at least one seat"
- Inline error for Pricing: "Price must be a non-negative number"
- Submit button disabled or error prevents submission

---

### 5. Edit Screen - Modification
**Steps:**
1. In screens list, click Edit button on any screen
2. Modal opens with "Edit Screen" title
3. Form pre-fills with existing data
4. Change screen name: Add " — Updated"
5. Change one seat type in layout from silver to gold
6. Modify one pricing field
7. Click "Update Screen" button

**Expected:**
- Modal shows previous data
- Changes save successfully
- Success toast: "Screen updated successfully!"
- List updates with new data
- Screen name in table reflects change

---

### 6. Delete Screen - Confirmation
**Steps:**
1. In screens list, find a screen to delete
2. Click Delete button (trash icon)
3. Confirmation dialog appears: "Are you sure you want to delete this screen?"
4. Click "Cancel" (or click outside)
5. Screen still in list
6. Click Delete again
7. Confirm deletion

**Expected:**
- Confirmation modal appears before delete
- Cancel keeps screen in list
- Confirmation deletes screen from list
- Success toast: "Screen deleted successfully!"
- Screen no longer appears in table

---

### 7. Delete Screen with Active Showtimes
**Steps:**
1. (Requires backend setup) Create a showtime for a screen
2. Try to delete that screen

**Expected:**
- Delete fails
- Error message: "Cannot delete screen with active showtimes. Cancel or complete all shows first."
- Error toast displays
- Screen remains in list

---

### 8. Error Handling - Network Issues
**Steps:**
1. Create a screen successfully
2. Open browser DevTools → Network tab
3. Disable network or set throttling to offline
4. Try to edit a screen and submit
5. Enable network again

**Expected:**
- Error toast: "Failed to update screen" (or similar)
- Form remains open
- User can retry after network restored

---

### 9. Authorization Check
**Steps:**
1. Logged in as theatre owner (Owner A)
2. Verify can see and edit their own screens
3. (If possible to access URL directly) Try to fetch screens for Owner B's theatre
4. Try to update Owner B's screen

**Expected:**
- Can only see own theatre's screens
- Cannot access other theatre's screens (403 Forbidden error)
- Toast shows authorization error

---

### 10. Performance - Large Seat Layout
**Steps:**
1. Create screen with large layout:
   - Rows: 15
   - Seats Per Row: 30
   - Total: 450 seats
2. Submit and edit this screen

**Expected:**
- Canvas renders all seats without crashing
- Clicking seats still responsive
- No visual lag when selecting seats

---

## API Endpoint Verification

### Create Screen
```
POST /api/v1/theatres/{theatreId}/screens
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Screen 1",
  "screenType": "IMAX",
  "pricing": { "silver": 200, "gold": 300, "premium": 400, "recliner": 500 },
  "seatLayout": [
    { "row": "A", "number": 1, "label": "A1", "type": "silver", "x": 0, "y": 0 }
  ]
}

Expected: 201 Created with screen object
```

### List Screens
```
GET /api/v1/theatres/{theatreId}/screens
Authorization: Bearer {token}

Expected: 200 OK with screens array
```

### Update Screen
```
PUT /api/v1/screens/{screenId}
Authorization: Bearer {token}

Expected: 200 OK with updated screen
```

### Delete Screen
```
DELETE /api/v1/screens/{screenId}
Authorization: Bearer {token}

Expected: 204 No Content
```

---

## Redux State Verification (DevTools)

1. Open Redux DevTools in browser
2. Navigate to Screens page
3. Verify state shape:
```javascript
{
  screens: {
    screens: [],           // Array of screen objects
    selectedScreen: null,  // Current editing screen or null
    loading: false,        // API call status
    error: null,          // Error message or null
    formData: {...},      // Current form values
    isFormOpen: false     // Modal visibility
  }
}
```

4. Click "Add Screen" → Verify `isFormOpen: true`
5. Create screen → Verify `loading` toggles and new screen added to array
6. Edit screen → Verify `selectedScreen` populated and form data synced
7. Delete screen → Verify screen removed from array

---

## Browser Console Checks
1. No errors in console when loading page
2. No errors when creating/editing/deleting screens
3. API calls visible in Network tab with correct URLs and status codes
4. Error messages appear in console for failed requests (logger.error in backend)

---

## Known Issues / Workarounds

### Issue: Seat coordinates don't persist correctly
**Cause**: SVG canvas coordinates need to be recalculated on render
**Workaround**: Click "Generate Layout" again to reset positions

### Issue: Large layouts slow on older browsers
**Cause**: SVG rendering overhead with 400+ elements
**Workaround**: Limit to ~200 seats for smooth UX, or use canvas library in future

---

## Sign-Off Checklist
- [ ] All CRUD operations complete without errors
- [ ] Validation works on both frontend and backend
- [ ] Error messages display clearly (inline + toasts)
- [ ] Loading states show during API calls
- [ ] Seat layout editor interactive and responsive
- [ ] Authorization checks working (403 on unauthorized access)
- [ ] Screen list updates after any operation
- [ ] Redux state remains consistent
- [ ] No console errors
- [ ] API endpoints all return correct status codes
