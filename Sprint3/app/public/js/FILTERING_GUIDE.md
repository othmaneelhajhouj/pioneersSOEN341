# Event Filtering

## Overview
The events dashboard now has **client-side filtering** - filters work instantly without reloading the page!

### Data Attributes
Each event card has data attributes that JavaScript uses for filtering:

```html
<article data-event-card
         data-title="Music Festival"
         data-location="Montreal"
         data-type="paid"
         data-published="true"
         data-starts-at="1728374400000"
         data-capacity="500">
```

### Filter Logic

1. **User changes a filter** → Event listener triggers
2. **JavaScript collects filter values** from inputs
3. **Loop through all event cards** and check each:
   - Does title/location match search?
   - Does type match filter?
   - Does published status match filter?
4. **Hide cards that don't match**
5. **Sort visible cards** based on sort option
6. **Re-append in sorted order** to change visual order

### Code Structure

```javascript
// 1. Get filter values
const searchQuery = document.getElementById('q').value;
const typeFilter = document.getElementById('fltType').value;
// ... etc

// 2. Filter events
let filteredEvents = allEventCards.filter(card => {
  // Check search query
  if (searchQuery && !card.title.includes(searchQuery)) {
    return false;
  }
  // Check type
  if (typeFilter && card.type !== typeFilter) {
    return false;
  }
  // ... etc
  return true;
});

// 3. Sort events
filteredEvents.sort((a, b) => {
  switch (sortOption) {
    case 'upcoming':
      return a.startsAt - b.startsAt;
    // ... etc
  }
});

// 4. Show/hide cards
filteredEvents.forEach(card => card.style.display = '');
```

## Performance

- ✅ **Fast** - No server request needed
- ✅ **Instant** - Updates as you type
- ✅ **Smooth** - No page reload
- ✅ **Efficient** - Only manipulates DOM once per filter change

## Edge Cases Handled

1. **No results** - Shows "No events match your filters" message
2. **Empty inputs** - Treats as "show all"
3. **Multiple filters** - All filters work together (AND logic)
4. **Reset** - Returns to default state from HTML
5. **Special characters** - Properly escaped in data attributes

### Event Listeners
```javascript
searchInput.addEventListener('input', filterAndSortEvents);
typeFilter.addEventListener('change', filterAndSortEvents);
statusFilter.addEventListener('change', filterAndSortEvents);
sortFilter.addEventListener('change', filterAndSortEvents);
resetButton.addEventListener('click', resetFilters);
```

### Filter Function
- Collects all event cards
- Maps to data objects
- Filters based on criteria
- Sorts based on option
- Updates DOM visibility and order

### Reset Function
- Gets default values from `data-default` attributes
- Resets all inputs
- Triggers filter function

## Future Enhancements 
1. **Date range filter** - Filter by start/end dates
2. **Price range filter** - Filter by ticket price
3. **Save filters** - Remember user's filter preferences
4. **URL parameters** - Share filtered view via link
5. **Advanced search** - Tags, categories, etc.