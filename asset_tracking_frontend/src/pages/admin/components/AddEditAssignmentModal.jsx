// /* src/components/AddEditAssignmentModal.jsx */
// import React, { useState, useEffect } from "react";
// import useApiAction from "../hooks/useApiAction.js";
// import { useApiData } from "../hooks/useApiData.js";
// import { LoadingSpinner } from "../layouts/DashboardLayout.jsx"; 
// import { useAuth } from "../context/AuthContext.jsx"; 
// import moment from "moment"; // Assuming you have moment.js or similar for date handling

// const AddEditAssignmentModal = ({ assignment, onClose, onSuccess }) => {
    
//     // --- Context and Mode ---
//     const isEditing = !!assignment;
//     const { currentUser, organizationData } = useAuth(); 

//     // Extracting user/org IDs from context
//     // Assuming organizationData is the string tag for the organization field
//     const currentOrganizationTag = organizationData; 
//     const currentAssignedByUserId = currentUser?.id || 0; 
    
//     // --- Data Fetching for Dropdowns ---
//     // Fetch available assets (Assets not currently assigned)
//     const { 
//         data: assets, 
//         loading: loadingAssets, 
//         error: assetsError 
//     } = useApiData("assets/?status=Available", [], []); 
    
//     // Fetch all employees
//     const { 
//         data: employees, 
//         loading: loadingEmployees, 
//         error: employeesError 
//     } = useApiData("users/", [], []); 

//     // --- State for the form data ---
//     // Note: API requires 'asset' and 'employee' as IDs, 'status' as string.
//     const [formData, setFormData] = useState({
//         // IDs for Asset and Employee (converted to string for select value)
//         asset: assignment?.asset?.toString() || "", 
//         employee: assignment?.employee?.toString() || "", 
        
//         // Dates (formatted for HTML date input)
//         assigned_date: assignment?.assigned_date || moment().format('YYYY-MM-DD'),
//         due_date: assignment?.due_date || "", // Optional
//         returned_date: assignment?.returned_date || "", // Optional
        
//         status: assignment?.status || "Active", 
        
//         // Context data (will be updated in useEffect for creation)
//         assigned_by_user: isEditing ? assignment.assigned_by_user : 0, 
//         organization: isEditing ? (assignment.organization || null) : null,
//     });

//     // --- Effect to populate IDs for POST ---
//     useEffect(() => {
//         // Only populate auth IDs if creating a new assignment and data is ready
//         if (!isEditing && currentAssignedByUserId > 0 && currentOrganizationTag) {
//             setFormData(prev => ({
//                 ...prev,
//                 organization: currentOrganizationTag, // String Tag
//                 assigned_by_user: currentAssignedByUserId, // Integer ID
//             }));
//         } 
//     }, [isEditing, currentAssignedByUserId, currentOrganizationTag]);
    
//     // --- API Action Hook ---
//     const { 
//         loading: submitting, 
//         error: actionError, 
//         execute 
//     } = useApiAction();

//     // --- Handlers ---

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         if (formData.assigned_by_user === 0 || !formData.organization) {
//             alert("Error: User or Organization data is missing. Please wait for data to load or re-login.");
//             return;
//         }

//         let url = "/assignments/";
//         let method = "POST";

//         if (isEditing) {
//             url = `/assignments/${assignment.id}/`;
//             method = "PATCH";
//         }
        
//         // Clean and prepare payload for API
//         const payload = { 
//             ...formData, 
//             // Convert select box strings back to integers
//             asset: formData.asset ? parseInt(formData.asset) : null,
//             employee: formData.employee ? parseInt(formData.employee) : null,
//             assigned_by_user: parseInt(formData.assigned_by_user), 
            
//             // Set required POST fields if missing/empty string
//             due_date: formData.due_date || null,
//             returned_date: formData.returned_date || null,
            
//             // Ensure organization is sent as the string tag
//             organization: formData.organization, 
//         };

//         // For PATCH, only send fields that are allowed to be updated if necessary
//         // In this case, sending the whole payload is fine for Django REST Framework PATCH.

//         const result = await execute(url, method, payload);

//         if (result) {
//             onSuccess(); 
//             onClose(); 
//         }
//     };
    
//     // --- Conditional Rendering Logic ---
//     const currentError = assetsError || employeesError || actionError;
//     const loadingData = loadingAssets || loadingEmployees;
    
//     // Ready check: Need IDs for POST. For EDIT, we assume we have them from the 'assignment' prop.
//     const isReadyToRenderForm = isEditing 
//         ? true 
//         : (currentAssignedByUserId > 0 && !!currentOrganizationTag);
        
//     // --- Rendering ---
//     return (
//         <div className="modal-backdrop">
//             <div className="modal-content">
//                 <h2 className="modal-title">
//                     {isEditing ? `Edit Assignment (Asset: ${assignment.asset_tag})` : "Assign New Asset"}
//                 </h2>
                
//                 {/* Error Display */}
//                 {currentError && (
//                     <div className="error-message">
//                         Error: {currentError.message || JSON.stringify(currentError)}
//                     </div>
//                 )}
                
//                 {loadingData || !isReadyToRenderForm ? (
//                     <div className="modal-loading">
//                         <LoadingSpinner size="spinner-md" />
//                         <p className="loading-text">Loading Assets and Employees...</p>
//                     </div>
//                 ) : (
//                     <form onSubmit={handleSubmit} className="form-container">
                        
//                         {/* EMPLOYEE DROP-DOWN */}
//                         <div>
//                             <label className="label">Employee</label>
//                             <select
//                                 name="employee" 
//                                 value={formData.employee}
//                                 onChange={handleChange}
//                                 required
//                                 className="input-field select-field"
//                             >
//                                 <option value="">Select Employee</option>
//                                     {employees.map(emp => (
//                                     <option key={emp.id} value={emp.id}>
//                                     {`${emp.first_name} ${emp.last_name}`}
//                                 </option>
//                                  ))}
//                             </select>
//                         </div>
                        
//                         {/* ASSET DROP-DOWN */}
//                         <div>
//                             <label className="label">Asset</label>
//                             <select
//                                 name="asset" 
//                                 value={formData.asset}
//                                 onChange={handleChange}
//                                 required
//                                 className="input-field select-field"
//                                 // Disable asset selection during edit to prevent accidental reassignment
//                                 disabled={isEditing} 
//                             >
//                                 <option value="">Select an Asset</option>
//                                 {/* In Edit mode, include the currently assigned asset as an option */}
//                                 {isEditing && (
//                                     <option value={assignment.asset}>
//                                         {assignment.asset_tag} (Current)
//                                     </option>
//                                 )}
//                                 {/* List available assets for POST, or available *and* current for PATCH */}
//                                 {assets.map(asset => (
//                                     <option key={asset.id} value={asset.id}>
//                                         {asset.asset_tag} - {asset.name}
//                                     </option>
//                                 ))}
//                             </select>
//                             {isEditing && (
//                                 <p className="warning-text">Asset cannot be changed after assignment.</p>
//                             )}
//                         </div>

//                         {/* ASSIGNED DATE */}
//                         <div>
//                             <label className="label">Assigned Date</label>
//                             <input
//                                 type="date"
//                                 name="assigned_date"
//                                 value={formData.assigned_date}
//                                 onChange={handleChange}
//                                 required
//                                 className="input-field"
//                             />
//                         </div>

//                         {/* DUE DATE */}
//                         <div>
//                             <label className="label">Due Date (Optional)</label>
//                             <input
//                                 type="date"
//                                 name="due_date"
//                                 value={formData.due_date}
//                                 onChange={handleChange}
//                                 className="input-field"
//                             />
//                         </div>
                        
//                         {/* STATUS AND RETURNED DATE (For Editing Only) */}
//                         {isEditing && (
//                             <>
//                                 {/* STATUS */}
//                                 <div>
//                                     <label className="label">Status</label>
//                                     <select
//                                         name="status"
//                                         value={formData.status}
//                                         onChange={handleChange}
//                                         className="input-field select-field"
//                                     >
//                                         <option value="Active">Active</option>
//                                         <option value="Returned">Returned</option>
//                                         <option value="Overdue">Overdue</option>
//                                     </select>
//                                 </div>

//                                 {/* RETURNED DATE (Only visible/required if Status is Returned) */}
//                                 {formData.status === 'Returned' && (
//                                     <div>
//                                         <label className="label">Returned Date</label>
//                                         <input
//                                             type="date"
//                                             name="returned_date"
//                                             value={formData.returned_date || moment().format('YYYY-MM-DD')}
//                                             onChange={handleChange}
//                                             required
//                                             className="input-field"
//                                         />
//                                     </div>
//                                 )}
//                             </>
//                         )}


//                         {/* Action Buttons */}
//                         <div className="button-group">
//                             <button
//                                 type="button"
//                                 onClick={onClose}
//                                 disabled={submitting}
//                                 className="button button-secondary"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 type="submit"
//                                 disabled={submitting || employees.length === 0} // Cannot submit without employees
//                                 className={`button ${submitting ? 'button-submitting' : 'button-primary'}`}
//                             >
//                                 {submitting ? 'Saving...' : (isEditing ? "Save Changes" : "Assign Asset")}
//                             </button>
//                         </div>
//                     </form>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default AddEditAssignmentModal;
/* src/components/AddEditAssignmentModal.jsx */
import React, { useState, useEffect } from "react";
import useApiAction from "../../../hooks/useApiAction.js";
import { useApiData } from "../../../hooks/useApiData.js";
import { LoadingSpinner } from "../../../layouts/DashboardLayout.jsx"; 
import { useAuth } from "../../../context/AuthContext.jsx"; 
import moment from "moment"; // Assuming you have moment.js or similar for date handling

const AddEditAssignmentModal = ({ assignment, onClose, onSuccess }) => {
    
    // --- Context and Mode ---
    const isEditing = !!assignment;
    const { currentUser, organizationData } = useAuth(); 

    // Extracting user/org IDs from context
    // Assuming organizationData is the string tag for the organization field
    const currentOrganizationTag = organizationData; 
    const currentAssignedByUserId = currentUser?.id || 0; 
    
    // --- Data Fetching for Dropdowns ---
    // Fetch available assets (Assets not currently assigned)
    const { 
        data: assets, 
        loading: loadingAssets, 
        error: assetsError 
    } = useApiData("assets/?status=Available", [], []); 
    
    // Fetch all employees
    const { 
        data: employees, 
        loading: loadingEmployees, 
        error: employeesError 
    } = useApiData("users/", [], []); 

    // --- State for the form data ---
    // Note: API requires 'asset' and 'employee' as IDs, 'status' as string.
    const [formData, setFormData] = useState({
        // IDs for Asset and Employee (converted to string for select value)
        asset: assignment?.asset?.toString() || "", 
        employee: assignment?.employee?.toString() || "", 
        
        // Dates (formatted for HTML date input)
        assigned_date: assignment?.assigned_date || moment().format('YYYY-MM-DD'),
        due_date: assignment?.due_date || "", // Optional
        
        // ⭐ CHANGE 1a: Initialize returned_date correctly
        returned_date: assignment?.returned_date || "", 
        
        status: assignment?.status || "Active", 
        
        // Context data (will be updated in useEffect for creation)
        assigned_by_user: isEditing ? assignment.assigned_by_user : 0, 
        organization: isEditing ? (assignment.organization || null) : null,
    });

    // --- Effect to populate IDs for POST ---
    useEffect(() => {
        // Only populate auth IDs if creating a new assignment and data is ready
        if (!isEditing && currentAssignedByUserId > 0 && currentOrganizationTag) {
            setFormData(prev => ({
                ...prev,
                organization: currentOrganizationTag, // String Tag
                assigned_by_user: currentAssignedByUserId, // Integer ID
            }));
        } 
    }, [isEditing, currentAssignedByUserId, currentOrganizationTag]);
    
    // --- API Action Hook ---
    const { 
        loading: submitting, 
        error: actionError, 
        execute 
    } = useApiAction();

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.assigned_by_user === 0 || !formData.organization) {
            alert("Error: User or Organization data is missing. Please wait for data to load or re-login.");
            return;
        }

        let url = "/assignments/";
        let method = "POST";

        if (isEditing) {
            url = `/assignments/${assignment.id}/`;
            method = "PATCH";
        }
        
        // Clean and prepare payload for API
        const basePayload = { 
            ...formData, 
            // Convert select box strings back to integers
            asset: formData.asset ? parseInt(formData.asset) : null,
            employee: formData.employee ? parseInt(formData.employee) : null,
            assigned_by_user: parseInt(formData.assigned_by_user), 
            
            // Set required POST fields if missing/empty string
            due_date: formData.due_date || null,
            
            // ⭐ CHANGE 2: Conditional returned_date logic for payload
            returned_date: formData.status === 'Returned' 
                ? formData.returned_date // Send the date if status is set to Returned
                : null, // Otherwise, send null
            
            // Ensure organization is sent as the string tag
            organization: formData.organization, 
        };

        // Remove the original string-based IDs which were used for select/form state
        delete basePayload.asset_tag; 
        delete basePayload.employee_name;

        const result = await execute(url, method, basePayload);

        if (result) {
            onSuccess(); 
            onClose(); 
        }
    };
    
    // --- Conditional Rendering Logic ---
    const currentError = assetsError || employeesError || actionError;
    const loadingData = loadingAssets || loadingEmployees;
    
    // Ready check: Need IDs for POST. For EDIT, we assume we have them from the 'assignment' prop.
    const isReadyToRenderForm = isEditing 
        ? true 
        : (currentAssignedByUserId > 0 && !!currentOrganizationTag);
        
    // --- Rendering ---
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2 className="modal-title">
                    {isEditing ? `Edit Assignment (Asset: ${assignment.asset_tag})` : "Assign New Asset"}
                </h2>
                
                {/* Error Display */}
                {currentError && (
                    <div className="error-message">
                        Error: {currentError.message || JSON.stringify(currentError)}
                    </div>
                )}
                
                {loadingData || !isReadyToRenderForm ? (
                    <div className="modal-loading">
                        <LoadingSpinner size="spinner-md" />
                        <p className="loading-text">Loading Assets and Employees...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="form-container">
                        
                        {/* EMPLOYEE DROP-DOWN */}
                        <div>
                            <label className="label">Employee</label>
                            <select
                                name="employee" 
                                value={formData.employee}
                                onChange={handleChange}
                                required
                                className="input-field select-field"
                            >
                                <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {/* ⭐ CHANGE 1b: Use first_name and last_name for display */}
                                        {`${emp.first_name} ${emp.last_name}`}
                                    </option>
                                 ))}
                            </select>
                        </div>
                        
                        {/* ASSET DROP-DOWN */}
                        <div>
                            <label className="label">Asset</label>
                            <select
                                name="asset" 
                                value={formData.asset}
                                onChange={handleChange}
                                required
                                className="input-field select-field"
                                // Disable asset selection during edit to prevent accidental reassignment
                                disabled={isEditing} 
                            >
                                <option value="">Select an Asset</option>
                                {/* In Edit mode, include the currently assigned asset as an option */}
                                {isEditing && (
                                    <option value={assignment.asset}>
                                        {assignment.asset_tag} (Current)
                                    </option>
                                )}
                                {/* List available assets for POST, or available *and* current for PATCH */}
                                {assets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.asset_tag} - {asset.name}
                                    </option>
                                ))}
                            </select>
                            {isEditing && (
                                <p className="warning-text">Asset cannot be changed after assignment.</p>
                            )}
                        </div>

                        {/* ASSIGNED DATE */}
                        <div>
                            <label className="label">Assigned Date</label>
                            <input
                                type="date"
                                name="assigned_date"
                                value={formData.assigned_date}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>

                        {/* DUE DATE */}
                        <div>
                            <label className="label">Due Date (Optional)</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>
                        
                        {/* STATUS AND RETURNED DATE (For Editing Only) */}
                        {isEditing && (
                            <>
                                {/* STATUS */}
                                <div>
                                    <label className="label">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="input-field select-field"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Returned">Returned</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>

                                {/* RETURNED DATE (Only visible/required if Status is Returned) */}
                                {formData.status === 'Returned' && (
                                    <div>
                                        <label className="label">Returned Date</label>
                                        <input
                                            type="date"
                                            name="returned_date"
                                            // If editing, use the saved date; otherwise, default to today for convenience
                                            value={formData.returned_date || moment().format('YYYY-MM-DD')}
                                            onChange={handleChange}
                                            required
                                            className="input-field"
                                        />
                                    </div>
                                )}
                            </>
                        )}


                        {/* Action Buttons */}
                        <div className="button-group">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="button button-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || employees.length === 0} // Cannot submit without employees
                                className={`button ${submitting ? 'button-submitting' : 'button-primary'}`}
                            >
                                {submitting ? 'Saving...' : (isEditing ? "Save Changes" : "Assign Asset")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddEditAssignmentModal;