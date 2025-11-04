import { prepareNativeDateTimeInputs } from './core.datetime.js';
import { showToast } from './core.toast.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// --- Modal ---
function openCreateModal(){
  const wrap = $('#newEventModal');
  if(!wrap) return;
  wrap.classList.remove('hidden');
  document.body.classList.add('modal-open');
  prepareNativeDateTimeInputs(wrap);
  setupTicketTypeHandler();
  const focusables = wrap.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  const first = focusables[0];
  const last = focusables[focusables.length-1];
  if(first) first.focus();
  const trap = e => {
    if(e.key==='Escape') return closeCreateModal();
    if(e.key==='Tab'){
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  };
  wrap.addEventListener('keydown', trap);
  wrap._trapHandler = trap;
}
function closeCreateModal(){
  const wrap = $('#newEventModal');
  if(wrap){
    wrap.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if(wrap._trapHandler){ wrap.removeEventListener('keydown', wrap._trapHandler); delete wrap._trapHandler; }
  }
  const form = $('#createEventForm'); if(form) form.reset();
  const err = $('#newEventErrors'); if(err){ err.classList.add('hidden'); err.textContent=''; }
  $('#openCreateModal')?.focus();
}
function wireModalBasics(){
  $('#openCreateModal')?.addEventListener('click', openCreateModal);
  $$('[data-close-modal]').forEach(b=> b.addEventListener('click', closeCreateModal));
  const backdrop = $('#newEventModal');
  if(backdrop) backdrop.addEventListener('click', e=> { if(e.target===backdrop) closeCreateModal(); });
}

// --- Create Event ---
function setupTicketTypeHandler(){
  const typeSel = $('#modalType');
  const price = $('#modalPrice');
  if(!typeSel || !price) return;
  const update = () => { const free = typeSel.value==='free'; price.disabled=free; if(free) price.value=''; };
  update();
  typeSel.addEventListener('change', update);
}
function showModalErrors(errors){
  const box = $('#newEventErrors');
  if(!box) return;
  const list = (Array.isArray(errors)?errors:[errors]).filter(Boolean);
  box.setAttribute('role','alert');
  box.innerHTML = `<div class="err-title"><i class=\"fa-solid fa-triangle-exclamation\"></i> Issues</div><ul>${list.map(e=>`<li>${e}</li>`).join('')}</ul>`;
  box.classList.remove('hidden');
  const map = {title:'modalTitle',description:'modalDescription',location:'modalLocation',capacity:'modalCapacity',start:'modalStarts',end:'modalEnds',price:'modalPrice'};
  Object.values(map).forEach(id => $('#'+id)?.classList.remove('invalid'));
  const joined = list.join(' ').toLowerCase();
  for(const k in map){ if(joined.includes(k)){ const el = $('#'+map[k]); if(el){ el.classList.add('invalid'); el.focus(); } break; } }
}
async function handleCreateEvent(e){
  e.preventDefault();
  const form = $('#createEventForm');
  const submitBtn = $('#createEventSubmit');
  if(!form || !submitBtn) return;
  const data = new FormData(form);
  const startsAt = data.get('startsAt');
  const endsAt = data.get('endsAt');
  if(startsAt && endsAt){
    const s = +new Date(startsAt), en = +new Date(endsAt);
    if(!isNaN(s) && !isNaN(en) && en <= s){
      showModalErrors('End must be after Start');
      showToast('End must be after Start','error');
      return;
    }
  }
  const payload = {
    title: data.get('title'),
    description: data.get('description'),
    location: data.get('location'),
    startsAt, endsAt,
    type: data.get('type'),
    capacity: parseInt(data.get('capacity'))||0,
    price: parseFloat(data.get('price'))||0,
    published: data.get('published')==='on'
  };
  const original = submitBtn.innerHTML;
  submitBtn.disabled = true; submitBtn.dataset.loading='true'; submitBtn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
  try{
    const res = await fetch(window.location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const json = await res.json();
    if(res.ok){
      showToast(json.message || 'Created!','success');
      closeCreateModal();
      setTimeout(()=> location.reload(), 700);
    } else {
      showModalErrors(json.details || json.errors || json.error || 'Failed to create');
      showToast('Fix errors','error');
    }
  }catch(err){ console.error(err); showModalErrors('Network error'); showToast('Network error','error'); }
  finally { submitBtn.disabled=false; delete submitBtn.dataset.loading; submitBtn.innerHTML=original; }
}

// --- Publish Toggle ---
function bindPublishToggles(){
  $$('.toggle').forEach(t=> t.addEventListener('click', async e => {
    const el = e.currentTarget;
    if(el.dataset.loading==='true') return;
    const id = el.dataset.id;
    const organizerId = document.body.dataset.organizerId;
    if(!organizerId){ showToast('No organizer','error'); return; }
    const newState = !el.classList.contains('on');
    el.dataset.loading='true';
    try{
      const res = await fetch(`/organizers/${organizerId}/events/${id}/${newState?'publish':'unpublish'}`,{method:'PATCH'});
      const json = await res.json();
      if(res.ok){
        el.classList.toggle('on', newState);
        el.setAttribute('aria-checked', newState?'true':'false');
        const card = el.closest('[data-event-card]');
        if(card){
          card.dataset.published = String(newState);
          const chip = card.querySelector('.status-chip');
          if(chip){
            chip.classList.toggle('live', newState);
            const icon = chip.querySelector('i'); if(icon) icon.className = 'fa-solid ' + (newState?'fa-signal':'fa-pen-to-square');
            const label = chip.querySelector('.status-label'); if(label) label.textContent = newState?'Published':'Draft';
          }
          const helper = el.parentElement.querySelector('.helper');
          if(helper) helper.textContent = `Tap to ${newState?'unpublish':'publish'}`;
        }
        showToast(json.message || (newState?'Published':'Unpublished'),'success');
      } else {
        showToast(json.error || 'Failed','error');
      }
    }catch(err){ console.error(err); showToast('Network error','error'); }
    finally { delete el.dataset.loading; }
  }));
}

// --- Delete ---
function bindDeleteButtons(){
  $$('[data-action="delete"]').forEach(b=> b.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const card = btn.closest('[data-event-card]');
    const title = card? card.dataset.title : 'this event';
    if(!confirm(`Delete "${title}"?`)) return;
    const organizerId = document.body.dataset.organizerId;
    if(!organizerId){ showToast('No organizer','error'); return; }
    btn.disabled = true;
    try{
      const res = await fetch(`/organizers/${organizerId}/events/${btn.dataset.eventId}`,{method:'DELETE'});
      const json = await res.json();
      if(res.ok){ card?.remove(); showToast(json.message || 'Deleted','success'); }
      else { showToast(json.error || 'Delete failed','error'); btn.disabled=false; }
    }catch(err){ console.error(err); showToast('Network error','error'); btn.disabled=false; }
  }));
}

// --- Filters ---
function filterAndSortEvents() {
  const searchInput = $('#q')?.value.toLowerCase().trim() || '';
  const selectedType = $('#fltType')?.value || '';
  const selectedStatus = $('#fltStatus')?.value || '';
  const selectedSort = $('#fltSort')?.value || 'newest';
  const eventCards = $$('.event-card[data-event-card]');
  if (!eventCards.length) return;

  const eventData = eventCards.map(card => ({
    element: card,
    title: (card.dataset.title || '').toLowerCase(),
    location: (card.dataset.location || '').toLowerCase(),
    type: card.dataset.type || '',
    isPublished: card.dataset.published === 'true',
    startsAt: parseInt(card.dataset.startsAt) || 0,
    createdAt: parseInt(card.dataset.createdAt) || 0,
    capacity: parseInt(card.dataset.capacity) || 0
  }));

  const filteredEvents = eventData.filter(event => {
    if (searchInput && !(event.title.includes(searchInput) || event.location.includes(searchInput))) return false;
    if (selectedType && event.type !== selectedType) return false;
    if (selectedStatus === 'published' && !event.isPublished) return false;
    if (selectedStatus === 'draft' && event.isPublished) return false;
    return true;
  }).sort((a, b) => {
    switch (selectedSort) {
      case 'upcoming': return a.startsAt - b.startsAt;
      case 'alphabetical': return a.title.localeCompare(b.title);
      case 'capacity': return b.capacity - a.capacity;
      default: return b.createdAt - a.createdAt;
    }
  });

  const eventsGrid = $('[data-events-grid]');
  if (!eventsGrid) return;

  eventCards.forEach(card => {
    card.style.display = filteredEvents.some(event => event.element === card) ? '' : 'none';
  });

  filteredEvents.forEach(event => eventsGrid.appendChild(event.element));
  updateNoEventsMessage(filteredEvents.length);
}

function updateNoEventsMessage(eventCount) {
  let noEventsMsg = document.getElementById('noEventsMessage');
  const eventsGrid = $('[data-events-grid]');
  if (eventCount === 0) {
    if (!noEventsMsg && eventsGrid) {
      noEventsMsg = document.createElement('div');
      noEventsMsg.id = 'noEventsMessage';
      noEventsMsg.className = 'row-card no-events-filter-message';
      noEventsMsg.innerHTML = `
        <div style="text-align:center;">
          <i class='fa-solid fa-filter' style='font-size:3rem;margin-bottom:1rem;opacity:.3;display:block;'></i>
          <p style='margin:0;font-weight:600;'>No events match your filters</p>
          <p style='margin:.5rem 0 0 0;opacity:.7;font-size:.9rem;'>Try adjusting your search or filters</p>
        </div>`;
      eventsGrid.appendChild(noEventsMsg);
    } else if (noEventsMsg) {
      noEventsMsg.style.display = '';
    }
  } else if (noEventsMsg) {
    noEventsMsg.style.display = 'none';
  }
}

function resetFilters() {
  const filterSelectors = ['#q', '#fltType', '#fltStatus', '#fltSort'];
  filterSelectors.forEach((selector, index) => {
    const filterElement = $(selector);
    if (filterElement) filterElement.value = index === 3 ? 'newest' : '';
  });
  $$('.event-card[data-event-card]').forEach(card => card.style.display = '');
  document.getElementById('noEventsMessage')?.classList.add('hidden');
  filterAndSortEvents();
}

function bindFilters() {
  ['#q', '#fltType', '#fltStatus', '#fltSort'].forEach(selector => {
    const filterElement = $(selector);
    if (filterElement) {
      const eventType = selector === '#q' ? 'input' : 'change';
      filterElement.addEventListener(eventType, filterAndSortEvents);
    }
  });
  const resetButton = document.getElementById('reset');
  if (resetButton) resetButton.addEventListener('click', resetFilters);
}

// --- Init ---
function initDashboard(){
  prepareNativeDateTimeInputs();
  wireModalBasics();
  setupTicketTypeHandler();
  $('#createEventForm')?.addEventListener('submit', handleCreateEvent);
  bindPublishToggles();
  bindDeleteButtons();
  bindFilters();
  filterAndSortEvents();
}

document.addEventListener('DOMContentLoaded', initDashboard);
