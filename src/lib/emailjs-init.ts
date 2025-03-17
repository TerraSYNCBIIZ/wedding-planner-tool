import { init } from '@emailjs/browser';

// Initialize EmailJS with your user ID
// Get this from your EmailJS dashboard
export function initEmailJS() {
  // Your EmailJS public key
  const PUBLIC_KEY = 'b0P2yJHz_ZMo3cVlS';
  
  init(PUBLIC_KEY);
  
  console.log('EmailJS initialized');
} 