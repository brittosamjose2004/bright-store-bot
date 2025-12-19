// API Configuration
// When running locally (backend on laptop, app on phone), use your computer's IP: http://192.168.1.37:3000
// When deployed (backend on Vercel, app on Play Store), use the live URL: https://your-project.vercel.app

const DEV_API_URL = 'http://192.168.1.37:3000';
const PROD_API_URL = 'https://bright-store-azb8azrca-brittos-projects-d1d97668.vercel.app'; // Updated after Vercel deployment

// Toggle this to switch between environments
const IS_DEVELOPMENT = false; // Set to false for Play Store release

export const API_URL = IS_DEVELOPMENT ? DEV_API_URL : PROD_API_URL;
