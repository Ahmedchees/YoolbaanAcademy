// Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbzCBM248R8zyudxvBOUnZcnjQwI8sbyt9JwKWrq90QpR4He9jgcKEgO1epTMYP4Gfje/exec'; // Replace with your actual endpoint
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour session

// DOM Elements
const elements = {
    loadingIndicator: document.getElementById('loadingIndicator'),
    profileImageMain: document.getElementById('profileImageMain'),
    studentNameMain: document.getElementById('studentNameMain'),
    studentRollNo: document.getElementById('studentRollNo'),
    studentStatusMain: document.getElementById('studentStatusMain'),
    resultsTable: document.getElementById('resultsTable'),
    resultsBody: document.getElementById('resultsBody'),
    noResults: document.getElementById('noResults'),
    totalMarks: document.getElementById('totalMarks'),
    averageMarks: document.getElementById('averageMarks'),
    overallGrade: document.getElementById('overallGrade'),
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    dropdownContent: document.getElementById('dropdownContent'),
    logoutBtn: document.getElementById('logoutBtn'),
    profileImage: document.getElementById('profileImage'),
    studentName: document.getElementById('studentName'),
    studentStatus: document.getElementById('studentStatus'),
    currentYear: document.getElementById('currentYear')
};

// State
let userSession = null;
let sessionTimer = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

function initializePage() {
    // Set current year in footer
    if (elements.currentYear) {
        elements.currentYear.textContent = new Date().getFullYear();
    }

    // Check authentication and load data
    checkAuthentication();
    
    // Setup event listeners
    setupEventListeners();
}

function checkAuthentication() {
    const sessionData = sessionStorage.getItem('userSession');
    
    if (!sessionData) {
        redirectToLogin('Please login to view exam results');
        return;
    }

    try {
        userSession = JSON.parse(sessionData);
        
        // Validate session structure
        if (!userSession?.sessionToken || !userSession?.rollNo) {
            throw new Error('Invalid session data');
        }

        // Display user profile and load results
        displayUserProfile();
        loadExamResults();
        
        // Start session timeout timer
        startSessionTimer();
    } catch (error) {
        console.error('Session validation error:', error);
        redirectToLogin('Session expired. Please login again.');
    }
}

function setupEventListeners() {
    // Hamburger menu toggle
    if (elements.hamburgerBtn) {
        elements.hamburgerBtn.addEventListener('click', toggleDropdown);
    }

    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', closeDropdown);
}

function toggleDropdown(e) {
    e.stopPropagation();
    elements.dropdownContent.style.display = 
        elements.dropdownContent.style.display === 'block' ? 'none' : 'block';
}

function closeDropdown(e) {
    if (!e.target.closest('.hamburger-menu')) {
        elements.dropdownContent.style.display = 'none';
    }
}

function displayUserProfile() {
    if (!userSession) return;

    // Main profile section
    if (elements.profileImageMain) {
        elements.profileImageMain.src = userSession.profileImage || 
            'https://www.gstatic.com/images/icons/material/system/1x/account_circle_black_24dp.png';
        elements.profileImageMain.alt = `${userSession.name}'s profile image`;
    }
    
    if (elements.studentNameMain) {
        elements.studentNameMain.textContent = userSession.name;
    }
    
    if (elements.studentRollNo) {
        elements.studentRollNo.textContent = userSession.rollNo;
    }
    
    if (elements.studentStatusMain) {
        elements.studentStatusMain.textContent = userSession.status || 'undergraduate';
        elements.studentStatusMain.className = `status-badge ${(userSession.status || 'undergraduate').toLowerCase()}`;
    }

    // Dropdown profile section
    if (elements.profileImage) {
        elements.profileImage.src = userSession.profileImage || 
            'https://www.gstatic.com/images/icons/material/system/1x/account_circle_black_24dp.png';
    }
    
    if (elements.studentName) {
        elements.studentName.textContent = userSession.name;
    }
    
    if (elements.studentStatus) {
        elements.studentStatus.textContent = userSession.status || 'undergraduate';
        elements.studentStatus.className = `status-badge ${(userSession.status || 'undergraduate').toLowerCase()}`;
    }
}

async function loadExamResults() {
    showLoading(true);

    try {
        const response = await fetchExamResults();
        
        if (response.status === 'success') {
            if (response.data.results?.length > 0) {
                displayExamResults(response.data.results, response.data.summary);
            } else {
                showNoResults();
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error loading exam results:', error);
        showNoResults('Unable to load exam results. Please try again later.');
    } finally {
        showLoading(false);
    }
}

async function fetchExamResults() {
    const response = await fetch(`${API_URL}?action=getExamResults`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            rollNo: userSession.rollNo,
            sessionToken: userSession.sessionToken
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

function displayExamResults(results, summary) {
    // Clear previous results
    elements.resultsBody.innerHTML = '';

    // Add new results
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(result.courseId)}</td>
            <td>${escapeHtml(result.courseName)}</td>
            <td>${escapeHtml(result.marks)}</td>
            <td><span class="grade-badge ${result.grade?.toLowerCase() || ''}">${escapeHtml(result.grade)}</span></td>
            <td><span class="status-badge">${escapeHtml(result.status)}</span></td>
            <td>${escapeHtml(formatDisplayDate(result.date))}</td>
        `;
        elements.resultsBody.appendChild(row);
    });

    // Update summary
    if (summary) {
        elements.totalMarks.textContent = summary.totalMarks || '0';
        elements.averageMarks.textContent = summary.average ? summary.average.toFixed(2) : '0';
        elements.overallGrade.textContent = summary.overallGrade || '-';
    }

    // Show the table
    elements.resultsTable.style.display = 'table';
    elements.noResults.style.display = 'none';
}

function showNoResults(message) {
    elements.resultsTable.style.display = 'none';
    elements.noResults.style.display = 'block';
    
    if (message) {
        elements.noResults.innerHTML = `
            <p>${escapeHtml(message)}</p>
            <p>Please contact support if you believe this is an error.</p>
        `;
    } else {
        elements.noResults.innerHTML = `
            <p>There are no exam results available.</p>
            <p>Please contact support if you believe this is an error.</p>
        `;
    }
}

function handleApiError(response) {
    if (response.code === 'INVALID_SESSION' || response.message === 'Session expired or invalid') {
        redirectToLogin('Your session has expired. Please login again.');
    } else {
        showNoResults(response.message || 'Failed to load exam results');
    }
}

function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    if (elements.resultsTable) {
        elements.resultsTable.style.display = show ? 'none' : 'table';
    }
    
    if (elements.noResults) {
        elements.noResults.style.display = 'none';
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        // Invalidate session on server
        await fetch(`${API_URL}?action=studentLogout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                sessionToken: userSession.sessionToken
            })
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear client session
        sessionStorage.removeItem('userSession');
        redirectToLogin();
    }
}

function redirectToLogin(message = '') {
    const redirectUrl = message 
        ? `login.html?message=${encodeURIComponent(message)}` 
        : 'login.html';
    window.location.href = redirectUrl;
}

// Session timeout management
function startSessionTimer() {
    clearTimeout(sessionTimer);
    
    // Set timeout 1 minute before actual session expiration
    sessionTimer = setTimeout(() => {
        redirectToLogin('Your session has expired. Please login again.');
    }, SESSION_TIMEOUT - 60000);

    // Reset timer on user activity
    document.addEventListener('mousemove', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
}

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
        redirectToLogin('Your session has expired. Please login again.');
    }, SESSION_TIMEOUT - 60000);
}

// Utility functions
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDisplayDate(dateString) {
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
    } catch {
        return dateString;
    }
}