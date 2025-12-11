import React, { useState, useCallback } from 'react';
import { uploadFileToAssignment } from "../../utils/fileUploadHelper.js";
import { FaUpload, FaTimes, FaSpinner } from 'react-icons/fa';

// Component to handle the modal for fine payment proof submission
const EmployeeFinePaymentModal = ({ assignment, onClose, onSuccessfulUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const fineAmount = parseFloat(assignment.fine_amount || 0).toFixed(2);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
                setErrorMessage("Only JPEG, PNG, or PDF files are allowed.");
                event.target.value = null;
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setErrorMessage(null);
            setUploadProgress(0);
        }
    };

    const handleUploadProof = useCallback(async () => {
        if (!selectedFile) {
            setErrorMessage("Please select a file to upload as proof.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setErrorMessage(null);

        try {
            const uploadedFileUrl = await uploadFileToAssignment(selectedFile, assignment.id, (progress) => {
                setUploadProgress(progress);
            });

            if (!uploadedFileUrl) {
                throw new Error("Upload failed: No URL returned from server.");
            }

            onSuccessfulUpload(); // Close modal / refresh dashboard
        } catch (error) {
            console.error("File Upload Error:", error);
            setErrorMessage(error.response?.data?.detail || error.message || "Could not upload file.");
        } finally {
            setIsUploading(false);
            setUploadProgress(100);
        }
    }, [selectedFile, assignment.id, onSuccessfulUpload]);

    const overallLoading = isUploading;
    const isButtonDisabled = overallLoading || !selectedFile;

    let buttonText;
    if (isUploading) {
        buttonText = <><FaSpinner className="spinner" /> Uploading ({uploadProgress}%)</>;
    } else {
        buttonText = <><FaUpload /> Submit Proof</>;
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="header-secondary">💸 Submit Fine Payment Proof</h3>
                    <button className="btn-close" onClick={onClose} disabled={overallLoading}><FaTimes /></button>
                </div>

                <p className="text-large text-bold text-danger">Outstanding Fine: ${fineAmount}</p>
                <hr className="divider" />

                <p className="text-instructions">
                    Upload an image or PDF (receipt, bank transfer screenshot) proving payment of this fine.
                </p>

                <div className="form-group">
                    <label htmlFor="proof-file" className="label-file-upload">
                        {selectedFile ? `File Selected: ${selectedFile.name}` : 'Select Proof File'}
                    </label>
                    <input
                        type="file"
                        id="proof-file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="input-file"
                        disabled={overallLoading}
                    />
                </div>

                {isUploading && (
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                            {uploadProgress}%
                        </div>
                    </div>
                )}

                {errorMessage && <p className="text-error">{errorMessage}</p>}

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary" disabled={overallLoading}>
                        Cancel
                    </button>
                    <button onClick={handleUploadProof} className="btn-primary" disabled={isButtonDisabled}>
                        {buttonText}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-backdrop {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white; padding: 25px; border-radius: 8px;
                    width: 90%; max-width: 450px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                .btn-close { background: none; border: none; font-size: 18px; color: #666; cursor: pointer; }
                .divider { margin: 15px 0; border: none; border-top: 1px solid #f0f0f0; }
                .text-instructions { font-size: 14px; color: #555; margin-bottom: 20px; }
                .label-file-upload { display: block; font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 5px; }
                .input-file { display: block; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; width: 100%; box-sizing: border-box; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .text-error { color: #dc2626; font-size: 13px; margin-top: 10px; background: #fee2e2; padding: 6px 10px; border-radius: 4px; }

                .progress-bar-container { width: 100%; background-color: #e5e7eb; border-radius: 4px; margin-top: 10px; }
                .progress-bar { height: 15px; background-color: #22c55e; border-radius: 4px; transition: width 0.3s; text-align: center; color: white; font-size: 10px; line-height: 15px; }

                .spinner { animation: spin 1s linear infinite; margin-right: 5px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default EmployeeFinePaymentModal;
