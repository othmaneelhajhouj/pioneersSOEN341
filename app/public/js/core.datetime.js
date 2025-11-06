// Datetime helpers for paired date + time inputs feeding hidden ISO fields.
const pad2 = n => n.toString().padStart(2,'0');

export function prepareNativeDateTimeInputs(root=document){
  const startDate = root.querySelector('#modalStartDate');
  const endDate   = root.querySelector('#modalEndDate');
  const startTime = root.querySelector('#modalStartTime');
  const endTime   = root.querySelector('#modalEndTime');
  const hiddenStart = root.querySelector('#modalStarts');
  const hiddenEnd   = root.querySelector('#modalEnds');
  const now = new Date();
  const today = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}`;
  if(startDate && !startDate.min) startDate.min = today;
  if(endDate && !endDate.min) endDate.min = today;
  if(startTime && !startTime.value) startTime.value = pad2(Math.max(9, now.getHours())) + ':00';
  if(endTime && !endTime.value) endTime.value = pad2(Math.max(10, now.getHours()+1)) + ':00';
  const sync = () => {
    if(startDate && startTime && hiddenStart) hiddenStart.value = (startDate.value && startTime.value) ? `${startDate.value}T${startTime.value}` : '';
    if(endDate && endTime && hiddenEnd) hiddenEnd.value = (endDate.value && endTime.value) ? `${endDate.value}T${endTime.value}` : '';
  };
  [startDate,startTime,endDate,endTime].forEach(el=> el && el.addEventListener('change', sync));
  sync();
}
