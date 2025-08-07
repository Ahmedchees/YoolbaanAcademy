// Configuration - Replace with your actual API endpoint
const API_URL = 'https://script.google.com/macros/s/AKfycbzCBM248R8zyudxvBOUnZcnjQwI8sbyt9JwKWrq90QpR4He9jgcKEgO1epTMYP4Gfje/exec';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const rollNoInput = document.getElementById('rollNo');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const attemptsCounter = document.getElementById('attemptsCounter');
const errorToast = document.getElementById('errorToast');
const forgotPasswordLink = document.getElementById('forgotPassword');

// State variables
let loginAttempts = 0;
let isAccountLocked = false;
let unlockTime = null;

document.addEventListener('DOMContentLoaded', initAuthSystem);

function initAuthSystem() {
  // Hide attempts counter initially
  if (attemptsCounter) attemptsCounter.style.display = 'none';

  // Setup event listeners
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
  }

  // Check for existing lockout
  checkExistingLockout();
}

function checkExistingLockout() {
  const lockoutData = sessionStorage.getItem('loginLockout');
  if (lockoutData) {
    const { until } = JSON.parse(lockoutData);
    const now = new Date().getTime();
    
    if (now < until) {
      // Account is still locked
      isAccountLocked = true;
      unlockTime = until;
      updateLockoutTimer();
    } else {
      // Lockout has expired
      sessionStorage.removeItem('loginLockout');
    }
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  
  if (isAccountLocked) {
    showError('Account locked. Please try again later.');
    return;
  }

  const rollNo = rollNoInput.value.trim();
  const password = passwordInput.value;

  if (!rollNo || !password) {
    showError('Please enter both roll number and password');
    return;
  }

  // Show loading state
  setLoadingState(true);

  try {
    const response = await authenticateUser(rollNo, password);
    
    if (response.status === 'success') {
      handleSuccessfulLogin(response.data);
    } else {
      handleFailedLogin(response);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Login service unavailable. Please try again later.');
  } finally {
    setLoadingState(false);
  }
}

async function authenticateUser(rollNo, password) {
  // Get client IP and device info
  const ip = await getClientIP();
  const device = navigator.userAgent.substring(0, 255);

  const response = await fetch(`${API_URL}?action=studentLogin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      rollNo: rollNo,
      password: password,
      ip: ip,
      device: device
    })
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return await response.json();
}

function handleSuccessfulLogin(userData) {
  // Reset attempts counter
  loginAttempts = 0;
  sessionStorage.removeItem('loginAttempts');
  sessionStorage.removeItem('loginLockout');

  // Store user data in session storage
  sessionStorage.setItem('userSession', JSON.stringify({
    sessionToken: userData.sessionToken,
    rollNo: userData.rollNo,
    name: userData.name,
    profileImage: userData.profileImage,
    status: userData.status,
    sessionExpiry: userData.sessionExpiry
  }));

  // Redirect to exam results
  window.location.href = 'examResults.html';
}

function handleFailedLogin(response) {
  loginAttempts++;
  sessionStorage.setItem('loginAttempts', loginAttempts);

  // Show attempts counter if not already visible
  if (attemptsCounter && attemptsCounter.style.display === 'none') {
    attemptsCounter.style.display = 'flex';
  }

  // Update attempts display
  updateAttemptsDisplay();

  // Check if account should be locked
  if (loginAttempts >= 3 || response.data?.code === 'ACCOUNT_LOCKED') {
    const lockoutTime = response.data?.nextAllowedAttempt 
      ? new Date(response.data.nextAllowedAttempt).getTime()
      : Date.now() + 3600000; // Default 1 hour lockout
    
    lockAccount(lockoutTime);
    return;
  }

  // Show error message
  const errorMsg = response.message || 'Invalid credentials';
  showError(errorMsg);

  // Shake form for visual feedback
  triggerFormShake();
}

function lockAccount(lockoutUntil) {
  isAccountLocked = true;
  unlockTime = lockoutUntil;
  
  // Store lockout in session storage
  sessionStorage.setItem('loginLockout', JSON.stringify({
    until: unlockTime
  }));

  // Show lockout message
  const timeLeft = Math.ceil((unlockTime - Date.now()) / 60000); // in minutes
  showError(`Account locked. Please try again in ${timeLeft} minute${timeLeft !== 1 ? 's' : ''}.`);

  // Start countdown timer
  updateLockoutTimer();
}

function updateLockoutTimer() {
  if (!isAccountLocked || !unlockTime) return;

  const now = Date.now();
  const timeLeft = unlockTime - now;

  if (timeLeft <= 0) {
    // Lockout expired
    isAccountLocked = false;
    unlockTime = null;
    loginAttempts = 0;
    sessionStorage.removeItem('loginLockout');
    sessionStorage.removeItem('loginAttempts');
    
    if (attemptsCounter) {
      attemptsCounter.style.display = 'none';
    }
  } else {
    // Update every minute
    setTimeout(updateLockoutTimer, 60000);
  }
}

function updateAttemptsDisplay() {
  if (!attemptsCounter) return;
  
  const remainingAttempts = Math.max(0, 3 - loginAttempts);
  const attemptsText = document.getElementById('remainingAttempts');
  
  if (attemptsText) {
    attemptsText.textContent = remainingAttempts;
  }

  // Update styling based on remaining attempts
  attemptsCounter.className = 'attempts-counter';
  if (remainingAttempts <= 1) {
    attemptsCounter.classList.add('error');
  } else if (remainingAttempts <= 2) {
    attemptsCounter.classList.add('warning');
  }
}

function setLoadingState(isLoading) {
  if (!loginBtn) return;
  
  if (isLoading) {
    loginBtn.disabled = true;
    const loader = document.createElement('span');
    loader.className = 'btn-loader';
    loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    loginBtn.innerHTML = '';
    loginBtn.appendChild(loader);
  } else {
    loginBtn.disabled = false;
    loginBtn.innerHTML = 'Login';
  }
}

function triggerFormShake() {
  if (loginForm) {
    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
  }
}

function showError(message) {
  if (!errorToast) {
    alert(message); // Fallback if toast element doesn't exist
    return;
  }
  
  const errorMessage = errorToast.querySelector('#errorMessage');
  if (errorMessage) errorMessage.textContent = message;
  
  errorToast.classList.add('show');
  setTimeout(() => errorToast.classList.remove('show'), 5000);
}

async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('IP detection failed:', error);
    return 'unknown';
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  
  const rollNo = prompt('Please enter your Roll Number:');
  if (!rollNo) return;
  
  const email = prompt('Please enter the email associated with your account:');
  if (!email) return;

  try {
    const response = await fetch(`${API_URL}?action=forgotPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        rollNo: rollNo,
        email: email
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      alert(data.message);
    } else {
      alert(data.message || 'Password reset failed. Please contact support.');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    alert('An error occurred. Please try again later.');
  }
}

// Session validation for protected pages
function validateSession() {
  const userSession = sessionStorage.getItem('userSession');
  
  if (!userSession) {
    redirectToLogin();
    return null;
  }

  const sessionData = JSON.parse(userSession);
  const now = new Date();
  const expiryTime = new Date(sessionData.sessionExpiry);

  if (now > expiryTime) {
    sessionStorage.removeItem('userSession');
    redirectToLogin();
    return null;
  }

  return sessionData;
}

function redirectToLogin(message) {
  const redirectUrl = message 
    ? `login.html?message=${encodeURIComponent(message)}`
    : 'login.html';
  
  window.location.href = redirectUrl;
}