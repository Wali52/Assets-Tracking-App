import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export const useApiData = (url, dependencies = [], initialData = []) => {
  const { axios: apiClient, isAuthenticated, role } = useAuth();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(url); // use configured axios
      setData(response.data);
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err);

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

  return { data, loading, error, refetch: fetchData };
};
