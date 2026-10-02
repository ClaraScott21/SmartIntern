// ============================================
// SmartIntern — Login
// ============================================

const API_URL = 'http://localhost:3000/api';

// ---------- Elements ----------
const form       = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const errorBox   = document.getElementById('errorBox');
const errorText  = document.getElementById('errorText');
const loginBtn   = document.getElementById('loginBtn');
const btnText    = document.getElementById('btn-text');
const btnIcon    = document.getElementById('btn-icon');
const btnLoader  = document.getElementById('btn-loader');
const alertBox   = document.getElementById('login-alert');
const alertText  = document.getElementById('login-alert-text');
const togglePass = document.getElementById('toggle-password');

// ---------- Password toggle ----------
if (togglePass) {
  togglePass.addEventListener('click', () => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    const icon = document.getElementById('eye-icon');
    if (icon) {
      icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

// ---------- Helpers ----------
function showError(msg) {
  errorText.textContent = msg;
  errorBox.classList.remove('hidden');
  errorBox.classList.add('flex');
  if (window.lucide) window.lucide.createIcons();
}

function hideError() {
  errorBox.classList.add('hidden');
  errorBox.classList.remove('flex');
  errorText.textContent = '';
}

function showAlert(msg) {
  alertText.textContent = msg;
  alertBox.classList.remove('hidden');
  alertBox.classList.add('flex');
  if (window.lucide) window.lucide.createIcons();
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  if (isLoading) {
    btnText.textContent = 'Logging in…';
    if (btnIcon) btnIcon.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
  } else {
    btnText.textContent = 'Log In';
    if (btnIcon) btnIcon.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
  }
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
    password: passInput.value
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
      showError(data.error || 'Login failed. Please try again.');
      setLoading(false);
      return;
    }

    // Success
    localStorage.setItem('smartintern_token', data.token);
    localStorage.setItem('smartintern_user', JSON.stringify({
      userId: data.userId,
      role: data.role,
      name: data.name || ''
    }));

    showAlert('Login successful! Redirecting…');

    // Redirect by role (from DB — user does not choose)
    setTimeout(() => {
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
    }, 600);

  } catch (err) {
    console.error('Login error:', err);
    showError('Cannot connect to server. Please try again.');
    setLoading(false);
  }
});

// ---------- Enter key moves to password ----------
emailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') passInput.focus();
});