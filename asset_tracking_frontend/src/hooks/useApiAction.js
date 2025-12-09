import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const useApiAction = () => {
    // We only need loading and error state for the action itself
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Get the authenticated Axios instance from AuthContext
    const { axios: apiClient, isAuthenticated } = useAuth();

    /**
     * Executes an API action (POST, PATCH, DELETE)
     * @param {string} url - The endpoint URL (e.g., '/categories/1/')
     * @param {string} method - The HTTP method (POST, PATCH, DELETE)
     * @param {object|null} body - The data payload for POST/PATCH
     * @returns {object|null} The response data on success, or null on failure.
     */
    const execute = useCallback(async (url, method, body = null) => {
        if (!isAuthenticated) {
            setError("User is not authenticated. Cannot perform action.");
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            let response;
            
            switch (method.toUpperCase()) {
                case 'POST':
                    response = await apiClient.post(url, body);
                    break;
                case 'PATCH':
                case 'PUT':
                    response = await apiClient.patch(url, body);
                    break;
                case 'DELETE':
                    response = await apiClient.delete(url);
                    break;
                default:
                    throw new Error(`Unsupported API method: ${method}`);
            }

            // Return the response data for the component to use (e.g., new ID after POST)
            return response.data; 

        } catch (err) {
            console.error(`API Action Error on ${method} ${url}:`, err);
            
            const status = err.response?.status;
            const responseData = err.response?.data;

            if (status === 401) {
                setError("Authentication required to perform this action.");
            } else if (status === 403) {
                setError("Permission denied for this action.");
            } else if (status === 400 && responseData && typeof responseData === 'object') {
                // FIX: Handle validation errors (400) which return an object of field errors
                const errorMessages = Object.keys(responseData)
                    .map(key => {
                        // Takes the first error message for each field
                        const messages = Array.isArray(responseData[key]) ? responseData[key].join(', ') : responseData[key];
                        // Capitalize key for better display (e.g., "Password: ...")
                        return `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${messages}`;
                    })
                    .join('\n'); // Join messages with a newline character

                setError(errorMessages);
            } else if (responseData?.detail) {
                // Fallback for generic 'detail' messages (e.g., object not found)
                setError(responseData.detail);
            } else {
                setError("Failed to complete action. Check console for details.");
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [apiClient, isAuthenticated]); // Dependencies ensure the latest axios instance is used

    // The hook returns the action function and its related state
    return { loading, error, execute, setError };
};

export default useApiAction;