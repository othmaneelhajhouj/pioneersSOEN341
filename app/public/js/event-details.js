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

  // AI banner generation controls
  const aiBannerButton = document.querySelector('[data-action="generate-image"]');
  const bannerImage = document.querySelector('[data-ai-banner]');
  const bannerPlaceholder = document.querySelector('[data-ai-placeholder]');
  const bannerSourceLink = document.querySelector('[data-ai-source]');
  const previewModal = document.getElementById('bannerPreviewModal');
  const previewImage = document.getElementById('previewBannerImage');
  
  
  let pendingBanner = null; // Store generated banner data before accepting

  const setBannerLabel = (hasImage) => {
    const label = aiBannerButton?.querySelector('span');
    if(label) label.textContent = hasImage ? 'Regenerate banner' : 'Generate banner';
  };

  const updatePlaceholderText = (hasImage) => {
    const textSpan = bannerPlaceholder?.querySelector('span');
    if(textSpan) textSpan.textContent = hasImage ? 'Banner stored' : 'No banner generated yet';
  };

  const refreshBannerDisplay = (payload = {}) => {
    const hasImage = Boolean(payload.imagePath);
    if(bannerImage){
      if(hasImage){
        bannerImage.src = `${payload.imagePath}?t=${Date.now()}`;
        bannerImage.classList.remove('hidden');
      } else {
        bannerImage.classList.add('hidden');
      }
    }
    if(bannerPlaceholder){
      bannerPlaceholder.classList.toggle('hidden', hasImage);
      updatePlaceholderText(hasImage);
    }
    if(bannerSourceLink){
      if(payload.imageUrl){
        bannerSourceLink.href = payload.imageUrl;
        bannerSourceLink.classList.remove('hidden');
      } else {
        bannerSourceLink.classList.add('hidden');
      }
    }
    setBannerLabel(hasImage);
  };

  const showPreviewModal = (imageData) => {
    // Hide any previous errors
    const errorDiv = document.getElementById('bannerError');
    if(errorDiv) errorDiv.classList.add('hidden');
    
    pendingBanner = imageData;
    if(previewImage && imageData.imagePath){
      previewImage.src = `${imageData.imagePath}?t=${Date.now()}`;
      previewImage.alt = 'Preview of generated banner for ' + (document.title || 'this event');
    }
    if(previewModal){
      const modal = new bootstrap.Modal(previewModal);
      modal.show();
      
      // Set focus to modal for accessibility
      previewModal.addEventListener('shown.bs.modal', () => {
        const acceptBtn = previewModal.querySelector('[data-action="accept-banner"]');
        if(acceptBtn) acceptBtn.focus();
      }, { once: true });
      
      // Clean up temp file if modal is closed without accepting
      previewModal.addEventListener('hidden.bs.modal', () => {
        if(pendingBanner?.imagePath){
          // Temp file will be cleaned up on next generation or server cleanup
          pendingBanner = null;
        }
      }, { once: true });
    }
  };

  const acceptBanner = async () => {
    if(pendingBanner){
      const errorDiv = document.getElementById('bannerError');
      const errorMsg = document.getElementById('bannerErrorMessage');
      
      try {
        // Validate image path
        if(!pendingBanner.imagePath || !pendingBanner.imagePath.startsWith('/event-images/')){
          throw new Error('Invalid image path');
        }
        
        // Call accept endpoint to finalize the banner
        const res = await fetch(`/organizers/${organizerId}/events/${eventId}/accept-banner`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            previewPath: pendingBanner.imagePath,
            imageUrl: pendingBanner.imageUrl 
          }),
        });
        
        const json = await res.json().catch(() => ({}));
        
        if(res.ok){
          refreshBannerDisplay(json);
          showToast('Banner saved successfully','success');
          pendingBanner = null;
          const modal = bootstrap.Modal.getInstance(previewModal);
          if(modal) modal.hide();
        } else {
          const errText = json.error || 'Failed to save banner. Please try again.';
          if(errorDiv && errorMsg){
            errorMsg.textContent = errText;
            errorDiv.classList.remove('hidden');
          }
          showToast(errText, 'error');
        }
      } catch(err) {
        console.error('Accept banner error:', err);
        showToast('Failed to save banner', 'error');
      }
    }
  };

  // Use event delegation on document for modal button clicks
  document.addEventListener('click', async (e) => {
    // Check if clicking a button with data-action directly
    const target = e.target.closest('[data-action]');
    
    if(!target) return;
    
    const action = target.getAttribute('data-action');
    
    // Only handle banner modal actions
    if(action === 'accept-banner'){
      await acceptBanner();
    } else if(action === 'regenerate-banner'){
      pendingBanner = null;
      const modal = bootstrap.Modal.getInstance(previewModal);
      if(modal) modal.hide();
      // Trigger generation again
      setTimeout(() => aiBannerButton?.click(), 300);
    }
  });

  if(aiBannerButton && organizerId && eventId){
    aiBannerButton.addEventListener('click', async () => {
      const rawPrompt = window.prompt('Describe the banner you want to generate (vivid, concise prompts work best).\n\nNote: Generation takes 10-60 seconds.\nLeave empty to auto-generate from event details.');
      if(rawPrompt === null) return; // User cancelled
      
      const prompt = rawPrompt.trim(); // Trim whitespace, allow empty string
      
      // Show loading state
      const btnText = aiBannerButton.querySelector('.btn-text');
      const btnLoading = aiBannerButton.querySelector('.btn-loading');
      if(btnText) btnText.classList.add('hidden');
      if(btnLoading) btnLoading.classList.remove('hidden');
      aiBannerButton.disabled = true;
      
      try{
        const res = await fetch(`/organizers/${organizerId}/events/${eventId}/generate-image`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ prompt }),
        });
        const json = await res.json().catch(() => ({}));
        if(res.ok){
          // Show preview modal instead of immediately updating
          showPreviewModal(json);
        } else {
          showToast(json.error || 'Failed to generate banner','error');
        }
      }catch(err){
        console.error(err);
        showToast('Network error','error');
      }finally{
        // Restore button state
        if(btnText) btnText.classList.remove('hidden');
        if(btnLoading) btnLoading.classList.add('hidden');
        aiBannerButton.disabled = false;
        const hasImageNow = bannerImage && !bannerImage.classList.contains('hidden');
        setBannerLabel(Boolean(hasImageNow));
      }
    });
  }
});
