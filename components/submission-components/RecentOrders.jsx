"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  FaShoppingBag, 
  FaTruck, 
  FaClock, 
  FaChevronLeft, 
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaEye,
  FaBox,
  FaShippingFast,
  FaHandshake,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc,
  doc,
  deleteDoc,
  Timestamp
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
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
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
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div className={`fixed top-0 right-4 z-50 flex items-center p-4 border-l-4 rounded-lg shadow-lg ${getBackgroundColor()} animate-slide-in`}>
      <div className="flex items-center">
        {getIcon()}
        <p className="ml-3 text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-yellow-500 text-xl mr-3" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const RecentOrdersPage = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(15);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [deliveryTypeFormData, setDeliveryTypeFormData] = useState({
    deliveryType: "",
    trackingId: ""
  });

  // Show toast function
  const showToast = useCallback((message, type = "info") => {
    setToast({ show: true, message, type });
  }, []);

  // Hide toast function
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // Memoized format functions
  const formatDisplayName = useCallback((bookName) => {
    if (bookName.includes("calendar")) {
      return bookName.replace("calendar", "Panchang ");
    }
    return bookName
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }, []);

  // Load recent orders
  const loadRecentOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!db) {
        throw new Error("Firebase is not initialized");
      }

      const ordersCollection = collection(db, "bookorders");
      const q = query(
        ordersCollection,
        orderBy("timestamp", "desc"),
        limit(100)
      );
      
      const snapshot = await getDocs(q);

      if (snapshot.size === 0) {
        setRecentOrders([]);
        return;
      }

      const orders = snapshot.docs.map((doc) => {
        const data = doc.data();
        const bookName = data.bookName || "Unknown Book";

        return {
          id: doc.id,
          bookName: formatDisplayName(bookName),
          rawBookName: bookName,
          name: data["नाम"] || data["उपनाम"] || "N/A",
          phone: data["मोबाइल नंबर"] || "N/A",
          address: data["એડ્રેસ/एड्रेस"] || data["एड्रेस"] || "N/A",
          city: data["शहर"] || "",
          state: data["राज्य"] || "",
          pincode: data["पिनकोड"] || "",
          quantity: data["નકલ"] || 1,
          parcelId: data.parcelId || "",
          courierId: data.courierId || "",
          deliveryType: data.deliveryType || "",
          deliveredDate: data.deliveredDate || "",
          isShipped: !!(data.parcelId && data.parcelId.trim() !== ""),
          isDelivered: !!data.deliveredDate,
          timestamp: data.timestamp || data.migratedAt || data.createdAt || new Date().getTime(),
          book_quantities: data.book_quantities || {},
          ...data
        };
      });

      setRecentOrders(orders);
      showToast("Orders loaded successfully", "success");
    } catch (error) {
      console.error("Error loading orders:", error);
      const errorMessage = error.message || "Failed to load orders";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }, [formatDisplayName, showToast]);

  useEffect(() => {
    loadRecentOrders();
  }, [loadRecentOrders]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  // Filter orders based on selection
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order) => {
      if (selectedFilter === "shipped") return order.isShipped && !order.isDelivered;
      if (selectedFilter === "delivered") return order.isDelivered;
      if (selectedFilter === "pending") return !order.isShipped && !order.isDelivered;
      return true;
    });
  }, [recentOrders, selectedFilter]);

  // Pagination calculations
  const { currentOrders, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    
    return { currentOrders, totalPages };
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Stats
  const stats = useMemo(() => ({
    total: recentOrders.length,
    shipped: recentOrders.filter((o) => o.isShipped && !o.isDelivered).length,
    delivered: recentOrders.filter((o) => o.isDelivered).length,
    pending: recentOrders.filter((o) => !o.isShipped && !o.isDelivered).length,
  }), [recentOrders]);

  // Action handlers
  const handleViewOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  }, []);

  const handleSetDeliveryType = useCallback((order) => {
    setSelectedOrder(order);
    setDeliveryTypeFormData({
      deliveryType: order.deliveryType || "",
      trackingId: order.parcelId || order.courierId || ""
    });
    setShowDeliveryTypeModal(true);
  }, []);

  const handleDeleteClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrder) return;

    try {
      await deleteDoc(doc(db, "bookorders", selectedOrder.id));
      setRecentOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      showToast("Order deleted successfully", "success");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("Failed to delete order", "error");
    }
  }, [selectedOrder, db, showToast]);

  // Bulk mark as delivered (like in TableUI) - FIXED VERSION
  const handleMarkAsDelivered = useCallback(async (selectedItems, deliveryDate) => {
    try {
      const updatePromises = selectedItems.map(async (item) => {
        const orderRef = doc(db, "bookorders", item.id);
        await updateDoc(orderRef, {
          deliveredDate: deliveryDate, // Fixed: using deliveryDate parameter
          isDelivered: true
        });
      });

      await Promise.all(updatePromises);

      setRecentOrders(prev => prev.map(order => {
        const selectedItem = selectedItems.find(item => item.id === order.id);
        if (selectedItem) {
          return { 
            ...order, 
            deliveredDate: deliveryDate, // Fixed: using deliveryDate parameter
            isDelivered: true 
          };
        }
        return order;
      }));

      showToast(`${selectedItems.length} order(s) marked as delivered`, "success");
    } catch (error) {
      console.error("Error marking orders as delivered:", error);
      showToast("Failed to mark orders as delivered", "error");
    }
  }, [db, showToast]);

  // Update delivery type only (separate from delivery date)
  const handleUpdateDeliveryType = useCallback(async () => {
    try {
      const orderRef = doc(db, "bookorders", selectedOrder.id);
      const updateData = {
        deliveryType: deliveryTypeFormData.deliveryType
      };

      // Set tracking IDs based on delivery type
      if (deliveryTypeFormData.deliveryType === "parcelId") {
        updateData.parcelId = deliveryTypeFormData.trackingId;
        updateData.courierId = ""; // Clear courier ID
        updateData.isShipped = true;
      } else if (deliveryTypeFormData.deliveryType === "courierId") {
        updateData.courierId = deliveryTypeFormData.trackingId;
        updateData.parcelId = ""; // Clear parcel ID
        updateData.isShipped = true;
      } else if (deliveryTypeFormData.deliveryType === "handtohand") {
        updateData.parcelId = "";
        updateData.courierId = "";
        updateData.isShipped = true;
      } else {
        // If delivery type is empty, mark as not shipped
        updateData.isShipped = false;
      }

      await updateDoc(orderRef, updateData);

      // Update local state
      setRecentOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              ...updateData,
              parcelId: deliveryTypeFormData.deliveryType === "parcelId" ? deliveryTypeFormData.trackingId : "",
              courierId: deliveryTypeFormData.deliveryType === "courierId" ? deliveryTypeFormData.trackingId : ""
            }
          : order
      ));

      setShowDeliveryTypeModal(false);
      showToast("Delivery type updated successfully", "success");
    } catch (error) {
      console.error("Error updating delivery type:", error);
      showToast("Failed to update delivery type", "error");
    }
  }, [selectedOrder, deliveryTypeFormData, db, showToast]);

  // Table columns configuration
  const tableColumns = useMemo(() => [
    { field: "timestamp", header: "Date" },
    { field: "bookName", header: "Book" },
    { field: "name", header: "Name" },
    { field: "phone", header: "Phone" },
    { field: "address", header: "Address" },
    { field: "city", header: "City" },
    { field: "state", header: "State" },
    { field: "pincode", header: "Pincode" },
    { field: "quantity", header: "Qty" },
    { field: "deliveryType", header: "Delivery Type" },
    { field: "parcelId", header: "Tracking ID" },
    { field: "deliveredDate", header: "Delivered Date" }
  ], []);

  // Action buttons for table
  const actionButtons = useCallback((item, rowIndex) => (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => handleViewOrder(item)}
        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
        title="View Order"
      >
        <FaEye size={14} />
      </button>
      <button
        onClick={() => handleSetDeliveryType(item)}
        className="p-1 text-gray-700 hover:text-gray-800 transition-colors"
        title="Set Delivery Type"
      >
        <FaEdit size={14} />
      </button>
      <button
        onClick={() => handleDeleteClick(item)}
        className="p-1 text-red-600 hover:text-red-800 transition-colors"
        title="Delete Order"
      >
        <FaTrash size={14} />
      </button>
    </div>
  ), [handleViewOrder, handleSetDeliveryType, handleDeleteClick]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setSelectedFilter(filter);
  }, []);

  const handleOrdersPerPageChange = useCallback((value) => {
    setOrdersPerPage(value);
    setCurrentPage(1);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex mt-10 items-center justify-center bg-background">
        <div className="bg-red-100 dark:bg-red-900/20 p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadRecentOrders}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <div className="p-2 md:p-4">
        <div className="bg-card rounded-md shadow-lg p-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              All Orders ({stats.total})
            </button>
            <button
              onClick={() => handleFilterChange("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <FaClock className="inline mr-1" />
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => handleFilterChange("shipped")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "shipped"
                  ? "bg-orange-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <FaTruck className="inline mr-1" />
              Shipped ({stats.shipped})
            </button>
            <button
              onClick={() => handleFilterChange("delivered")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "delivered"
                  ? "bg-green-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <FaBox className="inline mr-1" />
              Delivered ({stats.delivered})
            </button>

            {/* Orders per page selector */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={ordersPerPage}
                onChange={(e) => handleOrdersPerPageChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm bg-muted text-foreground border border-border"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <TableUI
            data={currentOrders}
            loading={isLoading}
            columns={tableColumns}
            extraData={[]}
            bookName="Recent Orders"
            filteredRecords={filteredOrders.length}
            totalCopies={filteredOrders.reduce((sum, order) => sum + (order.quantity || 1), 0)}
            actionButtons={actionButtons}
            onMarkDelivered={handleMarkAsDelivered}
            onRowClick={handleViewOrder}
          />

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(ordersPerPage, currentOrders.length)} of {filteredOrders.length} orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <FaChevronLeft />
                </button>

                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <FaChevronRight />
                </button>
              </div>

              <select
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm bg-background text-foreground border border-border"
              >
                {[...Array(totalPages)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-lg border-b pb-2">Customer Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedOrder.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                  <p><strong>Address:</strong> {selectedOrder.address}</p>
                  <p><strong>City:</strong> {selectedOrder.city}</p>
                  <p><strong>State:</strong> {selectedOrder.state}</p>
                  <p><strong>Pincode:</strong> {selectedOrder.pincode}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg border-b pb-2">Order Information</h3>
                <div className="space-y-2">
                  <p><strong>Book:</strong> {selectedOrder.bookName}</p>
                  <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.timestamp).toLocaleDateString()}</p>
                  <p><strong>Delivery Type:</strong> {selectedOrder.deliveryType || "Not set"}</p>
                  <p><strong>Tracking ID:</strong> {selectedOrder.parcelId || selectedOrder.courierId || "Not set"}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedOrder.isDelivered 
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : selectedOrder.isShipped
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                      {selectedOrder.isDelivered ? "Delivered" : selectedOrder.isShipped ? "Shipped" : "Pending"}
                    </span>
                  </p>
                  <p><strong>Delivered Date:</strong> {selectedOrder.deliveredDate ? new Date(selectedOrder.deliveredDate).toLocaleDateString() : "Not delivered"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Type Modal */}
      {showDeliveryTypeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Set Delivery Type</h2>
              <button
                onClick={() => setShowDeliveryTypeModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold">Delivery Type:</label>
                <select
                  value={deliveryTypeFormData.deliveryType}
                  onChange={(e) => setDeliveryTypeFormData(prev => ({ 
                    ...prev, 
                    deliveryType: e.target.value,
                    trackingId: e.target.value === "handtohand" ? "" : prev.trackingId
                  }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Delivery Type</option>
                  <option value="handtohand">Hand to Hand</option>
                  <option value="parcelId">Parcel</option>
                  <option value="courierId">Courier</option>
                </select>
              </div>
              {(deliveryTypeFormData.deliveryType === "parcelId" || deliveryTypeFormData.deliveryType === "courierId") && (
                <div>
                  <label className="block mb-2 font-semibold">
                    {deliveryTypeFormData.deliveryType === "parcelId" ? "Parcel ID:" : "Courier ID:"}
                  </label>
                  <input
                    type="text"
                    value={deliveryTypeFormData.trackingId}
                    onChange={(e) => setDeliveryTypeFormData(prev => ({ ...prev, trackingId: e.target.value }))}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${deliveryTypeFormData.deliveryType === "parcelId" ? "Parcel" : "Courier"} ID`}
                  />
                </div>
              )}
              
              {/* Current Status Display */}
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <h4 className="font-semibold mb-2">Current Status:</h4>
                <p><strong>Delivery Type:</strong> {selectedOrder.deliveryType || "Not set"}</p>
                <p><strong>Tracking ID:</strong> {selectedOrder.parcelId || selectedOrder.courierId || "Not set"}</p>
                <p><strong>Shipping Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedOrder.isShipped 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}>
                    {selectedOrder.isShipped ? "Shipped" : "Not Shipped"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeliveryTypeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDeliveryType}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
              >
                Update Delivery Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete Order"
        cancelText="Cancel"
      />

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RecentOrdersPage;





// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   FaShoppingBag,
//   FaTruck,
//   FaClock,
//   FaChevronLeft,
//   FaChevronRight,
// } from "react-icons/fa";
// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
// import Header from "./Header";

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// // Initialize Firebase
// let app;
// let db;

// try {
//   app = initializeApp(firebaseConfig);
//   db = getFirestore(app);
// } catch (error) {
//   console.log("Firebase already initialized or error:", error);
// }

// // Memoized Loading Skeleton Component
// const TableSkeleton = React.memo(({ rowCount = 10 }) => {
//   return (
//     <div className="overflow-x-auto custom-scrollbar">
//       <table className="w-full text-sm border-collapse table-auto text-foreground">
//         <thead className="bg-muted text-foreground">
//           <tr>
//             <th className="p-2 text-left whitespace-nowrap">Date</th>
//             <th className="p-2 text-left whitespace-nowrap">Book</th>
//             <th className="p-2 text-left whitespace-nowrap">Name</th>
//             <th className="p-2 text-left whitespace-nowrap">Phone</th>
//             <th className="p-2 text-left whitespace-nowrap">Address</th>
//             <th className="p-2 text-left whitespace-nowrap">Status</th>
//             <th className="p-2 text-left whitespace-nowrap">Tracking ID</th>
//             <th className="p-2 text-left whitespace-nowrap">Qty</th>
//           </tr>
//         </thead>
//         <tbody>
//           {[...Array(rowCount)].map((_, index) => (
//             <tr key={index} className="border-b border-border">
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-24" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-32" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-28" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-48" />
//               </td>
//               <td className="p-2">
//                 <div className="h-6 rounded-full bg-muted animate-pulse w-20" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-20" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-24" />
//               </td>
//               <td className="p-2">
//                 <div className="h-4 rounded bg-muted animate-pulse w-8 mx-auto" />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// });

// TableSkeleton.displayName = 'TableSkeleton';

// // Memoized Pagination Component
// const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
//   const getPageNumbers = useCallback(() => {
//     const pages = [];
//     const maxVisible = 5;

//     if (totalPages <= maxVisible) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       if (currentPage <= 3) {
//         for (let i = 1; i <= 4; i++) pages.push(i);
//         pages.push("...");
//         pages.push(totalPages);
//       } else if (currentPage >= totalPages - 2) {
//         pages.push(1);
//         pages.push("...");
//         for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
//       } else {
//         pages.push(1);
//         pages.push("...");
//         pages.push(currentPage - 1);
//         pages.push(currentPage);
//         pages.push(currentPage + 1);
//         pages.push("...");
//         pages.push(totalPages);
//       }
//     }

//     return pages;
//   }, [currentPage, totalPages]);

//   return (
//     <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
//       <div className="text-sm text-muted-foreground">
//         Showing page {currentPage} of {totalPages}
//       </div>

//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className={`p-2 rounded-lg transition-colors ${
//             currentPage === 1
//               ? "bg-muted text-muted-foreground cursor-not-allowed"
//               : "bg-muted text-foreground hover:bg-muted/80"
//           }`}
//         >
//           <FaChevronLeft />
//         </button>

//         {getPageNumbers().map((page, index) => (
//           <button
//             key={index}
//             onClick={() => typeof page === "number" && onPageChange(page)}
//             disabled={page === "..."}
//             className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//               page === currentPage
//                 ? "bg-blue-600 text-white"
//                 : page === "..."
//                 ? "text-muted-foreground cursor-default"
//                 : "bg-muted text-foreground hover:bg-muted/80"
//             }`}
//           >
//             {page}
//           </button>
//         ))}

//         <button
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className={`p-2 rounded-lg transition-colors ${
//             currentPage === totalPages
//               ? "bg-muted text-muted-foreground cursor-not-allowed"
//               : "bg-muted text-foreground hover:bg-muted/80"
//           }`}
//         >
//           <FaChevronRight />
//         </button>
//       </div>

//       <select
//         value={currentPage}
//         onChange={(e) => onPageChange(Number(e.target.value))}
//         className="px-3 py-2 rounded-lg text-sm bg-background text-foreground border border-border"
//       >
//         {[...Array(totalPages)].map((_, i) => (
//           <option key={i + 1} value={i + 1}>
//             Page {i + 1}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// });

// Pagination.displayName = 'Pagination';

// const RecentOrdersPage = () => {
//   const [recentOrders, setRecentOrders] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedFilter, setSelectedFilter] = useState("all");
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [ordersPerPage, setOrdersPerPage] = useState(15);

//   // Memoized format functions
//   const formatDisplayName = useCallback((bookName) => {
//     if (bookName.includes("calendar")) {
//       return bookName.replace("calendar", "Panchang ");
//     }
//     return bookName
//       .replace(/([A-Z])/g, ' $1')
//       .replace(/[-_]/g, ' ')
//       .split(' ')
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ')
//       .trim();
//   }, []);

//   const formatDate = useCallback((timestamp) => {
//     try {
//       const date = typeof timestamp === "object" && timestamp.toDate
//         ? timestamp.toDate()
//         : new Date(timestamp);

//       const now = new Date();
//       const diffInMs = now - date;
//       const diffInMinutes = Math.floor(diffInMs / 60000);
//       const diffInHours = Math.floor(diffInMs / 3600000);
//       const diffInDays = Math.floor(diffInMs / 86400000);

//       if (diffInMinutes < 1) return "Just now";
//       if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
//       if (diffInHours < 24) return `${diffInHours}h ago`;
//       if (diffInDays < 7) return `${diffInDays}d ago`;

//       return date.toLocaleDateString("en-IN", {
//         day: "numeric",
//         month: "short",
//         year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
//       });
//     } catch (e) {
//       return "Unknown";
//     }
//   }, []);

//   // Optimized load function - only loads 100 most recent orders
//   const loadRecentOrders = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       if (!db) {
//         throw new Error("Firebase is not initialized");
//       }

//       // Only get the 100 most recent orders to minimize reads
//       const ordersCollection = collection(db, "bookorders");
//       const q = query(
//         ordersCollection,
//         orderBy("timestamp", "desc"),
//         limit(100) // Only load 100 most recent orders
//       );
      
//       const snapshot = await getDocs(q);

//       if (snapshot.size === 0) {
//         setRecentOrders([]);
//         return;
//       }

//       const orders = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         const bookName = data.bookName || "Unknown Book";

//         return {
//           id: doc.id,
//           bookName: formatDisplayName(bookName),
//           rawBookName: bookName,
//           name: data["नाम"] || data["उपनाम"] || "N/A",
//           phone: data["मोबाइल नंबर"] || "N/A",
//           address: data["એડ્રેસ/एड्रेस"] || "N/A",
//           city: data["शहर"] || "",
//           state: data["राज्य"] || "",
//           pincode: data["पिनकोड"] || "",
//           quantity: data["નકલ"] || 1,
//           parcelId: data.parcelId || "",
//           isShipped: !!(data.parcelId && data.parcelId.trim() !== ""),
//           timestamp: data.timestamp || data.migratedAt || data.createdAt || new Date().getTime(),
//         };
//       });

//       setRecentOrders(orders);
//     } catch (error) {
//       console.error("Error loading orders:", error);
//       setError(error.message || "Failed to load orders");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [formatDisplayName]);

//   useEffect(() => {
//     loadRecentOrders();
//   }, [loadRecentOrders]);

//   // Reset to page 1 when filter changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [selectedFilter]);

//   // Memoized filtered orders
//   const filteredOrders = React.useMemo(() => {
//     return recentOrders.filter((order) => {
//       if (selectedFilter === "shipped") return order.isShipped;
//       if (selectedFilter === "pending") return !order.isShipped;
//       return true;
//     });
//   }, [recentOrders, selectedFilter]);

//   // Memoized pagination calculations
//   const { currentOrders, totalPages } = React.useMemo(() => {
//     const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
//     const indexOfLastOrder = currentPage * ordersPerPage;
//     const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
//     const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    
//     return { currentOrders, totalPages };
//   }, [filteredOrders, currentPage, ordersPerPage]);

//   // Memoized stats
//   const stats = React.useMemo(() => ({
//     total: recentOrders.length,
//     shipped: recentOrders.filter((o) => o.isShipped).length,
//     pending: recentOrders.filter((o) => !o.isShipped).length,
//   }), [recentOrders]);

//   const handlePageChange = useCallback((pageNumber) => {
//     setCurrentPage(pageNumber);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, []);

//   const handleFilterChange = useCallback((filter) => {
//     setSelectedFilter(filter);
//   }, []);

//   const handleOrdersPerPageChange = useCallback((value) => {
//     setOrdersPerPage(value);
//     setCurrentPage(1);
//   }, []);

//   if (error) {
//     return (
//       <div className="min-h-screen flex mt-10 items-center justify-center bg-background">
//         <div className="bg-red-100 dark:bg-red-900/20 p-8 rounded-xl shadow-lg max-w-md">
//           <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
//             Error Loading Orders
//           </h2>
//           <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
//           <button
//             onClick={loadRecentOrders}
//             className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
//           >
//             Retry Loading
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen mt-16 bg-background transition-colors duration-200">
//       <Header />

//       <div className="p-2 md:p-4">
//         <div className="bg-card rounded-md shadow-lg p-4">
//           {/* Filter Buttons */}
//           <div className="flex flex-wrap gap-2 mb-6">
//             <button
//               onClick={() => handleFilterChange("all")}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 selectedFilter === "all"
//                   ? "bg-blue-600 text-white"
//                   : "bg-muted text-foreground hover:bg-muted/80"
//               }`}
//             >
//               All Recent Orders ({stats.total})
//             </button>
//             <button
//               onClick={() => handleFilterChange("shipped")}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 selectedFilter === "shipped"
//                   ? "bg-green-600 text-white"
//                   : "bg-muted text-foreground hover:bg-muted/80"
//               }`}
//             >
//               <FaTruck className="inline mr-1" />
//               Shipped ({stats.shipped})
//             </button>
//             <button
//               onClick={() => handleFilterChange("pending")}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 selectedFilter === "pending"
//                   ? "bg-yellow-600 text-white"
//                   : "bg-muted text-foreground hover:bg-muted/80"
//               }`}
//             >
//               <FaClock className="inline mr-1" />
//               Pending ({stats.pending})
//             </button>

//             {/* Orders per page selector */}
//             <div className="ml-auto flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Show:</span>
//               <select
//                 value={ordersPerPage}
//                 onChange={(e) => handleOrdersPerPageChange(Number(e.target.value))}
//                 className="px-3 py-2 rounded-lg text-sm bg-muted text-foreground border border-border"
//               >
//                 <option value={10}>10</option>
//                 <option value={15}>15</option>
//                 <option value={25}>25</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>
//           </div>

         

//           {/* Orders List or Skeleton */}
//           {isLoading ? (
//             <TableSkeleton rowCount={ordersPerPage} />
//           ) : (
//             <>
//               <div className="overflow-x-auto custom-scrollbar">
//                 {currentOrders.length === 0 ? (
//                   <div className="text-center py-12 text-muted-foreground">
//                     <FaShoppingBag className="mx-auto text-4xl mb-3 opacity-50" />
//                     <p className="text-lg">No orders found</p>
//                     <p className="text-sm mt-2">
//                       Try changing the filter or check back later
//                     </p>
//                   </div>
//                 ) : (
//                   <table className="w-full text-sm border-collapse table-auto text-foreground">
//                     <thead className="bg-muted text-foreground">
//                       <tr>
//                         <th className="p-2 text-left whitespace-nowrap">Date</th>
//                         <th className="p-2 text-left whitespace-nowrap">Book</th>
//                         <th className="p-2 text-left whitespace-nowrap">Name</th>
//                         <th className="p-2 text-left whitespace-nowrap">Phone</th>
//                         <th style={{ width: '200px' }} className="p-2 text-left whitespace-nowrap">
//                           Address
//                         </th>
//                         <th className="p-2 text-left whitespace-nowrap">City & Pincode</th>
//                         <th className="p-2 text-left whitespace-nowrap">State</th>
//                         <th className="p-2 text-left whitespace-nowrap">Status</th>
//                         <th className="p-2 text-left whitespace-nowrap">Tracking ID</th>
//                         <th className="p-2 text-left whitespace-nowrap">Qty</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentOrders.map((order) => (
//                         <TableRow 
//                           key={order.id} 
//                           order={order} 
//                           formatDate={formatDate} 
//                         />
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>

//               {/* Pagination */}
//               {filteredOrders.length > 0 && (
//                 <Pagination
//                   currentPage={currentPage}
//                   totalPages={totalPages}
//                   onPageChange={handlePageChange}
//                 />
//               )}
//             </>
//           )}

//           <style jsx>{`
//             .custom-scrollbar::-webkit-scrollbar {
//               width: 8px;
//             }
//             .custom-scrollbar::-webkit-scrollbar-track {
//               background: hsl(var(--muted));
//               border-radius: 4px;
//             }
//             .custom-scrollbar::-webkit-scrollbar-thumb {
//               background: hsl(var(--muted-foreground) / 0.3);
//               border-radius: 4px;
//             }
//             .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//               background: hsl(var(--muted-foreground) / 0.5);
//             }
//           `}</style>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Memoized Table Row Component for better performance
// const TableRow = React.memo(({ order, formatDate }) => {
//   return (
//     <tr className="border-b border-border hover:bg-muted/50 transition-colors duration-150">
//       <td className="p-2 whitespace-nowrap text-green-700 dark:text-green-400 font-bold align-middle">
//         {formatDate(order.timestamp)}
//       </td>
//       <td className="p-2 whitespace-nowrap">
//         <span className="font-semibold text-blue-600 dark:text-blue-400">
//           {order.bookName}
//         </span>
//       </td>
//       <td className="p-2 whitespace-nowrap">
//         <span>{order.name}</span>
//       </td>
//       <td className="p-2 whitespace-nowrap">
//         <span>{order.phone}</span>
//       </td>
//       <td
//         className="p-2 whitespace-normal align-middle"
//         style={{ width: '200px', maxWidth: '200px' }}
//       >
//         <span className="break-words">{order.address}</span>
//       </td>
//       <td className="p-2 truncate align-middle">
//         <span className="truncate">
//           {order.city && ` ${order.city}`}
//           <br />
//           {order.pincode && `  ${order.pincode}`}
//         </span>
//       </td>
//       <td className="p-2 truncate align-middle">
//         <span className="truncate">{order.state && ` ${order.state}`}</span>
//       </td>
//       <td className="p-2 whitespace-nowrap align-middle">
//         <span
//           className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
//             order.isShipped
//               ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
//               : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
//           }`}
//         >
//           {order.isShipped ? <FaTruck /> : <FaClock />}
//           {order.isShipped ? "Shipped" : "Pending"}
//         </span>
//       </td>
//       <td className="p-2 whitespace-nowrap align-middle">
//         {order.isShipped && order.parcelId ? (
//           <code className="px-2 py-1 rounded text-xs bg-muted">
//             {order.parcelId}
//           </code>
//         ) : (
//           "-"
//         )}
//       </td>
//       <td className="p-2 text-center align-middle font-bold text-blue-500">
//         {order.quantity || 1}
//       </td>
//     </tr>
//   );
// });

// TableRow.displayName = 'TableRow';

// export default RecentOrdersPage;