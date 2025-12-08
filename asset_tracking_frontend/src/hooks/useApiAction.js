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
                case 'PUT': // Including PUT for completeness, though PATCH is common for updates
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
            
            // Detailed error handling, similar to useApiData
            if (err.response?.status === 403) {
                setError("Permission denied for this action.");
            } else if (err.response?.status === 401) {
                setError("Authentication required to perform this action.");
            } else if (err.response?.data?.detail) {
                // Use specific error message from API response if available
                 setError(err.response.data.detail);
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