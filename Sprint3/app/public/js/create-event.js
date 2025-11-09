// ==================== TICKET TYPE MANAGEMENT ====================
/**
 * Updates the ticket price field based on selected ticket type
 * - Free events: disables and clears the price field
 * - Paid events: enables the price field for input
 */
function syncPriceField() {
  const ticketTypeSelect = document.getElementById('ticketType');
  const priceInput = document.getElementById('priceField');
  
  if (ticketTypeSelect && priceInput) {
    const selectedType = ticketTypeSelect.value;
    
    if (selectedType === 'free') {
      // Free event: disable and clear price
      priceInput.value = '';
      priceInput.disabled = true;
      priceInput.style.opacity = '0.5';
    } else {
      // Paid event: enable price input
      priceInput.disabled = false;
      priceInput.style.opacity = '1';
    }
  }
}

function prepareNativeDateTimeInputs(){
  const pad = n=> n.toString().padStart(2,'0');
  const now = new Date();
  const today = now.getFullYear()+ '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
  const startDate = document.getElementById('pageStartDate');
  const endDate = document.getElementById('pageEndDate');
  const startTime = document.getElementById('pageStartTime');
  const endTime = document.getElementById('pageEndTime');
  const hiddenStart = document.getElementById('pageStarts');
  const hiddenEnd = document.getElementById('pageEnds');
  if(startDate && !startDate.min) startDate.min = today;
  if(endDate && !endDate.min) endDate.min = today;
  if(startTime && !startTime.value) startTime.value = pad(Math.max(9, now.getHours())) + ':00';
  if(endTime && !endTime.value) endTime.value = pad(Math.max(10, now.getHours()+1)) + ':00';
  function syncHidden(){
    if(startDate && startTime && hiddenStart){ hiddenStart.value = startDate.value && startTime.value ? `${startDate.value}T${startTime.value}` : ''; }
    if(endDate && endTime && hiddenEnd){ hiddenEnd.value = endDate.value && endTime.value ? `${endDate.value}T${endTime.value}` : ''; }
  }
  [startDate,startTime,endDate,endTime].forEach(el=>{ if(el) el.addEventListener('change', syncHidden); });
  syncHidden();
}

// ==================== PAGE INITIALIZATION ====================
/**
 * Set up all event listeners and initialize components when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
  prepareNativeDateTimeInputs();
  // Form-level validation for end > start
  const form = document.querySelector('form');
  if(form){
    form.addEventListener('submit', e => {
      const s = document.getElementById('pageStarts')?.value;
      const en = document.getElementById('pageEnds')?.value;
      if(s && en){
        const st = new Date(s).getTime();
        const et = new Date(en).getTime();
        if(!isNaN(st) && !isNaN(et) && et <= st){
          e.preventDefault();
          alert('End time must be after start time.');
        }
      }
    });
  }
  
  // Initialize ticket price field state
  syncPriceField();
  
  // Listen for changes to ticket type
  const ticketTypeSelect = document.getElementById('ticketType');
  if (ticketTypeSelect) {
    ticketTypeSelect.addEventListener('change', syncPriceField);
  }
});
