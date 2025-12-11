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
