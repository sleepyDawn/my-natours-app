/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51HmxQZEIBiWRqXwIzUAzbqkc3sKpwUA4YMEcXUlsyUWJ0gxWXZx7exwu0S4zk8fkVeMP0uQGJ3fOFcsEBfeVNUVy00eydHztKw'
    );
    // 1. Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log('checking session object: ', session);

    // 2. Use stripe object to create checkout form and charge credit card form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
