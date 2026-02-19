"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    FaTrashAlt,
    FaUndo,
    FaChevronLeft,
    FaChevronRight,
    FaEye,
    FaExclamationTriangle,
    FaInfoCircle,
    FaCheckCircle,
    FaTimes,
    FaEllipsisH,
    FaFilter,
    FaTrash,
    FaEdit
} from "react-icons/fa";
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    startAfter
} from "firebase/firestore";
import Header from "./Header";
import TableUI from "./TableUI";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.log("Firebase already initialized or error:", error);
}

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="text-green-500" />;
            case 'error':
                return <FaExclamationTriangle className="text-red-500" />;
            default:
                return <FaInfoCircle className="text-blue-500" />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100 border-green-500 text-green-700';
            case 'error':
                return 'bg-red-100 border-red-500 text-red-700';
            default:
                return 'bg-blue-100 border-blue-500 text-blue-700';
        }
    };

    return (
        <div className={`fixed top-20 right-4 z-50 flex items-center p-4 border-l-4 rounded-lg shadow-lg ${getBackgroundColor()} animate-slide-in`}>
            <div className="flex items-center">
                {getIcon()}
                <p className="ml-3 text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">×</button>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "danger" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center mb-4">
                    <FaExclamationTriangle className={`text-xl mr-3 ${variant === 'danger' ? 'text-red-500' : 'text-blue-500'}`} />
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">{cancelText}</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg font-semibold transition-colors ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const DeletedOrdersPage = () => {
    const [deletedOrders, setDeletedOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ phone: "", address: "" });
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    const showToast = useCallback((message, type = "info") => {
        setToast({ show: true, message, type });
    }, []);

    const fetchDeletedOrders = useCallback(async () => {
        try {
            setIsLoading(true);

            // Get all deleted orders (isDelete: true)
            const q = query(
                collection(db, "bookorders"),
                where("isDelete", "==", true),
                orderBy("deletedAt", "desc")
            );

            const snapshot = await getDocs(q);
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Formatting for TableUI
            const formatted = orders.map(data => {
                const bookName = data.bookName || "Unknown Book";
                return {
                    ...data,
                    bookName: bookName,
                    name: data["नाम"] || data["उपनाम"] || "N/A",
                    phone: data["मोबाइल नंबर"] || "N/A",
                    address: data["એડ્રેસ/एड्रेस"] || data["एड्रेस"] || data["એડ્રેસ"] || "N/A",
                    city: data["शहर"] || "",
                    state: data["राज्य"] || "",
                    pincode: data["पिनकोड"] || "",
                    quantity: data["નકલ"] || 1,
                    timestamp: data.timestamp || data.createdAt || new Date().getTime(),
                };
            });

            setDeletedOrders(formatted);
            setTotalCount(formatted.length);
        } catch (error) {
            console.error("Error fetching deleted orders:", error);
            showToast("Failed to load deleted orders", "error");
        } finally {
            setIsLoading(false);
        }
    }, [db, showToast]);

    useEffect(() => {
        fetchDeletedOrders();
    }, [fetchDeletedOrders]);

    const handleRestoreOrder = async () => {
        if (!selectedOrder) return;
        try {
            await updateDoc(doc(db, "bookorders", selectedOrder.id), {
                isDelete: false,
                deletedAt: null
            });
            setDeletedOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
            showToast("Order restored successfully", "success");
            setShowRestoreModal(false);
        } catch (error) {
            console.error("Error restoring order:", error);
            showToast("Failed to restore order", "error");
        }
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        try {
            const orderRef = doc(db, "bookorders", selectedOrder.id);

            // Determine which keys were used for mobile and address in the original data
            const phoneKey = Object.keys(selectedOrder).find(key => key === "मोबाइल नंबर") || "मोबाइल नंबर";
            const addressKey = Object.keys(selectedOrder).find(key =>
                ["એડ્રેસ/एड्रेस", "एड्रेस", "એડ્રેસ"].includes(key)
            ) || "एड्रेस";

            const updateData = {
                [phoneKey]: editFormData.phone,
                [addressKey]: editFormData.address
            };

            await updateDoc(orderRef, updateData);

            setDeletedOrders(prev => prev.map(order =>
                order.id === selectedOrder.id
                    ? { ...order, ...updateData, phone: editFormData.phone, address: editFormData.address }
                    : order
            ));

            showToast("Order updated successfully", "success");
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating order:", error);
            showToast("Failed to update order", "error");
        }
    };

    const handleHardDeleteOrder = async () => {
        if (!selectedOrder) return;
        try {
            await deleteDoc(doc(db, "bookorders", selectedOrder.id));
            setDeletedOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
            showToast("Order permanently deleted", "success");
            setShowHardDeleteModal(false);
        } catch (error) {
            console.error("Error deleting order:", error);
            showToast("Failed to delete order", "error");
        }
    };

    const tableColumns = useMemo(() => [
        // { field: "timestamp", header: "Original Date" },
        { field: "deletedAt", header: "Deleted Date" },
        { field: "registrationId", header: "Order ID" },
        { field: "bookName", header: "Book" },
        { field: "name", header: "Name" },
        { field: "phone", header: "Phone" },
        { field: "address", header: "Address" },
        { field: "quantity", header: "Qty" }
    ], []);

    const actionButtons = useCallback((item) => (
        <div className="flex items-center justify-center space-x-2">
            <button onClick={() => { setSelectedOrder(item); setShowViewModal(true); }} className="p-1 text-blue-600 hover:text-blue-800" title="View"><FaEye size={14} /></button>
            <button onClick={() => {
                setSelectedOrder(item);
                setEditFormData({ phone: item.phone, address: item.address });
                setShowEditModal(true);
            }} className="p-1 text-orange-600 hover:text-orange-800" title="Edit"><FaEdit size={14} /></button>
            <button onClick={() => { setSelectedOrder(item); setShowRestoreModal(true); }} className="p-1 text-green-600 hover:text-green-800" title="Restore"><FaUndo size={14} /></button>
            <button onClick={() => { setSelectedOrder(item); setShowHardDeleteModal(true); }} className="p-1 text-red-600 hover:text-red-800" title="Permanent Delete"><FaTrashAlt size={14} /></button>
        </div>
    ), []);

    return (
        <div className="min-h-screen bg-background">
            <Header
                title="Recycling Bin"
                data={deletedOrders}
                filteredRecords={deletedOrders.length}
                totalCopies={deletedOrders.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
            />

            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

            <div className="p-0">
                <div className="bg-card rounded-md shadow-lg p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                            <FaTrash /> Deleted Orders
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            These orders can be restored or permanently removed.
                        </div>
                    </div>

                    <TableUI
                        data={deletedOrders}
                        loading={isLoading}
                        columns={tableColumns}
                        extraData={[]}
                        bookName="Deleted Orders"
                        filteredRecords={deletedOrders.length}
                        totalCopies={deletedOrders.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
                        actionButtons={actionButtons}
                        onRowClick={(item) => { setSelectedOrder(item); setShowViewModal(true); }}
                    />
                </div>
            </div>

            <ConfirmationModal
                isOpen={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                onConfirm={handleRestoreOrder}
                title="Restore Order"
                message="Are you sure you want to restore this order? It will appear back in the main list."
                confirmText="Restore"
                variant="info"
            />

            <ConfirmationModal
                isOpen={showHardDeleteModal}
                onClose={() => setShowHardDeleteModal(false)}
                onConfirm={handleHardDeleteOrder}
                title="Permanent Delete"
                message="WARNING: This action cannot be undone. This order will be permanently removed from the database."
                confirmText="Permanently Delete"
            />

            {/* Edit Modal */}
            {showEditModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold">Edit Deleted Order</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-semibold">Address:</label>
                                <textarea
                                    value={editFormData.address}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-semibold">Mobile Number:</label>
                                <input
                                    type="text"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600">Cancel</button>
                            <button onClick={handleUpdateOrder} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Update Order</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal Fragment */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold">Deleted Order Details</h2>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-bold text-blue-600 uppercase text-xs tracking-wider">Customer Info</h3>
                                <p><strong>Name:</strong> {selectedOrder.name}</p>
                                <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                                <p><strong>Address:</strong> {selectedOrder.address}</p>
                                <p><strong>Location:</strong> {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-bold text-red-600 uppercase text-xs tracking-wider">Deletion Info</h3>
                                <p><strong>Book:</strong> {selectedOrder.bookName}</p>
                                <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
                                <p><strong>Deleted On:</strong> {selectedOrder.deletedAt ? new Date(selectedOrder.deletedAt).toLocaleString() : "Unknown"}</p>
                                <p><strong>Original Date:</strong> {new Date(selectedOrder.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-8 pt-4 border-t">
                            <button onClick={() => setShowViewModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeletedOrdersPage;
