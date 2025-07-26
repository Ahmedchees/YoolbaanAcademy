const API = 'https://script.google.com/macros/s/AKfycbyZItb-ofyHUK3vHJWVMrcSCcnkKG9AjxzAieTUMA-W5EwN_5NAx20cVoMDzwfxWWjD/exec';

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const roll = e.target.roll.value, pwd = e.target.password.value;
  const resp = await fetch(API, {
    method:'POST',
    body: JSON.stringify({ action:'login', roll, password:pwd })
  }).then(r=>r.json());
  if (!resp.success) return document.getElementById('err').innerText = resp.message;
  localStorage.token = resp.token;
  window.location = 'transcript.html';
});

// On transcript page load
if (document.getElementById('transcriptSection')) {
  const token = localStorage.token;
  fetch(`${API}?token=${token}`)
    .then(r=>r.json()).then(renderTranscript)
    .catch(()=>document.getElementById('transcriptSection')
      .innerText='Error fetching data.');
}

// Render transcript
function renderTranscript(data) {
  const sec = document.getElementById('transcriptSection');
  if (!data.success || !data.transcript.length) {
    sec.innerHTML = `<p>${data.message}</p>`; return;
  }
  // Header info
  document.getElementById('avatar').src = data.transcript[0].photo;
  document.getElementById('studentName').innerText = data.transcript[0].course; // replace with name field
  // Build table
  let html = `<table><thead>
    <tr><th>Course</th><th>Marks</th><th>Grade</th><th>Status</th><th>Date</th></tr>
  </thead><tbody>`;
  data.transcript.forEach(c=>{
    html += `<tr>
      <td data-label="Course">${c.course}</td>
      <td data-label="Marks">${c.marks}</td>
      <td data-label="Grade">${c.grade}</td>
      <td data-label="Status">${c.status}</td>
      <td data-label="Date">${c.date}</td>
    </tr>`;
  });
  html += `</tbody></table>
    <div class="summary">
      <p>Total: ${data.total}</p>
      <p>Average: ${data.average.toFixed(2)}</p>
      <p>Overall Grade: ${data.overallGrade}</p>
    </div>`;
  sec.innerHTML = html;
}

// Logout
document.getElementById('logout')?.addEventListener('click', ()=>{
  localStorage.clear();
  window.location = 'index.html';
});
