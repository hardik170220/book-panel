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
  FaInfoCircle,
  FaFilter,
  FaTimes,
  FaEllipsisH
} from "react-icons/fa";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  updateDoc,
  doc,
  deleteDoc
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
        {confirmText === "Delete" && (
          <p className="text-xs text-red-500 mb-4">* This will move the order to deleted items.</p>
        )}
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
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeliveryTypeModal, setShowDeliveryTypeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [deliveryTypeFormData, setDeliveryTypeFormData] = useState({
    deliveryType: "",
    trackingId: "",
    address: "",
    phone: ""
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Pagination states
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [allPages, setAllPages] = useState(new Map()); // Cache pages

  // Filter states
  const [filters, setFilters] = useState({
    deliveryType: "all",
    deliveryStatus: "all",
    minCopies: 0,
    maxCopies: "",
    city: "",
    cityMode: "include",
    state: "",
    stateMode: "include",
    pincode: "",
    pincodeMode: "include",
    searchName: "",
    searchNameMode: "include",
    searchMobile: "",
    searchMobileMode: "include",
    dateFrom: "",
    dateTo: "",
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
    if (!bookName) return "Unknown Book";
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

  // Fetch total count
  const fetchTotalCount = useCallback(async () => {
    try {
      const response = await fetch(
        `https://getbookorders-fahifz22ha-uc.a.run.app?bookName=all`
      );

      if (response.ok) {
        const result = await response.json();
        console.log(result, "result")
        if (result.success) {
          setTotalCount(result.totalCount);
        }
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  }, []);

  // Load recent orders via API
  const loadRecentOrders = useCallback(async (page = 1, newPageSize = pageSize) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if page is already cached for this page size
      const cacheKey = `${page}-${newPageSize}`;
      if (allPages.has(cacheKey)) {
        const cachedData = allPages.get(cacheKey);
        setRecentOrders(cachedData.data);
        setLastDocId(cachedData.lastDocId);
        setLastTimestamp(cachedData.lastTimestamp);
        setHasMore(cachedData.hasMore);
        setIsLoading(false);
        return;
      }

      let url = `https://getbookorders-fahifz22ha-uc.a.run.app?bookName=all&pageSize=${newPageSize}`;

      // For pages after the first, use pagination tokens
      if (page > 1 && lastDocId && lastTimestamp) {
        url += `&lastDocId=${lastDocId}&lastTimestamp=${encodeURIComponent(lastTimestamp)}`;
      }

      console.log("Loading orders for page:", page, "with pageSize:", newPageSize);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const formattedData = result.data.map((data) => {
          const bookName = data.bookName || "Unknown Book";
          return {
            id: data.id,
            bookName: formatDisplayName(bookName),
            rawBookName: bookName,
            name: data["नाम"] || data["उपनाम"] || "N/A",
            phone: data["मोबाइल नंबर"] || "N/A",
            address: data["એડ્રેસ/एड्रेस"] || data["एड्रेस"] || data["એડ્રેસ"] || "N/A",
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
            registrationId: data.registrationId || "N/A",
            ...data
          };
        });

        // Cache the page
        const pageCache = new Map(allPages);
        pageCache.set(cacheKey, {
          data: formattedData,
          lastDocId: result.lastDocId,
          lastTimestamp: result.lastTimestamp,
          hasMore: result.hasMore,
        });
        setAllPages(pageCache);

        setRecentOrders(formattedData);
        setLastDocId(result.lastDocId);
        setLastTimestamp(result.lastTimestamp);
        setHasMore(result.hasMore);

        console.log(`Loaded ${formattedData.length} orders for page ${page} with pageSize ${newPageSize}`);
      } else {
        setError(result.error || "No data received");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setError(error.message || "Failed to load orders");
      showToast(error.message || "Failed to load orders", "error");
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, lastDocId, lastTimestamp, allPages, formatDisplayName, showToast]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setAllPages(new Map()); // Clear cache when page size changes
    loadRecentOrders(1, newPageSize);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const current = currentPage;
    const delta = 2; // Number of pages to show on each side of current page
    const pages = [];
    const range = [];

    range.push(1);

    for (let i = current - delta; i <= current + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        pages.push('...');
      }
      pages.push(page);
      prev = page;
    }

    return pages;
  };

  // Navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
      setCurrentPage(page);
      loadRecentOrders(page);
    }
  };

  const goToNextPage = () => {
    if (hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadRecentOrders(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);

      // Get cached data for previous page
      const cacheKey = `${prevPage}-${pageSize}`;
      if (allPages.has(cacheKey)) {
        const cachedData = allPages.get(cacheKey);
        setRecentOrders(cachedData.data);
        setLastDocId(cachedData.lastDocId);
        setLastTimestamp(cachedData.lastTimestamp);
        setHasMore(cachedData.hasMore);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchTotalCount();
    loadRecentOrders(1);
  }, []); // Run once on mount

  // Apply all filters to data
  const applyFilters = (dataArray) => {
    return dataArray.filter((item) => {
      // Filter out deleted records
      if (item.isDelete === true) return false;

      if (filters.deliveryType !== "all") {
        if (filters.deliveryType === "unassigned" && item.isShipped) return false;
        if (filters.deliveryType === "parcelId" && (!item.isShipped || item.deliveryType !== "parcelId")) return false;
        if (filters.deliveryType !== "unassigned" && filters.deliveryType !== "parcelId" && item.deliveryType !== filters.deliveryType) return false;
      }

      // New delivery status filter
      if (filters.deliveryStatus !== "all") {
        if (filters.deliveryStatus === "delivered" && !item.isDelivered) return false;
        if (filters.deliveryStatus === "notDelivered" && item.isDelivered) return false;
      }

      const copies = parseInt(item.quantity || 1, 10);

      if (filters.minCopies && copies < filters.minCopies) return false;
      if (filters.maxCopies && copies > filters.maxCopies) return false;

      // Helper for text filters with multiple values and include/exclude mode
      const checkTextFilter = (itemValue, filterValue, mode) => {
        if (!filterValue) return true;

        const values = filterValue.split(',').map(v => v.trim().toLowerCase()).filter(v => v);
        if (values.length === 0) return true;

        const itemValLower = (itemValue || "").toLowerCase();
        const match = values.some(val => itemValLower.includes(val));

        return mode === "exclude" ? !match : match;
      };

      if (!checkTextFilter(item.city, filters.city, filters.cityMode)) return false;
      if (!checkTextFilter(item.state, filters.state, filters.stateMode)) return false;
      if (!checkTextFilter(item.pincode, filters.pincode, filters.pincodeMode)) return false;

      const fullName = (item.name || "").trim();
      if (!checkTextFilter(fullName, filters.searchName, filters.searchNameMode)) return false;

      if (!checkTextFilter(item.phone, filters.searchMobile, filters.searchMobileMode)) return false;

      if (filters.dateFrom) {
        const itemDate = new Date(item.timestamp);
        const fromDate = new Date(filters.dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const itemDate = new Date(item.timestamp);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }

      return true;
    });
  };

  const filteredOrders = useMemo(() => {
    return applyFilters(recentOrders);
  }, [recentOrders, filters]);

  const resetFilters = () => {
    setFilters({
      deliveryType: "all",
      deliveryStatus: "all",
      minCopies: 0,
      maxCopies: "",
      city: "",
      cityMode: "include",
      state: "",
      stateMode: "include",
      pincode: "",
      pincodeMode: "include",
      searchName: "",
      searchNameMode: "include",
      searchMobile: "",
      searchMobileMode: "include",
      dateFrom: "",
      dateTo: "",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.deliveryType !== "all") count++;
    if (filters.deliveryStatus !== "all") count++;
    if (filters.minCopies > 0) count++;
    if (filters.maxCopies) count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.pincode) count++;
    if (filters.searchName) count++;
    if (filters.searchMobile) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };

  const calculateTotalCopies = (dataArray) => {
    return dataArray.reduce((sum, item) => sum + (parseInt(item.quantity || 1, 10) || 0), 0);
  };

  // Action handlers
  const handleViewOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  }, []);

  const handleSetDeliveryType = useCallback((order) => {
    setSelectedOrder(order);
    setDeliveryTypeFormData({
      deliveryType: order.deliveryType || "",
      trackingId: order.parcelId || order.courierId || "",
      address: order.address || "",
      phone: order.phone || ""
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
      await updateDoc(doc(db, "bookorders", selectedOrder.id), {
        isDelete: true,
        deletedAt: new Date().getTime()
      });
      setRecentOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      showToast("Order moved to recycling bin", "success");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error soft deleting order:", error);
      showToast("Failed to delete order", "error");
    }
  }, [selectedOrder, db, showToast]);

  // Bulk mark as delivered
  const handleMarkAsDelivered = useCallback(async (selectedItems, deliveryDate) => {
    try {
      const updatePromises = selectedItems.map(async (item) => {
        const orderRef = doc(db, "bookorders", item.id);
        await updateDoc(orderRef, {
          deliveredDate: deliveryDate,
          isDelivered: true
        });
      });

      await Promise.all(updatePromises);

      setRecentOrders(prev => prev.map(order => {
        const selectedItem = selectedItems.find(item => item.id === order.id);
        if (selectedItem) {
          return {
            ...order,
            deliveredDate: deliveryDate,
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

  // Update delivery type
  const handleUpdateDeliveryType = useCallback(async () => {
    try {
      const orderRef = doc(db, "bookorders", selectedOrder.id);

      // Determine which keys were used for mobile and address in the original data
      // fallback to standard keys if not found
      const phoneKey = Object.keys(selectedOrder).find(key => key === "मोबाइल नंबर") || "मोबाइल नंबर";
      const addressKey = Object.keys(selectedOrder).find(key =>
        ["એડ્રેસ/एड्रेस", "एड्रेस", "એડ્રેસ"].includes(key)
      ) || "एड्रेस";

      const updateData = {
        deliveryType: deliveryTypeFormData.deliveryType,
        [phoneKey]: deliveryTypeFormData.phone,
        [addressKey]: deliveryTypeFormData.address
      };

      if (deliveryTypeFormData.deliveryType === "parcelId") {
        updateData.parcelId = deliveryTypeFormData.trackingId;
        updateData.courierId = "";
        updateData.isShipped = true;
      } else if (deliveryTypeFormData.deliveryType === "courierId") {
        updateData.courierId = deliveryTypeFormData.trackingId;
        updateData.parcelId = "";
        updateData.isShipped = true;
      } else if (deliveryTypeFormData.deliveryType === "handtohand") {
        updateData.parcelId = "";
        updateData.courierId = "";
        updateData.isShipped = true;
      } else {
        updateData.isShipped = false;
      }

      await updateDoc(orderRef, updateData);

      setRecentOrders(prev => prev.map(order =>
        order.id === selectedOrder.id
          ? {
            ...order,
            ...updateData,
            phone: deliveryTypeFormData.phone,
            address: deliveryTypeFormData.address,
            parcelId: deliveryTypeFormData.deliveryType === "parcelId" ? deliveryTypeFormData.trackingId : (deliveryTypeFormData.deliveryType === "handtohand" ? "" : order.parcelId),
            courierId: deliveryTypeFormData.deliveryType === "courierId" ? deliveryTypeFormData.trackingId : (deliveryTypeFormData.deliveryType === "handtohand" ? "" : order.courierId)
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

  // Table columns
  const tableColumns = useMemo(() => [
    { field: "timestamp", header: "Date" },
    { field: "registrationId", header: "Order ID" },
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

  // Action buttons
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
        className="p-1 text-yellow-700 hover:text-yellow-800 transition-colors"
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

  if (error) {
    return (
      <div className="min-h-screen flex mt-10 items-center justify-center bg-background">
        <div className="bg-red-100 dark:bg-red-900/20 p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadRecentOrders(1)}
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
      <Header
        totalCopies={calculateTotalCopies(filteredOrders)}
        data={filteredOrders}
        title="Recent Orders"
        filteredRecords={filteredOrders.length}
        onFilterClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        activeFilterCount={getActiveFilterCount()}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="p-2 md:p-0">
        <div className="bg-card rounded-md shadow-lg p-4">
          {/* Pagination Controls (Top) */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(pageSize * currentPage, totalCount)} of {totalCount} orders
              </div>

              <div className="flex items-center gap-4">
                {/* Page Size Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="pageSizeTop" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rows per page:
                  </label>
                  <select
                    id="pageSizeTop"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={"p-2 rounded flex items-center gap-1 transition-colors text-sm font-medium " + (
                      currentPage === 1
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <FaChevronLeft size={12} />
                  </button>

                  {/* Page Numbers */}
                  {generatePageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-gray-500 dark:text-gray-400">
                          <FaEllipsisH size={12} />
                        </span>
                      ) : (
                        <button
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  <button
                    onClick={goToNextPage}
                    disabled={!hasMore && currentPage === Math.ceil(totalCount / pageSize)}
                    className={"p-2 rounded flex items-center gap-1 transition-colors text-sm font-medium " + (
                      !hasMore && currentPage === Math.ceil(totalCount / pageSize)
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 font-sans bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={() => setIsFilterPanelOpen(false)}
              />

              <div className={"fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out " + (
                isFilterPanelOpen ? 'translate-x-0' : 'translate-x-full'
              )}>
                <div className="flex flex-col font-mono h-full">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-bold">Filters</h2>
                      {getActiveFilterCount() > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {getActiveFilterCount()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsFilterPanelOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FaTimes size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Delivery Type
                      </label>
                      <select
                        value={filters.deliveryType}
                        onChange={(e) => setFilters({ ...filters, deliveryType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="parcelId">Parcel</option>
                        <option value="courierId">Courier</option>
                        <option value="handtohand">Hand to Hand</option>
                        <option value="unassigned">Unassigned</option>
                      </select>
                    </div>

                    {/* New Delivery Status Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Delivery Status
                      </label>
                      <select
                        value={filters.deliveryStatus}
                        onChange={(e) => setFilters({ ...filters, deliveryStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="delivered">Dispatch</option>
                        <option value="notDelivered">Not Dispatch</option>
                      </select>
                    </div>

                    {/* Copies Range */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Copies Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Min"
                            min="0"
                            value={filters.minCopies || ""}
                            onChange={(e) => setFilters({ ...filters, minCopies: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Max"
                            min="0"
                            value={filters.maxCopies}
                            onChange={(e) => setFilters({ ...filters, maxCopies: e.target.value ? parseInt(e.target.value) : "" })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name Search */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Search by Name
                        </label>
                        <select
                          value={filters.searchNameMode}
                          onChange={(e) => setFilters({ ...filters, searchNameMode: e.target.value })}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter names (comma separated)..."
                        value={filters.searchName}
                        onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple names with commas</p>
                    </div>

                    {/* Mobile Search */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Search by Mobile
                        </label>
                        <select
                          value={filters.searchMobileMode}
                          onChange={(e) => setFilters({ ...filters, searchMobileMode: e.target.value })}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter mobile numbers (comma separated)..."
                        value={filters.searchMobile}
                        onChange={(e) => setFilters({ ...filters, searchMobile: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple numbers with commas</p>
                    </div>

                    {/* City */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          City
                        </label>
                        <select
                          value={filters.cityMode}
                          onChange={(e) => setFilters({ ...filters, cityMode: e.target.value })}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter cities (comma separated)..."
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple cities with commas</p>
                    </div>

                    {/* State */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          State
                        </label>
                        <select
                          value={filters.stateMode}
                          onChange={(e) => setFilters({ ...filters, stateMode: e.target.value })}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter states (comma separated)..."
                        value={filters.state}
                        onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple states with commas</p>
                    </div>

                    {/* Pincode */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Pincode
                        </label>
                        <select
                          value={filters.pincodeMode}
                          onChange={(e) => setFilters({ ...filters, pincodeMode: e.target.value })}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
                        >
                          <option value="include">Include</option>
                          <option value="exclude">Exclude</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter pincodes (comma separated)..."
                        value={filters.pincode}
                        onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple pincodes with commas</p>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Date Range
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                          <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                          <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter Results Summary */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Results: <span className="font-bold">{filteredOrders.length}</span> orders
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Total Copies: <span className="font-bold">{calculateTotalCopies(filteredOrders)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => setIsFilterPanelOpen(false)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Table */}
          <TableUI
            data={filteredOrders}
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
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${selectedOrder.isDelivered
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
              <h2 className="text-xl font-bold">Edit Order</h2>
              <button
                onClick={() => setShowDeliveryTypeModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div>
                <label className="block mb-1 text-sm font-semibold">Address:</label>
                <textarea
                  value={deliveryTypeFormData.address}
                  onChange={(e) => setDeliveryTypeFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold">Mobile Number:</label>
                <input
                  type="text"
                  value={deliveryTypeFormData.phone}
                  onChange={(e) => setDeliveryTypeFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="border-t pt-4">
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
              {/* <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <h4 className="font-semibold mb-2">Current Status:</h4>
                <p><strong>Delivery Type:</strong> {selectedOrder.deliveryType || "Not set"}</p>
                <p><strong>Tracking ID:</strong> {selectedOrder.parcelId || selectedOrder.courierId || "Not set"}</p>
                <p><strong>Shipping Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${selectedOrder.isShipped
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                    {selectedOrder.isShipped ? "Shipped" : "Not Shipped"}
                  </span>
                </p>
              </div> */}
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
                Update Order
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default RecentOrdersPage;