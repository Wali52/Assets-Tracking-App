// /* src/components/DeleteConfirmationModal.jsx */
// import React from 'react';
// import useApiAction from "../hooks/useApiAction.js";
// import { LoadingSpinner } from "../layouts/DashboardLayout.jsx"; 

// const DeleteConfirmationModal = ({ id, name, urlSegment, onClose, onSuccess }) => {
    
//     // Hook for handling the DELETE API call
//     const { 
//         loading: submitting, 
//         error: actionError, 
//         execute 
//     } = useApiAction();

//     const handleDelete = async () => {
//         const url = `/${urlSegment}/${id}/`; // e.g., /assets/916/
//         const method = "DELETE";

//         const result = await execute(url, method);

//         if (result) {
//             onSuccess(); // Trigger data refresh in the parent component
//             onClose(); // Close the modal
//         }
//     };
    
//     return (
//         <div className="modal-backdrop">
//             <div className="modal-content modal-small">
//                 <h2 className="modal-title text-danger">
//                     Confirm Deletion
//                 </h2>
                
//                 {/* Error Display */}
//                 {actionError && (
//                     <div className="error-message">
//                         Error: {actionError.message || actionError}
//                     </div>
//                 )}

//                 <p className="modal-body-text">
//                     Are you sure you want to permanently delete **{name} (ID: {id})**?
//                     <br />
//                     This action cannot be undone.
//                 </p>

//                 {/* Action Buttons */}
//                 <div className="button-group justify-end">
//                     <button
//                         type="button"
//                         onClick={onClose}
//                         disabled={submitting}
//                         className="button button-secondary"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         type="button"
//                         onClick={handleDelete}
//                         disabled={submitting}
//                         className={`button button-danger ${submitting ? 'button-submitting' : ''}`}
//                     >
//                         {submitting ? 'Deleting...' : "Delete"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default DeleteConfirmationModal;

// // Note: Ensure your global CSS includes styling for .modal-backdrop, .modal-content, 
// // .button-danger, .button-secondary, and .button-submitting.


/* src/components/DeleteConfirmationModal.jsx */
import React from 'react';
import useApiAction from "../hooks/useApiAction.js";
import { LoadingSpinner } from "../layouts/DashboardLayout.jsx"; 

const DeleteConfirmationModal = ({ 
    id, 
    name, 
    urlSegment, 
    onClose, 
    onSuccess, 
    
    // ⭐ NEW PROPS FOR CUSTOM ACTIONS (Return Asset)
    onConfirm,      // Custom function to run instead of DELETE
    title,          // Custom title (e.g., "Confirm Asset Return")
    body,           // Custom body text
    confirmText,    // Custom confirm button text (e.g., "Yes, Return Asset")
}) => {
    
    // Hook for handling the API call
    const { 
        loading: submitting, 
        error: actionError, 
        execute 
    } = useApiAction();

    // ⭐ RENAMED: handleConfirm now handles both DELETE and custom actions
    const handleConfirm = async () => {
        // --- 1. Custom Action Override ---
        // If an onConfirm function is provided, run it instead of the default DELETE
        if (onConfirm) {
            // Note: The custom onConfirm function (executeMarkAsReturned in the parent) 
            // is responsible for calling handleClose() / onSuccess().
            await onConfirm(); 
            return; // Stop here, do not run default DELETE logic
        }

        // --- 2. Default DELETE Action ---
        if (!urlSegment || !id) {
            // This case should not be hit if the component is used correctly for deletion.
            console.error("DeleteConfirmationModal: Missing urlSegment or id for deletion.");
            return;
        }

        const url = `/${urlSegment}/${id}/`; // e.g., /assets/916/
        const method = "DELETE";

        const result = await execute(url, method);

        if (result) {
            onSuccess(); // Trigger data refresh in the parent component
            onClose(); // Close the modal
        }
    };
    
    // --- Content Customization ---
    // If custom text props are passed, use them. Otherwise, use deletion defaults.
    const modalTitle = title || "Confirm Deletion";
    const modalBody = body || (
        <>
            Are you sure you want to permanently delete **{name} (ID: {id})**?
            <br />
            This action cannot be undone.
        </>
    );
    const confirmButtonText = confirmText || "Delete";
    const confirmButtonClass = confirmText ? "button button-primary" : "button button-danger"; // Use primary for general actions, danger for delete
    
    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-small">
                <h2 className={`modal-title ${onConfirm ? 'text-primary' : 'text-danger'}`}>
                    {modalTitle}
                </h2>
                
                {/* Error Display */}
                {actionError && (
                    <div className="error-message">
                        Error: {actionError.message || actionError}
                    </div>
                )}

                <p className="modal-body-text">
                    {modalBody}
                </p>

                {/* Action Buttons */}
                <div className="button-group justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="button button-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm} // ⭐ CALL THE NEW CONFIRM HANDLER
                        disabled={submitting}
                        className={`${confirmButtonClass} ${submitting ? 'button-submitting' : ''}`}
                    >
                        {submitting ? <LoadingSpinner size="spinner-sm" /> : confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;