/**
 * AI-Powered Procurement System - Login Handler
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize login form if it exists
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Check if user is already logged in
  checkLoginStatus();
});

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginStatus = document.getElementById('loginStatus');
  
  // Show spinner during "authentication"
  document.getElementById('loginSpinner').classList.remove('d-none');
  document.getElementById('loginButton').disabled = true;
  
  // Simulate API delay
  setTimeout(function() {
    // Check demo credentials
    if (username === 'demo@example.com' && password === 'AIprocurement2025') {
      // Success - store login state and redirect
      localStorage.setItem('aips_logged_in', 'true');
      localStorage.setItem('aips_username', username);
      
      // Show success message and redirect
      if (loginStatus) {
        loginStatus.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
      }
      
      // Redirect to dashboard
      setTimeout(function() {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      // Failed login
      document.getElementById('loginSpinner').classList.add('d-none');
      document.getElementById('loginButton').disabled = false;
      
      if (loginStatus) {
        loginStatus.innerHTML = '<div class="alert alert-danger">Invalid credentials. Please use the demo credentials provided in the README.</div>';
      }
    }
  }, 1500);
}

/**
 * Check if user is already logged in
 */
function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('aips_logged_in') === 'true';
  const currentPage = window.location.pathname.split('/').pop();
  
  // If on login page but already logged in, redirect to dashboard
  if (currentPage === 'login.html' && isLoggedIn) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // If on protected page but not logged in, redirect to login
  if (currentPage !== 'login.html' && currentPage !== 'index.html' && !isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }
  
  // Update UI elements based on login status
  updateUIForLoginStatus(isLoggedIn);
}

/**
 * Update UI elements based on login status
 */
function updateUIForLoginStatus(isLoggedIn) {
  const logoutButton = document.getElementById('logoutButton');
  const userDisplay = document.getElementById('userDisplay');
  
  if (isLoggedIn) {
    // Update user display
    if (userDisplay) {
      const username = localStorage.getItem('aips_username');
      userDisplay.textContent = username;
      userDisplay.parentElement.classList.remove('d-none');
    }
    
    // Initialize logout button
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        localStorage.removeItem('aips_logged_in');
        localStorage.removeItem('aips_username');
        window.location.href = 'login.html';
      });
    }
  } else {
    // Hide user elements if not logged in
    if (userDisplay && userDisplay.parentElement) {
      userDisplay.parentElement.classList.add('d-none');
    }
  }
}
