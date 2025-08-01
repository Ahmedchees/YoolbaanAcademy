// Utility functions
function showMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `message ${type}`;
  element.style.display = 'block';
  
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'flex';
  
  // Close modal when clicking outside
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Close button
  const closeBtn = modal.querySelector('.close');
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let device = 'Desktop';
  
  if (/Mobi|Android/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    device = 'Tablet';
  }
  
  return device;
}

function getClientIP() {
  // Note: This will only work if your frontend is hosted on the same domain as your backend
  // For a more reliable solution, you might want to track IPs on the backend
  return ''; // Will be handled by backend
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showForgotPasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'forgotPasswordModal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Forgot Password</h3>
      <form id="forgotPasswordForm">
        <div class="form-group">
          <label for="forgotRollNo">Roll Number</label>
          <input type="text" id="forgotRollNo" required>
        </div>
        <div class="form-group">
          <label for="forgotEmail">Registered Email</label>
          <input type="email" id="forgotEmail" required>
        </div>
        <button type="submit" class="btn-save">Submit</button>
      </form>
      <div id="forgotMessage" class="message" style="display:none;"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  showModal('forgotPasswordModal');
  
  document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const rollNo = document.getElementById('forgotRollNo').value;
    const email = document.getElementById('forgotEmail').value;
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'forgotPassword',
        rollNo,
        email
      })
    })
    .then(response => response.json())
    .then(data => {
      const messageEl = document.getElementById('forgotMessage');
      if (data.success) {
        showMessage('forgotMessage', data.message, 'success');
        setTimeout(() => {
          closeModal('forgotPasswordModal');
          modal.remove();
        }, 3000);
      } else {
        showMessage('forgotMessage', data.message || 'Error processing request', 'error');
      }
    })
    .catch(error => {
      showMessage('forgotMessage', 'Network error. Please try again.', 'error');
    });
  });
}

// Set API URL (replace with your deployed Apps Script URL)
const API_URL = 'https://script.google.com/macros/s/AKfycbyHx2Tk6Nv0GRRGpn8SByzdXpemmr4vpWRGAlimKJji8Qemqkv5BZTtgM95_5NgVLI2/exec';