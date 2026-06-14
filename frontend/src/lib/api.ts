import axios from 'axios';

// We create an Axios instance (we provide the address of our .NET backend)
export const api = axios.create({
    baseURL: 'http://localhost:5119',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor - Executes before each request is sent
api.interceptors.request.use((config) => {
    // We try to get the token from the browser's memory (LocalStorage)
    const token = localStorage.getItem('token');

    if (token && config.headers) {
        // If we have a token, we add it to the header just like in .http (Bearer ...)
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor - Executes after receiving the response from the API
api.interceptors.response.use(
    (response) => {
        // If everything is OK (e.g. 200), just return the response
        return response;
    },
    (error) => {
        // If the server throws 401 Unauthorized (Bad or expired JWT token)
        if (error.response?.status === 401) {
            console.error("Sesja wygasła. Wylogowywanie...");
            localStorage.removeItem('token'); // We remove the fake/old token
            window.location.href = '/login';  // We throw the user to the login screen
        }
        return Promise.reject(error);
    }
);