"use client";
import React, { useState, useEffect } from "react";
import {
  FaBook,
  FaShoppingCart,
  FaChartLine,
  FaCalendarCheck,
  FaSun,
  FaMoon,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaBoxes,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaDotCircle,
  FaArrowRight,
  FaClipboardList,
  FaUserCircle,
  FaStar,
  FaCrown,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useTheme } from "../../app/utils/ThemeProvider";
// import Sidebar from "./Sidebar";
import Link from "next/link";
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

// Helper function to format collection name to display name
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

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

const Dashboard = () => {
  const [bookData, setBookData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState(null);
  const [discoveredCollections, setDiscoveredCollections] = useState([]);
  const [recentOrdersCount, setRecentOrdersCount] = useState(0);
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    loadBookOrderData();
  }, []);

  const loadBookOrderData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!db) {
        throw new Error("Firebase is not initialized");
      }

      // Fetch collection patterns from Cloud Function
      const response = await fetch(
        "https://getbookordercollections-fahifz22ha-uc.a.run.app/"
      );
      const collectionData = await response.json();

      if (!collectionData.success) {
        throw new Error("Failed to fetch collection patterns");
      }

      const COLLECTION_PATTERNS = collectionData.collections;
      console.log("Discovered collection patterns:", COLLECTION_PATTERNS);

      const loadedData = {};
      const foundCollections = [];
      let totalRecentOrders = 0;
      const customerOrderMap = new Map();

      // Fetch all collections
      for (const collectionName of COLLECTION_PATTERNS) {
        try {
          const bookCollection = collection(db, collectionName);
          const snapshot = await getDocs(bookCollection);

          if (snapshot.size > 0) {
            const total = snapshot.size;
           const shipped = snapshot.docs.filter((doc) => {
  const data = doc.data();
  // Consider shipped if either deliveredDate is set OR parcelId exists
  return data.deliveredDate || (data.parcelId && data.parcelId.trim() !== "");
}).length;

            // Count recent orders (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentOrders = snapshot.docs.filter((doc) => {
              const data = doc.data();
              if (data.timestamp) {
                const orderDate = data.timestamp;
                return orderDate >= sevenDaysAgo;
              }
              return false;
            }).length;

            totalRecentOrders += recentOrders;

            // Track customer orders
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              const customerName = data["नाम"] || "";
              const customerPhone = data["मोबाइल नंबर"] || "";

              if (customerName && customerName !== "N/A") {
                const customerKey = customerPhone || customerName;

                if (customerOrderMap.has(customerKey)) {
                  const existing = customerOrderMap.get(customerKey);
                  customerOrderMap.set(customerKey, {
                    name: customerName,
                    phone: customerPhone,
                    count: existing.count + 1,
                  });
                } else {
                  customerOrderMap.set(customerKey, {
                    name: customerName,
                    phone: customerPhone,
                    count: 1,
                  });
                }
              }
            });

            const id = collectionName
              .replace(/-bookorder$/i, "")
              .replace(/[^a-zA-Z0-9]/g, "");

            loadedData[id] = {
              displayName: formatDisplayName(collectionName),
              collectionName: collectionName,
              total,
              shipped,
              pending: total - shipped,
            };

            foundCollections.push(collectionName);
          }
        } catch (err) {
          console.log(`Skipping collection: ${collectionName}`, err.message);
        }
      }

      if (Object.keys(loadedData).length === 0) {
        throw new Error(
          "No book order collections found. Please check your database."
        );
      }

      // Get top 10 customers with 5+ orders
      const customersArray = Array.from(customerOrderMap.values())
        .filter((customer) => customer.count >= foundCollections.length -2)
        .sort((a, b) => b.count - a.count)
        // .slice(0, 10);

      setBookData(loadedData);
      setDiscoveredCollections(foundCollections);
      setRecentOrdersCount(totalRecentOrders);
      setTopCustomers(customersArray);
      console.log(
        `Successfully loaded ${foundCollections.length} collections:`,
        foundCollections
      );
      console.log("Top customers (5+ orders):", customersArray);
    } catch (error) {
      console.error("Error loading book data:", error);
      setError(
        error.message ||
          "Failed to connect to database. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalOrders = Object.values(bookData).reduce(
    (sum, book) => sum + book.total,
    0
  );
  const totalShipped = Object.values(bookData).reduce(
    (sum, book) => sum + book.shipped,
    0
  );
  const totalPending = Object.values(bookData).reduce(
    (sum, book) => sum + book.pending,
    0
  );
  const fulfillmentRate =
    totalOrders > 0 ? Math.round((totalShipped / totalOrders) * 100) : 0;
  const avgOrdersPerBook =
    totalOrders > 0
      ? Math.round(totalOrders / Object.keys(bookData).length)
      : 0;

  // Prepare chart data
  const bookComparisonData = Object.entries(bookData)
    .map(([key, value]) => ({
      name: value.displayName,
      total: value.total,
      shipped: value.shipped,
      pending: value.pending,
      rate:
        value.total > 0 ? Math.round((value.shipped / value.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const pieData = bookComparisonData.map((book) => ({
    name: book.name,
    value: book.total,
  }));

  const statusDistribution = [
    { name: "Shipped", value: totalShipped, color: "#10b981" },
    { name: "Pending", value: totalPending, color: "#f59e0b" },
  ];

  // Radar chart data for performance comparison
  const radarData = bookComparisonData.slice(0, 7).map((book) => ({
    book:
      book.name.length > 15 ? book.name.substring(0, 12) + "..." : book.name,
    fulfillment: book.rate,
    volume: Math.min(
      100,
      (book.total / Math.max(...bookComparisonData.map((b) => b.total))) * 100
    ),
  }));

  // Top and Bottom performers
  const topPerformers = [...bookComparisonData]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);
  const bottomPerformers = [...bookComparisonData]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  const isDark = theme === "dark";

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-100 dark:bg-red-900 p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadBookOrderData}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <FaBook className="text-green-500 text-2xl animate-pulse" />
          </div>
        </div>
        <p
          className={`mt-4 text-lg ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Discovering collections...
        </p>
        <p
          className={`mt-2 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Scanning for bookorder databases
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      } transition-colors duration-200`}
    >
      <Header />

      <div className="p-4 md:p-6 space-y-6 mt-16">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            className={`${
              isDark
                ? "bg-gradient-to-br from-blue-900 to-blue-800"
                : "bg-gradient-to-br from-blue-500 to-blue-600"
            } rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                <FaShoppingCart className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium mb-1">
                Total Orders
              </p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {totalOrders}
              </h3>
              <div className="flex items-center gap-1 text-blue-100 text-xs">
                <FaArrowUp className="text-green-300" />
                <span>All time</span>
              </div>
            </div>
          </div>

          <div
            className={`${
              isDark
                ? "bg-gradient-to-br from-green-900 to-green-800"
                : "bg-gradient-to-br from-green-500 to-green-600"
            } rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                <FaTruck className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium mb-1">Shipped</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {totalShipped}
              </h3>
              <div className="flex items-center gap-1 text-green-100 text-xs">
                <FaCheckCircle className="text-green-300" />
                <span>Delivered</span>
              </div>
            </div>
          </div>

          <div
            className={`${
              isDark
                ? "bg-gradient-to-br from-yellow-900 to-yellow-800"
                : "bg-gradient-to-br from-yellow-500 to-yellow-600"
            } rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                <FaClock className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-yellow-100 text-xs font-medium mb-1">
                Pending
              </p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {totalPending}
              </h3>
              <div className="flex items-center gap-1 text-yellow-100 text-xs">
                <FaCalendarCheck className="text-yellow-300" />
                <span>In queue</span>
              </div>
            </div>
          </div>

          <div
            className={`${
              isDark
                ? "bg-gradient-to-br from-purple-900 to-purple-800"
                : "bg-gradient-to-br from-purple-500 to-purple-600"
            } rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                <FaPercentage className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-purple-100 text-xs font-medium mb-1">
                Fulfillment Rate
              </p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {fulfillmentRate}%
              </h3>
              <div className="flex items-center gap-1 text-purple-100 text-xs">
                <FaChartLine className="text-purple-300" />
                <span>Success rate</span>
              </div>
            </div>
          </div>

          <div
            className={`${
              isDark
                ? "bg-gradient-to-br from-pink-900 to-pink-800"
                : "bg-gradient-to-br from-pink-500 to-pink-600"
            } rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                <FaBoxes className="text-white text-xl" />
              </div>
            </div>
            <div>
              <p className="text-pink-100 text-xs font-medium mb-1">
                Avg per Book
              </p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {avgOrdersPerBook}
              </h3>
              <div className="flex items-center gap-1 text-pink-100 text-xs">
                <FaBook className="text-pink-300" />
                <span>{Object.keys(bookData).length} books</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Customers Section */}
        {topCustomers.length > 0 && (
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-lg p-6`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`${
                  isDark
                    ? "bg-gradient-to-br from-orange-600 to-orange-700"
                    : "bg-gradient-to-br from-orange-500 to-orange-600"
                } p-3 rounded-xl shadow-lg`}
              >
                <FaCrown className="text-white text-2xl" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Top 10 Customers
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Customers with 5 or more orders
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topCustomers.map((customer, index) => (
                <div
                  key={index}
                  className={`${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                          : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-500"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-400 to-orange-600"
                          : isDark
                          ? "bg-gray-600"
                          : "bg-gray-300"
                      }`}
                    >
                      {index === 0 ? (
                        <FaCrown />
                      ) : index === 1 ? (
                        <FaStar />
                      ) : index === 2 ? (
                        <FaStar />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {customer.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {customer.phone || "No phone"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        index === 0
                          ? "text-yellow-500"
                          : index === 1
                          ? "text-gray-400"
                          : index === 2
                          ? "text-orange-500"
                          : isDark
                          ? "text-orange-400"
                          : "text-orange-600"
                      }`}
                    >
                      {customer.count}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      orders
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {topCustomers.length === 0 && (
              <div
                className={`text-center py-8 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <FaUserCircle className="mx-auto text-4xl mb-3 opacity-50" />
                <p>No customers with 5+ orders yet</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Orders Summary Card - Clickable */}
        <Link href="/pages/recent-orders">
          <div
            className={`${
              isDark
                ? "bg-gray-800 hover:bg-gray-750"
                : "bg-white hover:bg-gray-50"
            } rounded-xl shadow-lg mt-6 p-6 cursor-pointer transition-all duration-200 border-2 ${
              isDark
                ? "border-gray-700 hover:border-green-600"
                : "border-gray-200 hover:border-green-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`${
                    isDark
                      ? "bg-gradient-to-br from-cyan-900 to-cyan-800"
                      : "bg-gradient-to-br from-cyan-500 to-cyan-600"
                  } p-4 rounded-xl shadow-lg`}
                >
                  <FaClipboardList className="text-white text-3xl" />
                </div>
                <div>
                  <h3
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    View All Book Orders
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    View all order activity and details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-4xl font-bold ${
                      isDark ? "text-cyan-400" : "text-cyan-600"
                    }`}
                  >
                    {recentOrdersCount}
                    <p className="text-sm text-cyan-700">orders in 7 days</p>
                  </p>
                </div>
                <FaArrowRight
                  className={`text-3xl ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  } group-hover:text-green-500 transition-colors`}
                />
              </div>
            </div>
            <div
              className={`mt-4 pt-4 border-t ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Click to view detailed order information
                </span>
                <span
                  className={`font-semibold ${
                    isDark ? "text-cyan-400" : "text-cyan-600"
                  }`}
                >
                  View Details →
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Top and Bottom Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-lg p-6`}
          >
            <div className="flex items-center gap-2 mb-4">
              <FaArrowUp className="text-green-500 text-xl" />
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Top Performers
              </h3>
            </div>
            <div className="space-y-3">
              {topPerformers.map((book, index) => (
                <div
                  key={index}
                  className={`${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } rounded-lg p-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white`}
                      style={{ backgroundColor: COLORS[index] }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {book.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {book.total} total orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">
                      {book.rate}%
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      fulfilled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-lg p-6`}
          >
            <div className="flex items-center gap-2 mb-4">
              <FaArrowDown className="text-orange-500 text-xl" />
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Needs Attention
              </h3>
            </div>
            <div className="space-y-3">
              {bottomPerformers.map((book, index) => (
                <div
                  key={index}
                  className={`${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } rounded-lg p-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-orange-500`}
                    >
                      !
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {book.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {book.pending} pending orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">
                      {book.rate}%
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      fulfilled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Pie Chart */}
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-lg p-6`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Order Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div
            className={`${
              isDark ? "bg-gray-800" : "bg-white"
            } rounded-xl shadow-lg p-6`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Overall Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Radar Chart */}
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-lg p-6`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Performance Comparison Radar
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={isDark ? "#374151" : "#e5e7eb"} />
              <PolarAngleAxis
                dataKey="book"
                tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
              />
              <Radar
                name="Fulfillment Rate"
                dataKey="fulfillment"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Radar
                name="Order Volume"
                dataKey="volume"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Book Performance Comparison Bar Chart */}
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-lg p-6`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Total vs Shipped by Book
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bookComparisonData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#374151" : "#e5e7eb"}
              />
              <XAxis
                dataKey="name"
                stroke={isDark ? "#9ca3af" : "#6b7280"}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="total"
                fill="#3b82f6"
                name="Total Orders"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="shipped"
                fill="#10b981"
                name="Shipped"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Book Cards - Scrollable Grid */}
        <div
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-lg p-6`}
        >
          <h3
            className={`text-lg font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            All Books Overview ({Object.keys(bookData).length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {bookComparisonData.map((book, index) => (
              <div
                key={index}
                className={`${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-650"
                    : "bg-gray-50 hover:bg-gray-100"
                } rounded-lg p-4 transition-all duration-200 border-l-4 hover:shadow-md cursor-pointer group`}
                style={{ borderLeftColor: COLORS[index % COLORS.length] }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4
                    className={`font-semibold text-sm ${
                      isDark ? "text-white" : "text-gray-900"
                    } group-hover:scale-105 transition-transform`}
                  >
                    {book.name}
                  </h4>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Total:
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {book.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Shipped:
                    </span>
                    <span className="font-bold text-green-500">
                      {book.shipped}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Pending:
                    </span>
                    <span className="font-bold text-yellow-500">
                      {book.pending}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div
                      className={`w-full ${
                        isDark ? "bg-gray-600" : "bg-gray-200"
                      } rounded-full h-2`}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${book.rate}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <p
                      className={`text-xs mt-1 text-right ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {book.rate}% Complete
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

export default Dashboard;