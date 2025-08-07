// Utility functions

// Get current year for footer
function setCurrentYear() {
  const year = new Date().getFullYear();
  const yearElements = document.querySelectorAll('#currentYear, #examCurrentYear');
  
  yearElements.forEach(element => {
    if (element) {
      element.textContent = year;
    }
  });
}

// Initialize hamburger menu
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const dropdownContent = document.getElementById('dropdownContent');
  
  if (hamburgerBtn && dropdownContent) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownContent.classList.remove('show');
    });
  }
}

// Get device info
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let device = 'Unknown';
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device = 'Mobile';
  } else if (/Tablet|iPad|PlayBook|Xoom|Kindle|Silk/.test(userAgent)) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }
  
  return device;
}

// Get IP address (simplified - in production use a proper service)
async function getIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'Unknown';
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  initHamburgerMenu();
});