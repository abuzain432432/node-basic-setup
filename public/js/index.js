import {
  loginFn,
  logoutFn,
  updateUserDataFn,
  updatePasswordFn,
} from './auth.js';
import { bookTourFn } from './stripe';

const emailInputEle = document.getElementById('email');
const passwordInputEle = document.getElementById('password');
const loginFormEle = document.querySelector('.form--login');
const logoutBtnEle = document.querySelector('.nav__el--logout');
const bookTourBtnEle = document.querySelector('#bookTour');
const updateUserDataFormEle = document.querySelector(
  '.form-user-data'
);
const updatePasswordFormEle = document.querySelector(
  '.form-user-settings'
);

if (loginFormEle)
  loginFormEle.addEventListener('submit', e => {
    e.preventDefault();
    const email = emailInputEle.value;
    const password = passwordInputEle.value;
    loginFn(email, password);
  });

if (logoutBtnEle) logoutBtnEle.addEventListener('click', logoutFn);
if (updateUserDataFormEle)
  updateUserDataFormEle.addEventListener('submit', updateUserDataFn);
if (updatePasswordFormEle)
  updatePasswordFormEle.addEventListener('submit', updatePasswordFn);

if (bookTourBtnEle)
  bookTourBtnEle.addEventListener('click', bookTourFn);
