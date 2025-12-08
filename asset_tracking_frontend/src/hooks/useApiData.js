import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export const useApiData = (url, dependencies = [], initialData = []) => {
    const { axios: apiClient, isAuthenticated, role } = useAuth();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (bypassCache = false) => { // <-- ACCEPT NEW PARAMETER
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);

        try {
            // ✅ IMPLEMENT CACHE BUSTING LOGIC
            let finalUrl = url;
            if (bypassCache) {
                // Append a unique timestamp to force cache bypass
                const cacheBuster = `_t=${Date.now()}`;
                finalUrl = url.includes('?') 
                    ? `${url}&${cacheBuster}` 
                    : `${url}?${cacheBuster}`;
            }

            const response = await apiClient.get(finalUrl); // <-- USE finalUrl
            setData(response.data);
        } catch (err) {
            console.error(`Error fetching data from ${url}:`, err);
            // ... (rest of error handling) ...
            if (err.response?.status === 403) {
                setError("You do not have permission to access this data.");
            } else if (err.response?.status === 401) {
                setError("Unauthorized: Please login again.");
            } else {
                setError("Failed to load data. Check console for details.");
            }
        } finally {
            setLoading(false);
        }
    }, [url, apiClient, isAuthenticated, ...dependencies]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Pass the setter function and the modified fetcher
    return { data, loading, error, refetch: fetchData, setData };
};