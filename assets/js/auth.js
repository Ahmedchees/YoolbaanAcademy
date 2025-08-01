// Updated studentLogin function in auth.js
function studentLogin(rollNo, password) {
  const device = getDeviceInfo();
  const loginMessageEl = document.getElementById('loginMessage');
  
  // Show loading state
  loginMessageEl.textContent = 'Logging in...';
  loginMessageEl.className = 'message info';
  loginMessageEl.style.display = 'block';

  fetch(API_URL + '/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'studentLogin',
      rollNo,
      password,
      ip: '', // Will be handled by backend
      device
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Store token and redirect to results page
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('profileImage', data.profileImage);
      localStorage.setItem('studentStatus', data.status);
      window.location.href = 'results.html';
    } else {
      showMessage('loginMessage', data.message || 'Login failed. Please check your credentials.', 'error');
    }
  })
  .catch(error => {
     console.error('Login error:', error);
  
  let errorMessage = 'Network error. Please try again.';
  let showRetry = false;
  
  if (error.message.includes('Failed to fetch')) {
    errorMessage = 'Cannot connect to server. Please check your internet connection.';
    showRetry = true;
  } else if (error.message.includes('HTTP error')) {
    errorMessage = 'Server error. Please try again later.';
    showRetry = true;
  }
  
  const messageEl = document.getElementById('loginMessage');
  messageEl.innerHTML = errorMessage;
  if (showRetry) {
    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';
    retryBtn.className = 'btn-retry';
    retryBtn.onclick = function() {
      studentLogin(rollNo, password);
    };
    messageEl.appendChild(document.createElement('br'));
    messageEl.appendChild(retryBtn);
  }
  messageEl.className = 'message error';
  messageEl.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
      const messageEl = document.getElementById('loginMessage');
      if (messageEl.textContent === errorMessage) {
        messageEl.style.display = 'none';
      }
    }, 5000);
  });
}
// Admin Login
function adminLogin(username, password) {
  const device = getDeviceInfo();
  
  fetch(API_URL + '/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'adminLogin',
      username,
      password,
      ip: '', // Will be handled by backend
      device
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Store token and redirect to dashboard
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', username);
      window.location.href = 'admin/dashboard.html';
    } else {
      showMessage('loginMessage', data.message || 'Login failed', 'error');
    }
  })
  .catch(error => {
    showMessage('loginMessage', 'Network error. Please try again.', 'error');
  });
}

// Logout
function logout() {
  if (localStorage.getItem('studentToken')) {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('studentStatus');
    window.location.href = 'index.html';
  } else if (localStorage.getItem('adminToken')) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    window.location.href = 'admin/index.html';
  }
}