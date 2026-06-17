import axios from 'axios';
import { toast } from 'sonner'

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
        // If everything is OK, just return the response
        return response;
    },
    (error) => {
        // If the server throws 401 Unauthorized (Bad or expired JWT token)
        if (error.response?.status === 401) {
            console.error("Your session has expired. Logging out...");
            localStorage.removeItem('token'); // We remove the fake/old token
            window.location.href = '/login';  // We throw the user to the login screen
        }

        // If the server throws 403 Forbidden and a message about a blocked account
        if (error.response?.status === 403 && error.response?.data?.Message?.includes("disabled")) {
            console.error("Account disabled. Revoking access...");
            localStorage.removeItem('token'); // We take away the token

            toast.error("Access Denied", { description: "Your account has been disabled." });

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }

        return Promise.reject(error);
    }
);