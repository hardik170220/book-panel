"use client";
import React, { useState, useEffect } from "react";
import {
  FaBook,
  FaShoppingCart,
  FaChartLine,
  FaCalendarCheck,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaBoxes,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaClipboardList,
  FaSync,
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
import Header from "./Header";
import Link from "next/link";

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

// API endpoint
const DASHBOARD_API = "https://us-central1-adhyatm-parivar-main.cloudfunctions.net/getDashboardData";
const DASHBOARD_REFRESH_API = "https://updatedashboarddata-fahifz22ha-uc.a.run.app";

const Dashboard = () => {
  const [bookData, setBookData] = useState({});
  const [overallMetrics, setOverallMetrics] = useState({
    totalOrders: 0,
    totalShipped: 0,
    totalPending: 0,
    fulfillmentRate: 0,
    avgOrdersPerBook: 0,
    totalBooks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentOrdersCount, setRecentOrdersCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);

      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(DASHBOARD_API);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }

      const { bookData, recentOrdersCount, overallMetrics, updateTimestamp } = result.data;

      // Update state with fetched data
      setBookData(bookData);
      setRecentOrdersCount(recentOrdersCount);
      setOverallMetrics(overallMetrics);
      setLastRefresh(new Date(updateTimestamp));

      console.log("Dashboard data loaded successfully");
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(
        error.message || "Failed to load dashboard data. Please try again."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Manual refresh function
  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      console.log("Calling refresh API to update dashboard data...");
      const refreshResponse = await fetch(DASHBOARD_REFRESH_API);

      // 🔥 If API returns 429 (rate limit), show its JSON message
      if (refreshResponse.status === 429) {
        const rateLimitData = await refreshResponse.json();

        setError(rateLimitData.error || "Rate limit active. Please try again later.");
        setIsRefreshing(false);
        return;
      }

      // Any non-200 status except 429 is a real error
      if (!refreshResponse.ok) {
        throw new Error(`Refresh API error! status: ${refreshResponse.status}`);
      }

      const refreshResult = await refreshResponse.json();
      console.log("Refresh API response:", refreshResult);

      console.log("Fetching updated dashboard data...");
      await loadDashboardData(true);

      console.log("Dashboard refreshed successfully!");
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      setError(
        error.message || "Failed to refresh dashboard data. Please try again."
      );
      setIsRefreshing(false);
    }
  };


  // Extract metrics
  const {
    totalOrders,
    totalShipped,
    totalPending,
    fulfillmentRate,
    avgOrdersPerBook,
    totalBooks,
  } = overallMetrics;

  // Prepare chart data
  const bookComparisonData = Object.entries(bookData)
    .map(([key, value]) => ({
      name: value.displayName,
      collectionName: value.collectionName,
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-100 dark:bg-red-900 p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData(true)}
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <FaBook className="text-green-500 text-2xl animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Loading dashboard data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  transition-colors duration-200">
      <Header />
      <div className="p-4 md:p-6 space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            {lastRefresh && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200">
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

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200">
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

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200">
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

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200">
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

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 shadow-lg transform hover:scale-105 transition-transform duration-200">
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
                <span>{totalBooks} books</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Book Cards - Scrollable Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">
            All Books Overview ({totalBooks})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {bookComparisonData.map((book, index) => (
              <Link
                href={`/admin/bookorder/view-submission?book=${book.collectionName}`}
                key={index}
                className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg p-4 transition-all duration-200 border-l-4 hover:shadow-md cursor-pointer group"
                style={{ borderLeftColor: COLORS[index % COLORS.length] }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
                    {book.name}
                  </h4>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {book.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipped:
                    </span>
                    <span className="font-bold text-green-500">
                      {book.shipped}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Pending:
                    </span>
                    <span className="font-bold text-yellow-500">
                      {book.pending}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${book.rate}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1 text-right text-gray-600 dark:text-gray-400">
                      {book.rate}% Complete
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>
        </div>

        {/* Recent Orders Summary Card */}
        <Link href="/admin/bookorder/recent-orders">
          <div href="/admin/bookorder/recent-orders" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-lg my-6 p-6 cursor-pointer transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-xl shadow-lg">
                  <FaClipboardList className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    View All Book Orders
                  </h3>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    View all order activity and details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-4xl font-bold text-cyan-600">
                    {recentOrdersCount}
                  </p>
                  <p className="text-sm text-cyan-700 dark:text-cyan-400">
                    orders in 7 days
                  </p>
                </div>
                <FaArrowRight className="text-3xl text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Click to view detailed order information
                </span>
                <span className="font-semibold text-cyan-600">
                  View Details →
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Top and Bottom Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaArrowUp className="text-green-500 text-xl" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Top Performers
              </h3>
            </div>
            <div className="space-y-3">
              {topPerformers.map((book, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: COLORS[index] }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {book.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {book.total} total orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">
                      {book.rate}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      fulfilled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaArrowDown className="text-orange-500 text-xl" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Needs Attention
              </h3>
            </div>
            <div className="space-y-3">
              {bottomPerformers.map((book, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-orange-500">
                      !
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {book.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {book.pending} pending orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">
                      {book.rate}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            Performance Comparison Radar
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="book" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
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
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Book Performance Comparison Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            Total vs Shipped by Book
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bookComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
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


      </div>
    </div>
  );
};

export default Dashboard;