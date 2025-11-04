// Event details page script 
import { showToast } from './core.toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const flashMessage = document.body.dataset.flash || '';
  if(flashMessage) showToast(flashMessage,'success');

  const organizerId = document.body.dataset.organizerId;
  const eventId = document.body.dataset.eventId;

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

  // QR validation helpers
  const scanResult = document.getElementById('scanResult');
  const updateScanResult = (variant, message) => {
    if(!scanResult) return;
    scanResult.classList.remove('d-none', 'alert-secondary', 'alert-success', 'alert-danger');
    const klass = variant === 'success' ? 'alert-success' : variant === 'warning' ? 'alert-secondary' : 'alert-danger';
    scanResult.classList.add(klass);
    scanResult.textContent = message;
  };

  const describeState = (payload) => {
    if(!payload) return {variant: 'danger', message: 'Unknown response.'};
    if(payload.state === 'checked_in') {
      const attendee = payload.ticket?.user;
      const name = attendee ? [attendee.firstName, attendee.lastName].filter(Boolean).join(' ').trim() : '';
      return {
        variant: 'success',
        message: `Ticket ${payload.ticket?.id || ''} checked in${name ? ` for ${name}` : ''}.`,
      };
    }
    if(payload.state === 'already_used') {
      return {
        variant: 'warning',
        message: `Ticket already used${payload.usedAt ? ` on ${new Date(payload.usedAt).toLocaleString()}` : ''}.`,
      };
    }
    if(payload.state === 'not_found') {
      return {variant: 'danger', message: 'No ticket matched that QR code.'};
    }
    if(payload.state === 'invalid_qr') {
      return {variant: 'danger', message: 'Unable to read a QR code from that image.'};
    }
    return {variant: 'danger', message: payload.error || 'Validation failed.'};
  };

  // Token form
  const qrTokenForm = document.getElementById('qrTokenForm');
  if(qrTokenForm && organizerId && eventId){
    qrTokenForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const tokenInput = document.getElementById('qrTokenInput');
      if(!tokenInput?.value.trim()) {
        updateScanResult('danger', 'QR token is required.');
        return;
      }
      const submitBtn = qrTokenForm.querySelector('button[type="submit"]');
      if(submitBtn) submitBtn.disabled = true;
      try{
        const res = await fetch(`/organizers/${organizerId}/events/${eventId}/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ qrToken: tokenInput.value.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        const result = res.ok ? describeState(data) : {variant: 'danger', message: data.error || 'Validation failed.'};
        updateScanResult(result.variant, result.message);
        if(res.ok && data.state === 'checked_in') {
          tokenInput.value = '';
        }
      }catch(err){
        console.error(err);
        updateScanResult('danger', 'Network error while validating ticket.');
      }finally{
        if(submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Image form
  const qrImageForm = document.getElementById('qrImageForm');
  if(qrImageForm && organizerId && eventId){
    qrImageForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const fileInput = document.getElementById('qrImageInput');
      if(!fileInput?.files?.length){
        updateScanResult('danger', 'Please choose an image containing the QR code.');
        return;
      }
      const submitBtn = qrImageForm.querySelector('button[type="submit"]');
      if(submitBtn) submitBtn.disabled = true;
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      try{
        const res = await fetch(`/organizers/${organizerId}/events/${eventId}/scan-image`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        const result = res.ok ? describeState(data) : {variant: 'danger', message: data.error || 'Image scan failed.'};
        updateScanResult(result.variant, result.message);
        if(res.ok && data.state === 'checked_in') {
          fileInput.value = '';
        }
      }catch(err){
        console.error(err);
        updateScanResult('danger', 'Network error while scanning QR image.');
      }finally{
        if(submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
