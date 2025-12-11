// import axios from "../api/axiosInstance.js";

// // --- Utility function to get the CSRF token from browser cookies (REQUIRED for Django POSTs) ---
// const getCSRFToken = () => {
//     const name = 'csrftoken';
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             // Does this cookie string begin with the name we want?
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 return decodeURIComponent(cookie.substring(name.length + 1));
//             }
//         }
//     }
//     return null;
// };
// // ----------------------------------------------------------------------------------------------


// /**
//  * 1. Uploads a raw file to the generic storage endpoint (/upload/)
//  * and returns the public URL of the uploaded file.
//  *
//  * @param {File} file - The file to upload
//  * @param {Function} onProgress - Optional callback for upload progress (0-100)
//  * @returns {Promise<string>} - The URL of the uploaded file
//  */
// export const uploadFileToStorage = async (file, onProgress) => {
//     try {
//         const formData = new FormData();
//         formData.append("file", file); // Generic storage backend expects key: 'file'

//         const csrfToken = getCSRFToken();
//         if (!csrfToken) {
//             throw new Error("CSRF token is missing. Cannot proceed with file upload.");
//         }

//         const response = await axios.post("/upload/", formData, {
//             // Must specify multipart/form-data and include CSRF token for security
//             headers: { 
//                 "Content-Type": "multipart/form-data",
//                 "X-CSRFToken": csrfToken // 🛑 Fixes the 403 Forbidden error
//             },
//             onUploadProgress: (event) => {
//                 if (onProgress && event.total) {
//                     const percent = Math.round((event.loaded * 100) / event.total);
//                     onProgress(percent);
//                 }
//             },
//         });

//         // The generic storage backend must return the URL in the 'url' key.
//         return response.data.url;
//     } catch (error) {
//         console.error("File upload to storage failed:", error);
//         throw error;
//     }
// };


// /**
//  * 2. Submits the file's URL to the specific assignment endpoint for fine proof validation.
//  *
//  * @param {string} fileUrl - The URL of the uploaded file
//  * @param {number} assignmentId - The ID of the assignment
//  * @returns {Promise<Object>} - The updated assignment data from the server
//  */
// export const submitFineProofUrl = async (fileUrl, assignmentId) => {
//     try {
//         if (!fileUrl) throw new Error("File URL is missing after upload.");
//         if (!assignmentId) throw new Error("Assignment ID is required.");

//         // This is a simple JSON POST request with the URL
//         const payload = { fine_proof_url: fileUrl };

//         const response = await axios.post(
//             `/assignments/${assignmentId}/upload-fine-proof/`,
//             payload
//             // Note: axios default headers (application/json) and JWT interceptor are used here.
//             // CSRF is generally handled via the default configuration for JSON posts, 
//             // but if issues persist, the CSRF token may need to be injected here as well.
//         );

//         return response.data; // Return the updated assignment
//     } catch (error) {
//         console.error("Fine proof URL submission failed:", error);
//         throw error;
//     }
// };

// // You can export both or just the main function needed by the modal
// export default { uploadFileToStorage, submitFineProofUrl };

import axios from "../api/axiosInstance.js";

/**
 * Uploads a file directly to the assignment fine-proof endpoint.
 *
 * Backend expects:
 * - multipart/form-data
 * - field name "proof_file"
 * - JWT (automatically handled by axios interceptor)
 *
 * @param {File} file - The file to upload
 * @param {number} assignmentId - ID of the assignment
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<string>} - The URL of the uploaded file from the API response
 */
export const uploadFileToAssignment = async (file, assignmentId, onProgress) => {
    if (!assignmentId) throw new Error("Assignment ID is required for file upload.");
    if (!file) throw new Error("No file provided.");

    try {
        const formData = new FormData();
        formData.append("proof_file", file); // MUST match backend field name

        const response = await axios.post(
            `/assignments/${assignmentId}/upload-fine-proof/`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (event) => {
                    if (onProgress && event.total) {
                        const percent = Math.round((event.loaded * 100) / event.total);
                        onProgress(percent);
                    }
                },
            }
        );

        const fileUrl = response.data.fine_proof_url;
        if (!fileUrl) throw new Error("File upload succeeded but no URL returned from server.");
        return fileUrl;

    } catch (error) {
        const errMsg = error.response?.data?.detail || error.message || "Could not upload file.";
        console.error("File upload to assignment failed:", errMsg);
        throw new Error(errMsg);
    }
};

export default { uploadFileToAssignment };
