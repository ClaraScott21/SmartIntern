// ============================================
// NEXORA — Login Page Logic
// ============================================

const API_URL = 'http://localhost:3000/api'; // change if your backend runs elsewhere

// ---------- State ----------
let selectedRole = 'student';

// ---------- Elements ----------
const tabs        = document.querySelectorAll('.role-tab');
const form        = document.getElementById('loginForm');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const errorBox    = document.getElementById('errorBox');
const loginBtn    = document.getElementById('loginBtn');

// ---------- Role tab switching ----------
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    selectedRole = tab.dataset.role;
    hideError();
  });
});

// ---------- Helpers ----------
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
}

function hideError() {
  errorBox.textContent = '';
  errorBox.classList.remove('show');
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.classList.toggle('loading', isLoading);
}

// ---------- Validation ----------
function validate() {
  const email = emailInput.value.trim();
  const password = passInput.value;

  if (!email) {
    showError('Please enter your email.');
    emailInput.focus();
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Please enter a valid email address.');
    emailInput.focus();
    return false;
  }
  if (!password) {
    showError('Please enter your password.');
    passInput.focus();
    return false;
  }
  return true;
}

// ---------- Submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  if (!validate()) return;

  const payload = {
    email: emailInput.value.trim(),
    password: passInput.value,
    selectedRole: selectedRole
  };

  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      // Backend returns { error: "..." }
      showError(data.error || 'Login failed. Please try again.');
      setLoading(false);
      return;
    }

    // ---------- Success ----------
    // Save token + user info
    localStorage.setItem('nexora_token', data.token);
    localStorage.setItem('nexora_user', JSON.stringify({
      userId: data.userId,
      role: data.role,
      name: data.name || ''
    }));

    // ---------- Redirect by role ----------
    if (data.role === 'student') {
      if (data.profileCompleted) {
        window.location.href = 'home.html';
      } else {
        window.location.href = 'student-profile.html';
      }
    } else if (data.role === 'company') {
      window.location.href = 'company-dashboard.html';
    } else if (data.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      showError('Unknown account role. Please contact support.');
      setLoading(false);
    }

  } catch (err) {
    console.error('Login error:', err);
    showError('Cannot connect to server. Please try again.');
    setLoading(false);
  }
});

// ---------- Enter key ----------
emailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') passInput.focus();
});