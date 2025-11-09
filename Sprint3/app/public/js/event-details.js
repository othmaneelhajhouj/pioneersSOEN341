// Event details page script 
import { showToast } from './core.toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const flashMessage = document.body.dataset.flash || '';
  if(flashMessage) showToast(flashMessage,'success');

  // Bind single publish toggle if present
  const publishToggle = document.getElementById('togglePublish');
  if(publishToggle){
    publishToggle.addEventListener('click', async () => {
      if(publishToggle.dataset.loading==='true') return;
      const organizerId = document.body.dataset.organizerId;
      const id = publishToggle.dataset.eventId;
      if(!organizerId){ showToast('Organizer not found','error'); return; }
      const newState = !publishToggle.classList.contains('on');
      publishToggle.dataset.loading='true';
      try{
        const res = await fetch(`/organizers/${organizerId}/events/${id}/${newState?'publish':'unpublish'}`,{method:'PATCH'});
        const json = await res.json();
        if(res.ok){
          publishToggle.classList.toggle('on', newState);
          publishToggle.setAttribute('aria-checked', newState?'true':'false');
          const statusChip = document.querySelector('.status-chip');
            if(statusChip){
              statusChip.classList.toggle('live', newState);
              const icon = statusChip.querySelector('i'); if(icon) icon.className = 'fa-solid ' + (newState?'fa-signal':'fa-pen-to-square');
              const label = statusChip.querySelector('.status-label'); if(label) label.textContent = newState?'Published':'Draft';
            }
          showToast(json.message || (newState?'Event published!':'Event unpublished'),'success');
        } else {
          showToast(json.error || 'Failed','error');
        }
      }catch(err){ console.error(err); showToast('Network error','error'); }
      finally { delete publishToggle.dataset.loading; }
    });
  }

  // Bind deletion for detail page 
  const delBtn = document.getElementById('deleteEvent');
  if(delBtn){
  delBtn.addEventListener('click', async () => {
      const organizerId = document.body.dataset.organizerId;
      if(!organizerId) { showToast('Organizer not found','error'); return; }
      if(!confirm('Delete this event? This action cannot be undone.')) return;
      delBtn.disabled = true;
      try{
        const res = await fetch(`/organizers/${organizerId}/events/${delBtn.dataset.eventId}`, { method:'DELETE' });
        const json = await res.json();
        if(res.ok){
          showToast(json.message || 'Event deleted','success');
          setTimeout(()=> { window.location.href = `/organizers/${organizerId}/events`; }, 800);
        } else {
          showToast(json.error || 'Delete failed','error');
          delBtn.disabled = false;
        }
      }catch(err){ console.error(err); showToast('Network error','error'); delBtn.disabled=false; }
    });
  }
});
