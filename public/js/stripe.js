import { showAlert } from './alert.js';

export const bookTourFn = async e => {
  try {
    e.target.textContent = 'Processing...';
    const { tourid } = e.target.dataset;
    const res = await fetch(
      `http://localhost:8000/api/v1/bookings/get-session/${tourid}`
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Something went wrong');
    }
    const data = await res.json();
    location.href = data.session.url;
  } catch (err) {
    showAlert('error', err.message);
  } finally {
    e.target.textContent = 'BOOK TOUR NOW!';
  }
};
