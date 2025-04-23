import axios from 'axios';

// creates an axios instance with a base URL that points to our API server
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // all requests are gonna prefix this URL
  withCredentials: true, // this will send cookies along with the requests
});

// Add a request interceptor to automatically add the authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // get the JWT token from local storage
  if (token) {
    // if there is a JWT token, attach it to the Authorization header
    // as a Bearer token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // we return this so taht the request can proceed
});

export default api;
