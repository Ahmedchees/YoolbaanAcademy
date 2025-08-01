// Load student profile
function loadStudentProfile() {
  const token = localStorage.getItem('studentToken');
  
  fetch(API_URL + '/student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'getProfile',
      token
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Update profile section
      document.getElementById('studentProfileImage').src = data.profileImage || 
        'https://www.gstatic.com/images/icons/material/system/1x/account_circle_black_24dp.png';
      document.getElementById('profileName').textContent = data.name;
      document.getElementById('profileRollNo').textContent = `Roll No: ${data.rollNo}`;
      document.getElementById('profileCourse').textContent = `Course: ${data.course}`;
      
      // Update status
      const statusElement = document.getElementById('profileStatus');
      statusElement.textContent = data.status;
      statusElement.className = `status-badge ${data.status}`;
      
      // Update dropdown menu
      document.getElementById('profileImage').src = data.profileImage || 
        'https://www.gstatic.com/images/icons/material/system/1x/account_circle_black_24dp.png';
      document.getElementById('studentName').textContent = data.name;
      
      const statusBadge = document.getElementById('studentStatus');
      statusBadge.textContent = data.status;
      statusBadge.className = `status-badge ${data.status}`;
    } else {
      console.error('Error loading profile:', data.message);
    }
  })
  .catch(error => {
    console.error('Error loading profile:', error);
  });
}

// Load exam results
function loadExamResults() {
  const token = localStorage.getItem('studentToken');
  
  fetch(API_URL + '/student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'getExamResults',
      token
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const resultsBody = document.getElementById('resultsBody');
      resultsBody.innerHTML = '';
      
      if (data.results.length === 0) {
        document.getElementById('noResultsMessage').style.display = 'block';
        document.getElementById('resultsTable').style.display = 'none';
        document.getElementById('resultsSummary').style.display = 'none';
        return;
      } else {
        document.getElementById('noResultsMessage').style.display = 'none';
        document.getElementById('resultsTable').style.display = 'table';
        document.getElementById('resultsSummary').style.display = 'flex';
      }
      
      data.results.forEach(result => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${result.courseId}</td>
          <td>${result.courseName}</td>
          <td>${result.marks}</td>
          <td>${result.grade}</td>
          <td>${result.status}</td>
          <td>${formatDate(result.date)}</td>
        `;
        
        resultsBody.appendChild(row);
      });
      
      // Update summary
      document.getElementById('totalMarks').textContent = data.summary.totalMarks.toFixed(2);
      document.getElementById('averageMarks').textContent = data.summary.average.toFixed(2);
      
      const overallGrade = document.getElementById('overallGrade');
      overallGrade.textContent = data.summary.overallGrade;
      
      // Set color based on grade
      if (data.summary.overallGrade === 'A+') {
        overallGrade.style.backgroundColor = '#27ae60';
      } else if (data.summary.overallGrade === 'A') {
        overallGrade.style.backgroundColor = '#2ecc71';
      } else if (data.summary.overallGrade === 'B') {
        overallGrade.style.backgroundColor = '#f39c12';
      } else if (data.summary.overallGrade === 'C') {
        overallGrade.style.backgroundColor = '#e67e22';
      } else if (data.summary.overallGrade === 'D') {
        overallGrade.style.backgroundColor = '#d35400';
      } else {
        overallGrade.style.backgroundColor = '#e74c3c';
      }
    } else {
      console.error('Error loading results:', data.message);
      document.getElementById('noResultsMessage').style.display = 'block';
      document.getElementById('resultsTable').style.display = 'none';
      document.getElementById('resultsSummary').style.display = 'none';
    }
  })
  .catch(error => {
    console.error('Error loading results:', error);
    document.getElementById('noResultsMessage').style.display = 'block';
    document.getElementById('resultsTable').style.display = 'none';
    document.getElementById('resultsSummary').style.display = 'none';
  });
}