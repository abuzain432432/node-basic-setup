import { showAlert } from './alert.js';
const loginFn = async (email, password) => {
  try {
    const res = await fetch(
      'http://localhost:8000/api/v1/users/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error logging in! Try again');
    }
    const data = await res.json();
    showAlert('success', 'Logged in successfully');
    window.setTimeout(() => {
      location.assign('/');
    }, 1500);
  } catch (err) {
    showAlert('error', err?.message);
  }
};
const logoutFn = async e => {
  e.preventDefault();
  try {
    const res = await fetch(
      'http://localhost:8000/api/v1/users/logout'
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error logging out! Try again');
    }
    location.reload(true); // Reload the page and clearing caches
    location.assign('/');
  } catch (err) {
    showAlert('error', err?.message);
  }
};
const updateUserDataFn = async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const name = document.getElementById('name').value;
  const photo = document.getElementById('photo').files[0];
  const form = new FormData();
  form.append('email', email);
  form.append('name', name);
  form.append('photo', photo);
  try {
    const res = await fetch(
      'http://localhost:8000/api/v1/users/update-me',
      {
        method: 'PATCH',
        body: form,
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message);
    }
    showAlert('success', 'Data updated successfully');
  } catch (err) {
    showAlert('error', err?.message);
  }
};
const updatePasswordFn = async e => {
  e.preventDefault();
  const passwordEle = document.getElementById('password-current');
  const newPasswordEle = document.getElementById('password');
  const passwordConfirmEle = document.getElementById(
    'password-confirm'
  );
  const password = passwordEle.value;
  const newPassword = newPasswordEle.value;
  const passwordConfirm = passwordConfirmEle.value;
  try {
    const res = await fetch(
      'http://localhost:8000/api/v1/users/update-password',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordConfirm,
          password,
          newPassword,
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message);
    }
    showAlert('success', 'Password updated successfully');
    passwordEle.value = '';
    newPasswordEle.value = '';
    passwordConfirmEle.value = '';
  } catch (err) {
    showAlert('error', err?.message);
  }
};
export { loginFn, logoutFn, updateUserDataFn, updatePasswordFn };
