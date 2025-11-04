// Tiny toast helper

export function showToast(message, variant='info', ms=2600){
  const el = document.getElementById('toast');
  if(!el) return;
  const icon = variant==='success' ? 'fa-circle-check' : variant==='error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
  el.className = 'toast ' + variant;
  el.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
  void el.offsetWidth;
  requestAnimationFrame(()=> el.classList.add('show')); // next frame so CSS anim runs
  setTimeout(()=> el.classList.remove('show'), ms);     // hide later
}
