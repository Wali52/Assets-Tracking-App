/* src/hooks/useDashboardMetrics.js */
import { useMemo } from 'react';
import { useApiData } from './useApiData'; 

// Define the API endpoint to use
const METRICS_ENDPOINT = '/orgsettings/metrics/';

export const useDashboardMetrics = () => {
    // Fetch raw data from the actual metrics endpoint
    const { data: rawData, loading, error } = useApiData(METRICS_ENDPOINT, []);

    // Memoize the data transformation
    const metrics = useMemo(() => {
        if (!rawData || Object.keys(rawData).length === 0) {
            return {
                organizationName: '',
                totalAssets: 0,
                assetsAssigned: 0,
                assetsAvailable: 0,
                pendingReturns: 0,
                overdueAssignments: 0,
                chartData: null,
            };
        }

        const orgName = rawData.organization_name || 'Organization';
        const totalAssets = rawData.total_assets || 0;
        const overdueAssignments = rawData.overdue_assignments || 0;

        // Extract status counts (Handle potential missing keys by defaulting to 0)
        const statusMetrics = rawData.metrics_by_status || {};
        const assetsAssigned = statusMetrics.Assigned || 0;
        const assetsAvailable = statusMetrics.Available || 0;
        // Note: The API doesn't explicitly return a 'Pending Return' count, 
        // so we'll estimate or rely on a known 'In Maintenance' or similar status.
        // For now, we'll use a placeholder/0 unless the API is expanded.
        const pendingReturns = statusMetrics["Pending Return"] || 0; 
        
        // --- Prepare Data for Chart.js ---
        const statusLabels = ['Assigned', 'Available', 'Pending Return'];
        const statusCounts = [assetsAssigned, assetsAvailable, pendingReturns];

        const chartData = {
            labels: statusLabels,
            datasets: [
                {
                    label: 'Asset Status Count',
                    data: statusCounts,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)', // Assigned (Blue)
                        'rgba(75, 192, 192, 0.7)', // Available (Green)
                        'rgba(255, 159, 64, 0.7)', // Pending Return (Orange)
                    ],
                    borderWidth: 1,
                },
            ],
        };

        return {
            organizationName: orgName,
            totalAssets,
            assetsAssigned,
            assetsAvailable,
            pendingReturns,
            overdueAssignments,
            chartData,
        };
    }, [rawData]);

    return { metrics, loading, error };
};