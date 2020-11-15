/* eslint-disable */

import axios from 'axios'; //this is es6 module syntex not commonJs module in node app
import { showAlert } from './alerts';

// data is on object containing data and type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const transporter = axios.create({
      withCredentials: true,
    });
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await transporter({
      method: 'PATCH',
      url: url,
      data,
    });
    // console.log('checking updation status', res.data);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
