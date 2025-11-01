"use client";
import React, { useState, useEffect } from "react";
import {
  FaShoppingBag,
  FaTruck,
  FaClock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBook,
  FaCalendarAlt,
  FaSpinner,
  FaArrowLeft,
  FaSun,
  FaMoon,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useTheme } from "../../app/utils/ThemeProvider";
// import Sidebar from "./Sidebar";
// import Link from "next/link";
import Header from "./Header";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log("Firebase already initialized or error:", error);
}

// Loading Skeleton Component
const TableSkeleton = ({ isDark, rowCount = 10 }) => {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table
        className={`w-full text-sm border-collapse table-auto ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <thead
          className={`${
            isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
          }`}
        >
          <tr>
            <th className="p-2 text-left whitespace-nowrap">Date</th>
            <th className="p-2 text-left whitespace-nowrap">Book</th>
            <th className="p-2 text-left whitespace-nowrap">Name</th>
            <th className="p-2 text-left whitespace-nowrap">Phone</th>
            <th className="p-2 text-left whitespace-nowrap">Address</th>
            <th className="p-2 text-left whitespace-nowrap">Status</th>
            
            <th className="p-2 text-left whitespace-nowrap">Tracking ID</th>
            <th className="p-2 text-left whitespace-nowrap">Qty</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(rowCount)].map((_, index) => (
            <tr
              key={index}
              className={`border-b ${
                isDark ? "border-gray-600" : "border-gray-200"
              }`}
            >
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-24`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-32`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-28`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-48`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-6 rounded-full ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-20`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-20`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-24`}
                />
              </td>
              <td className="p-2">
                <div
                  className={`h-4 rounded ${
                    isDark ? "bg-gray-600" : "bg-gray-200"
                  } animate-pulse w-8 mx-auto`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, isDark }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Showing page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? isDark
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isDark
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaChevronLeft />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white"
                : page === "..."
                ? isDark
                  ? "text-gray-500 cursor-default"
                  : "text-gray-400 cursor-default"
                : isDark
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? isDark
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isDark
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaChevronRight />
        </button>
      </div>

      <select
        value={currentPage}
        onChange={(e) => onPageChange(Number(e.target.value))}
        className={`px-3 py-2 rounded-lg text-sm ${
          isDark
            ? "bg-gray-700 text-gray-300 border-gray-600"
            : "bg-white text-gray-700 border-gray-300"
        } border`}
      >
        {[...Array(totalPages)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            Page {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
};

const RecentOrdersPage = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [discoveredCollections, setDiscoveredCollections] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(15);
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  useEffect(() => {
    loadCollectionsAndOrders();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const formatDisplayName = (collectionName) => {
    let name = collectionName.replace(/-bookorder$/i, "");
    if (name.includes("calendar")) {
      return name.replace("calendar", "Panchang ");
    }
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const loadCollectionsAndOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!db) {
        throw new Error("Firebase is not initialized");
      }

      // Fetch collection patterns
      const response = await fetch(
        "https://getbookordercollections-fahifz22ha-uc.a.run.app/"
      );
      const collectionData = await response.json();

      if (!collectionData.success) {
        throw new Error("Failed to fetch collection patterns");
      }

      const COLLECTION_PATTERNS = collectionData.collections;
      const foundCollections = [];
      const allOrders = [];

      // Fetch orders from all collections
      for (const collectionName of COLLECTION_PATTERNS) {
        try {
          const ordersCollection = collection(db, collectionName);
          const snapshot = await getDocs(ordersCollection);

          if (snapshot.size > 0) {
            foundCollections.push(collectionName);

            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              allOrders.push({
                id: doc.id,
                bookName: formatDisplayName(collectionName),
                collectionName: collectionName,
                name: data["नाम"] || "N/A",
                phone: data["मोबाइल नंबर"] || "N/A",
                address: data["એડ્રેસ/एड्रेस"] || "N/A",
                city: data["शहर"] || "",
                state: data["राज्य"] || "",
                pincode: data["पिनकोड"] || "",
                quantity: data["નકલ"] || 1,
                parcelId: data.parcelId || "",
                isShipped: data.parcelId && data.parcelId.trim() !== "",
                timestamp: data.timestamp || data.createdAt || new Date().getTime(),
              });
            });
          }
        } catch (err) {
          console.log(`Error fetching from ${collectionName}:`, err);
        }
      }

      // Sort by timestamp (most recent first)
      allOrders.sort((a, b) => {
        const timeA =
          typeof a.timestamp === "object" ? a.timestamp.toMillis() : a.timestamp;
        const timeB =
          typeof b.timestamp === "object" ? b.timestamp.toMillis() : b.timestamp;
        return timeB - timeA;
      });

      setDiscoveredCollections(foundCollections);
      setRecentOrders(allOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      setError(error.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date =
        typeof timestamp === "object" && timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMs / 3600000);
      const diffInDays = Math.floor(diffInMs / 86400000);

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch (e) {
      return "Unknown";
    }
  };

  const filteredOrders = recentOrders.filter((order) => {
    if (selectedFilter === "shipped") return order.isShipped;
    if (selectedFilter === "pending") return !order.isShipped;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const stats = {
    total: recentOrders.length,
    shipped: recentOrders.filter((o) => o.isShipped).length,
    pending: recentOrders.filter((o) => !o.isShipped).length,
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-screen flex mt-10 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-100 dark:bg-red-900 p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadCollectionsAndOrders}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen mt-16 ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      } transition-colors duration-200`}
    >
     

      <Header  />

      <div className="p-2 md:p-4">
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-md shadow-lg p-4`}
        >
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Orders ({stats.total})
            </button>
            <button
              onClick={() => setSelectedFilter("shipped")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "shipped"
                  ? isDark
                    ? "bg-green-600 text-white"
                    : "bg-green-500 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaTruck className="inline mr-1" />
              Shipped ({stats.shipped})
            </button>
            <button
              onClick={() => setSelectedFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "pending"
                  ? isDark
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-500 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaClock className="inline mr-1" />
              Pending ({stats.pending})
            </button>

            {/* Orders per page selector */}
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Show:
              </span>
              <select
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? "bg-gray-700 text-gray-300 border-gray-600"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                } border`}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Orders List or Skeleton */}
          {isLoading ? (
            <TableSkeleton isDark={isDark} rowCount={ordersPerPage} />
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar">
                {currentOrders.length === 0 ? (
                  <div
                    className={`text-center py-12 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <FaShoppingBag className="mx-auto text-4xl mb-3 opacity-50" />
                    <p className="text-lg">No orders found</p>
                    <p className="text-sm mt-2">
                      Try changing the filter or check back later
                    </p>
                  </div>
                ) : (
                  <table
                    className={`w-full text-sm border-collapse table-auto ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <thead
                      className={`${
                        isDark
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <tr>
                        <th className="p-2 text-left whitespace-nowrap">Date</th>
                        <th className="p-2 text-left whitespace-nowrap">Book</th>
                        <th className="p-2 text-left whitespace-nowrap">Name</th>
                        <th className="p-2 text-left whitespace-nowrap">Phone</th>
                        <th style={{ width: '200px' }} className="p-2 text-left whitespace-nowrap">Address</th>
                        <th className="p-2 text-left whitespace-nowrap">City & Pincode</th>
                        <th className="p-2 text-left whitespace-nowrap">State</th>
                        <th className="p-2 text-left whitespace-nowrap">Status</th>
                        
                        <th className="p-2 text-left whitespace-nowrap">Tracking ID</th>
                        <th className="p-2 text-left whitespace-nowrap">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr
                          key={`${order.collectionName}-${order.id}`}
                          className={`border-b ${
                            isDark
                              ? "border-gray-600 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                          } transition-colors duration-150`}
                        >
                           <td className="p-2 whitespace-nowrap text-green-700 font-bold align-middle">
                            {formatDate(order.timestamp)}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                isDark ? "text-blue-400" : "text-blue-600"
                              }`}
                            >
                              {order.bookName}
                            </span>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <span>{order.name}</span>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <span>{order.phone}</span>
                          </td>
                          <td className="p-2 whitespace-normal align-middle" style={{ width: '200px', maxWidth: '200px' }}>
  <span className="break-words">
    {order.address}
  </span>
</td>
                          <td className="p-2 truncate align-middle">
                            <span className="truncate">
                              {order.city && ` ${order.city}`}
                              <br />
                              {order.pincode && `  ${order.pincode}`}
                            </span>
                          </td>
                          <td className="p-2 truncate align-middle">
                            <span className="truncate">
                             {order.state && ` ${order.state}`}
                            </span>
                          </td>
                          <td className="p-2 whitespace-nowrap align-middle">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                                order.isShipped
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              }`}
                            >
                              {order.isShipped ? <FaTruck /> : <FaClock />}
                              {order.isShipped ? "Shipped" : "Pending"}
                            </span>
                          </td>
                         
                          <td className="p-2 whitespace-nowrap align-middle">
                            {order.isShipped && order.parcelId ? (
                              <code
                                className={`px-2 py-1 rounded text-xs ${
                                  isDark ? "bg-gray-600" : "bg-gray-200"
                                }`}
                              >
                                {order.parcelId}
                              </code>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-2 text-center align-middle font-bold text-blue-500">
                            {order.quantity || 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredOrders.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isDark={isDark}
                />
              )}
            </>
          )}

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: ${isDark ? "#374151" : "#f3f4f6"};
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: ${isDark ? "#4b5563" : "#d1d5db"};
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: ${isDark ? "#6b7280" : "#9ca3af"};
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default RecentOrdersPage;