# Filter Debugging Guide

## Check if Filters Are Working

### 1. Open Browser Console

### 2. Check for Initialization Messages
You should see:
```
✅ Search filter attached
✅ Type filter attached
✅ Status filter attached
✅ Sort filter attached
✅ Reset button attached
📊 Found X event cards on page
```
### 3. Test Each Filter

#### Search Filter:
1. Type something in the search box
2. Events should filter immediately
3. Try searching for event title or location

#### Type Filter:
1. Select "Free" or "Paid" from dropdown
2. Only matching events should show

#### Status Filter:
1. Select "Published" or "Draft"
2. Only matching events should show

#### Sort Filter:
1. Change sort option
2. Events should reorder

#### Reset Button:
1. Apply some filters
2. Click "Reset"
3. All events should appear again

### 4. Common Issues

#### Issue: No events showing at all
**Check:**
- Open console and type: `document.querySelectorAll('[data-event-card]')`
- Should show an array of elements
- If empty, no events exist on page

**Fix:**
- Make sure you have events in your database
- Run: `npm run seed` to add test data

#### Issue: Reset button not working
**Check:**
- Console for errors
- Make sure button has `id="reset"`

**Fix:**
- Clear browser cache (Ctrl+Shift+Delete)
- Reload page (Ctrl+F5)

#### Issue: Filters work but nothing shows
**Check:**
- Console log: `document.querySelector('[data-events-grid]')`
- Should return an element
- If null, the grid container doesn't exist

**Fix:**
- Check HTML has element with `data-events-grid` attribute

### 5. Manual Testing in Console

#### Show all event cards:
```javascript
document.querySelectorAll('[data-event-card]').forEach(card => {
  card.style.display = '';
});
```

#### Check filter values:
```javascript
console.log('Search:', document.getElementById('q')?.value);
console.log('Type:', document.getElementById('fltType')?.value);
console.log('Status:', document.getElementById('fltStatus')?.value);
console.log('Sort:', document.getElementById('fltSort')?.value);
```

#### Test filter function manually:
```javascript
filterAndSortEvents();
```

#### Reset all filters:
```javascript
resetFilters();
```

### 6. Quick Fixes

#### Clear all filters:
```javascript
document.getElementById('q').value = '';
document.getElementById('fltType').value = '';
document.getElementById('fltStatus').value = '';
document.getElementById('fltSort').value = 'newest';
document.querySelectorAll('[data-event-card]').forEach(card => card.style.display = '');
```

#### Force show all events:
```javascript
document.querySelectorAll('[data-event-card]').forEach(card => {
  card.style.display = '';
});
```

### 7. What Fixed in This Update

1. ✅ Changed from `.events-grid` to `[data-events-grid]` selector
2. ✅ Fixed showing/hiding logic to properly display visible events
3. ✅ Improved reset function to clear all filters and show all events
4. ✅ Added proper "no results" message handling
5. ✅ Added console logging for debugging
6. ✅ **Fixed "Newest first" sorting** - Now sorts by `createdAt` timestamp (most recently created events first)
7. ✅ **Fixed layout consistency** - "No results" message now matches the rest of the page styling with `o-title` and `o-sub` classes

### 8. Testing Checklist

- [ ] Page loads without JavaScript errors
- [ ] Search box filters by title
- [ ] Search box filters by location
- [ ] Type filter shows only free/paid events
- [ ] Status filter shows only published/draft events
- [ ] Sort changes event order
- [ ] Reset button clears all filters
- [ ] "No results" message appears when no matches
- [ ] All events reappear after reset

If all checks pass ✅ → Filters are working correctly!
