// stdlogin.js
(function(){
  const $ = (sel) => document.querySelector(sel);
  const loginForm = $('#loginForm');
  const rollInput = $('#rollNo');
  const passInput = $('#password');
  const togglePw = $('#togglePassword');
  const loginBtn = $('#loginBtn');
  const loader = $('#loginLoader');
  const errorToast = $('#errorToast');
  const errorMessage = $('#errorMessage');
  const attemptsCounter = $('#attemptsCounter');
  const remainingSpan = $('#remainingAttempts');

  let remaining = 3;

  function showError(msg){
    errorMessage.textContent = msg;
    errorToast.classList.add('show');
  }
  window.hideErrorToast = function(){
    errorToast.classList.remove('show');
  }

  togglePw.addEventListener('click', () => {
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    togglePw.querySelector('i').className = type === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
  });

  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function getClientFingerprint(){
    // IP from ipify; device from user agent
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const j = await r.json();
      return { ip: j.ip || '0.0.0.0', device: navigator.userAgent };
    } catch {
      return { ip: '0.0.0.0', device: navigator.userAgent };
    }
  }

  function setLoading(state){
    if (state) {
      loginBtn.classList.add('loading');
      loginBtn.disabled = true;
    } else {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  }

  function updateRemaining(n){
    remaining = n;
    remainingSpan.textContent = n;
    attemptsCounter.style.color = n === 0 ? '#ef4444' : '#fca5a5';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorToast();

    const rollNo = rollInput.value.trim();
    const password = passInput.value;

    if (!rollNo || !password) {
      showError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await sha256Hex(password);
      const { ip, device } = await getClientFingerprint();

      const form = new URLSearchParams();
      form.set('action', 'login');
      form.set('rollNo', rollNo);
      form.set('passwordHash', passwordHash);
      form.set('ip', ip);
      form.set('device', device);

      const res = await fetch(window.YOOLBAAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: form.toString()
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.code === 'LOCKED') {
          updateRemaining(0);
          showError('Too many failed attempts. Try again in 1 hour.');
        } else if (data.code === 'INACTIVE') {
          showError('Your account is not active');
        } else {
          const rem = typeof data.remainingAttempts === 'number' ? data.remainingAttempts : Math.max(0, remaining - 1);
          updateRemaining(rem);
          showError(data.error || 'Login failed.');
        }
        return;
      }

      // Success
      sessionStorage.setItem('yb_token', data.token);
      sessionStorage.setItem('yb_roll', data.rollNo);
      sessionStorage.setItem('yb_avatar', data.profileImage || '');
      window.location.href = 'results.html';
    } catch (err) {
      showError('Network or server error. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Init
  updateRemaining(3);
})();
