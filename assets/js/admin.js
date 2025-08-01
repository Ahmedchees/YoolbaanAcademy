// Load dashboard data
function loadDashboardData() {
  const token = localStorage.getItem('adminToken');
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'dashboardData',
      token
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Set admin username
      document.getElementById('adminUsername').textContent = localStorage.getItem('adminUsername');
      
      // Load students table
      loadStudentsTable(data.students);
      
      // Load exam results table
      loadExamResultsTable(data.exams);
      
      // Load student accounts table
      loadStudentAccountsTable(data.logins);
      
      // Initialize DataTables
      $('#studentsTable').DataTable();
      $('#examResultsTable').DataTable();
      $('#studentAccountsTable').DataTable();
    } else {
      console.error('Error loading dashboard data:', data.message);
      if (data.message === 'Unauthorized') {
        logout();
      }
    }
  })
  .catch(error => {
    console.error('Error loading dashboard data:', error);
  });
}

function loadStudentsTable(students) {
  const tbody = document.getElementById('studentsBody');
  tbody.innerHTML = '';
  
  students.forEach(student => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${student.rollNo}</td>
      <td>${student.name}</td>
      <td>${student.gender}</td>
      <td>${formatDate(student.dob)}</td>
      <td>${student.course}</td>
      <td>${formatDate(student.dateEnrolled)}</td>
      <td>
        <button class="action-btn btn-edit" data-id="${student.rollNo}"><i class="fas fa-edit"></i></button>
        <button class="action-btn btn-delete" data-id="${student.rollNo}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function loadExamResultsTable(exams) {
  const tbody = document.getElementById('examResultsBody');
  tbody.innerHTML = '';
  
  exams.forEach(exam => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${exam.courseId}</td>
      <td>${exam.courseName}</td>
      <td>${exam.rollNo}</td>
      <td>${exam.marks}</td>
      <td>${exam.grade}</td>
      <td>${exam.status}</td>
      <td>${formatDate(exam.date)}</td>
      <td>
        <button class="action-btn btn-edit" data-id="${exam.courseId}-${exam.rollNo}"><i class="fas fa-edit"></i></button>
        <button class="action-btn btn-delete" data-id="${exam.courseId}-${exam.rollNo}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function loadStudentAccountsTable(logins) {
  const tbody = document.getElementById('studentAccountsBody');
  tbody.innerHTML = '';
  
  logins.forEach(login => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${login.rollNo}</td>
      <td>${login.email}</td>
      <td><img src="${login.profileImage || 'https://www.gstatic.com/images/icons/material/system/1x/account_circle_black_24dp.png'}" alt="Profile" class="profile-img-small"></td>
      <td><span class="status-badge ${login.status}">${login.status}</span></td>
      <td>
        <button class="action-btn btn-edit" data-id="${login.rollNo}"><i class="fas fa-edit"></i></button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.dashboard-nav li').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.dashboard-nav li').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(`${this.dataset.tab}Tab`).classList.add('active');
    });
  });
  
  // Search functionality
  document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value;
    const activeTab = document.querySelector('.dashboard-nav li.active').dataset.tab;
    
    if (!query) return;
    
    fetch(API_URL + '/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'searchRecords',
        token: localStorage.getItem('adminToken'),
        query,
        type: activeTab
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        switch (activeTab) {
          case 'students':
            loadStudentsTable(data.results);
            break;
          case 'examResults':
            loadExamResultsTable(data.results);
            break;
          case 'studentAccounts':
            loadStudentAccountsTable(data.results);
            break;
        }
      } else {
        console.error('Search error:', data.message);
      }
    })
    .catch(error => {
      console.error('Search error:', error);
    });
  });
  
  // Add student button
  document.getElementById('addStudentBtn').addEventListener('click', function() {
    document.getElementById('modalStudentTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    showModal('studentModal');
  });
  
  // Add exam result button
  document.getElementById('addExamResultBtn').addEventListener('click', function() {
    document.getElementById('modalExamResultTitle').textContent = 'Add Exam Result';
    document.getElementById('examResultForm').reset();
    document.getElementById('examResultId').value = '';
    showModal('examResultModal');
  });
  
  // Edit/Delete buttons (delegated events)
  document.getElementById('studentsBody').addEventListener('click', function(e) {
    if (e.target.closest('.btn-edit')) {
      const rollNo = e.target.closest('.btn-edit').dataset.id;
      editStudent(rollNo);
    } else if (e.target.closest('.btn-delete')) {
      const rollNo = e.target.closest('.btn-delete').dataset.id;
      if (confirm(`Are you sure you want to delete student ${rollNo}?`)) {
        deleteStudent(rollNo);
      }
    }
  });
  
  document.getElementById('examResultsBody').addEventListener('click', function(e) {
    if (e.target.closest('.btn-edit')) {
      const id = e.target.closest('.btn-edit').dataset.id;
      editExamResult(id);
    } else if (e.target.closest('.btn-delete')) {
      const id = e.target.closest('.btn-delete').dataset.id;
      if (confirm('Are you sure you want to delete this exam result?')) {
        deleteExamResult(id);
      }
    }
  });
  
  document.getElementById('studentAccountsBody').addEventListener('click', function(e) {
    if (e.target.closest('.btn-edit')) {
      const rollNo = e.target.closest('.btn-edit').dataset.id;
      editStudentAccount(rollNo);
    }
  });
  
  // Form submissions
  document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveStudent();
  });
  
  document.getElementById('examResultForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveExamResult();
  });
  
  document.getElementById('studentAccountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveStudentAccount();
  });
  
  // Logout button
  document.getElementById('adminLogout').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
}

function editStudent(rollNo) {
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'searchRecords',
      token: localStorage.getItem('adminToken'),
      query: rollNo,
      type: 'students'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.results.length > 0) {
      const student = data.results[0];
      
      document.getElementById('modalStudentTitle').textContent = 'Edit Student';
      document.getElementById('studentId').value = student[0]; // RollNo
      document.getElementById('modalRollNo').value = student[0];
      document.getElementById('modalName').value = student[1];
      document.getElementById('modalGender').value = student[2];
      document.getElementById('modalDob').value = formatDateForInput(student[3]);
      document.getElementById('modalCourse').value = student[4];
      document.getElementById('modalDateEnrolled').value = formatDateForInput(student[5]);
      
      showModal('studentModal');
    } else {
      console.error('Student not found');
    }
  })
  .catch(error => {
    console.error('Error fetching student:', error);
  });
}

function editExamResult(id) {
  const [courseId, rollNo] = id.split('-');
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'searchRecords',
      token: localStorage.getItem('adminToken'),
      query: `${courseId} ${rollNo}`,
      type: 'exams'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.results.length > 0) {
      const exam = data.results[0];
      
      document.getElementById('modalExamResultTitle').textContent = 'Edit Exam Result';
      document.getElementById('examResultId').value = `${exam[0]}-${exam[6]}`; // CourseID-RollNo
      document.getElementById('modalCourseId').value = exam[0];
      document.getElementById('modalCourseName').value = exam[1];
      document.getElementById('modalResultRollNo').value = exam[6];
      document.getElementById('modalMarks').value = exam[2];
      document.getElementById('modalGrade').value = exam[3];
      document.getElementById('modalStatus').value = exam[4];
      document.getElementById('modalExamDate').value = formatDateForInput(exam[5]);
      
      showModal('examResultModal');
    } else {
      console.error('Exam result not found');
    }
  })
  .catch(error => {
    console.error('Error fetching exam result:', error);
  });
}

function editStudentAccount(rollNo) {
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'searchRecords',
      token: localStorage.getItem('adminToken'),
      query: rollNo,
      type: 'logins'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.results.length > 0) {
      const account = data.results[0];
      
      document.getElementById('modalStudentAccountTitle').textContent = 'Edit Student Account';
      document.getElementById('accountId').value = account[0]; // RollNo
      document.getElementById('modalAccountRollNo').value = account[0];
      document.getElementById('modalEmail').value = account[2];
      document.getElementById('modalProfileImage').value = account[3] || '';
      document.getElementById('modalAccountStatus').value = account[4];
      
      showModal('studentAccountModal');
    } else {
      console.error('Student account not found');
    }
  })
  .catch(error => {
    console.error('Error fetching student account:', error);
  });
}

function saveStudent() {
  const token = localStorage.getItem('adminToken');
  const id = document.getElementById('studentId').value;
  const isNew = id === '';
  
  const studentData = {
    rollNo: document.getElementById('modalRollNo').value,
    name: document.getElementById('modalName').value,
    gender: document.getElementById('modalGender').value,
    dob: document.getElementById('modalDob').value,
    course: document.getElementById('modalCourse').value,
    dateEnrolled: document.getElementById('modalDateEnrolled').value
  };
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'updateStudent',
      token,
      rollNo: isNew ? '' : id,
      field: isNew ? 'all' : '', // For new student, we'll handle all fields
      value: isNew ? studentData : '' // For updates, we'll handle individual fields
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadDashboardData();
      closeModal('studentModal');
    } else {
      console.error('Error saving student:', data.message);
    }
  })
  .catch(error => {
    console.error('Error saving student:', error);
  });
}

function saveExamResult() {
  const token = localStorage.getItem('adminToken');
  const id = document.getElementById('examResultId').value;
  const isNew = id === '';
  
  const examData = {
    courseId: document.getElementById('modalCourseId').value,
    courseName: document.getElementById('modalCourseName').value,
    rollNo: document.getElementById('modalResultRollNo').value,
    marks: document.getElementById('modalMarks').value,
    grade: document.getElementById('modalGrade').value,
    status: document.getElementById('modalStatus').value,
    date: document.getElementById('modalExamDate').value
  };
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'updateExamResult',
      token,
      rollNo: examData.rollNo,
      courseId: examData.courseId,
      field: isNew ? 'all' : '', // For new result, we'll handle all fields
      value: isNew ? examData : '' // For updates, we'll handle individual fields
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadDashboardData();
      closeModal('examResultModal');
    } else {
      console.error('Error saving exam result:', data.message);
    }
  })
  .catch(error => {
    console.error('Error saving exam result:', error);
  });
}

function saveStudentAccount() {
  const token = localStorage.getItem('adminToken');
  const rollNo = document.getElementById('accountId').value;
  
  const accountData = {
    email: document.getElementById('modalEmail').value,
    profileImage: document.getElementById('modalProfileImage').value,
    status: document.getElementById('modalAccountStatus').value
  };
  
  // Update each field individually
  const updates = [];
  
  updates.push(
    fetch(API_URL + '/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'updateStudent',
        token,
        rollNo,
        field: 'email',
        value: accountData.email
      })
    })
  );
  
  updates.push(
    fetch(API_URL + '/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'updateStudent',
        token,
        rollNo,
        field: 'profileImage',
        value: accountData.profileImage
      })
    })
  );
  
  updates.push(
    fetch(API_URL + '/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'updateStudent',
        token,
        rollNo,
        field: 'status',
        value: accountData.status
      })
    })
  );
  
  Promise.all(updates)
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(results => {
      if (results.every(r => r.success)) {
        loadDashboardData();
        closeModal('studentAccountModal');
      } else {
        console.error('Error saving student account:', results);
      }
    })
    .catch(error => {
      console.error('Error saving student account:', error);
    });
}

function deleteStudent(rollNo) {
  const token = localStorage.getItem('adminToken');
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'updateStudent',
      token,
      rollNo,
      field: 'delete',
      value: 'true'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadDashboardData();
    } else {
      console.error('Error deleting student:', data.message);
    }
  })
  .catch(error => {
    console.error('Error deleting student:', error);
  });
}

function deleteExamResult(id) {
  const [courseId, rollNo] = id.split('-');
  const token = localStorage.getItem('adminToken');
  
  fetch(API_URL + '/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'updateExamResult',
      token,
      rollNo,
      courseId,
      field: 'delete',
      value: 'true'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      loadDashboardData();
    } else {
      console.error('Error deleting exam result:', data.message);
    }
  })
  .catch(error => {
    console.error('Error deleting exam result:', error);
  });
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}