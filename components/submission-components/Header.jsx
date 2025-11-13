"use client"
import React, { useState, useEffect, useRef } from "react";
import { 
  FaDownload, 
  FaFileExcel, 
  FaFilePdf, 
  FaSun, 
  FaMoon, 
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
  FaSearch,
  FaBook
} from 'react-icons/fa';
import { TbBorderAll } from "react-icons/tb";
import { MdLibraryAdd, MdOutlineDashboard } from "react-icons/md";
import * as XLSX from "xlsx";
import * as pdfMake from "pdfmake/build/pdfmake";
import { generateShippingLabelsPDF } from "../../app/utils/shpping-label-generator";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Header = ({
  totalCopies,
  data,
  title,
  filterDeliveryType,
  setFilterDeliveryType,
  filteredRecords,
  onFilterClick,
  activeFilterCount = 0
}) => {
  const [copiesFilter, setCopiesFilter] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookMenuOpen, setIsBookMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [theme, setTheme] = useState('light');
  const router = useRouter();
  
  // ✅ Use NextAuth session to get user info
  const { data: session, status } = useSession();
  const user = session?.user;
  
  const bookMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Get current page
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const currentBook = searchParams.get('book');
  const isDashboardPage = pathname === '/' || pathname === '/admin/bookorder';
  const isRecentOrdersPage = pathname === '/admin/bookorder/recent-orders';

  // Theme detection
  useEffect(() => {
    const checkTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  };

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://getbookordercollections-fahifz22ha-uc.a.run.app/');
        const data = await response.json();
        
        if (data.success && data.bookNames) {
          const bookData = data.bookNames.map(collection => {
            const bookId = collection.replace(/-bookorder$/i, '');
            const bookName = bookId
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            return {
              id: bookId,
              name: bookName,
              collection: collection,
            };
          });
          
          setBooks(bookData);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bookMenuRef.current && !bookMenuRef.current.contains(event.target)) {
        setIsBookMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter books based on search
  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current selection display
  const getCurrentSelection = () => {
    if (isRecentOrdersPage) return "All Recent Orders";
    if (isDashboardPage) return "Dashboard";
    if (currentBook) {
      const book = books.find(b => b.id === currentBook);
      return book ? book.name : "Select Book";
    }
    return "Select Book";
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear any local storage items
      localStorage.removeItem("admin-ui-forms");
      
      // Sign out using NextAuth
      await signOut({ redirect: false });
      
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      router.push("/");
    } finally {
      setShowLogoutConfirm(false);
      setIsLoggingOut(false);
    }
  };
  
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    return btoa(
      bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
  };

  // Utility function to detect script
  const detectScript = (text) => {
    if (!text) return "latin";
    const devanagariPattern = /[\u0900-\u097F]/;
    const gujaratiPattern = /[\u0A80-\u0AFF]/;

    if (devanagariPattern.test(text)) return "devanagari";
    if (gujaratiPattern.test(text)) return "gujarati";
    return "latin";
  };

  const loadFontsAndPreparePDF = async (data) => {
    try {
      // Load both Gujarati and Hindi fonts
      const gujaratiFontPath = "/AnekGujarati-Regular.ttf";
      const hindiFontPath = "/Karma-Regular.ttf";

      const [gujaratiFontResponse, hindiFontResponse] = await Promise.all([
        fetch(gujaratiFontPath),
        fetch(hindiFontPath),
      ]);

      const [gujaratiFontBuffer, hindiFontBuffer] = await Promise.all([
        gujaratiFontResponse.arrayBuffer(),
        hindiFontResponse.arrayBuffer(),
      ]);

      const gujaratiFontBase64 = arrayBufferToBase64(gujaratiFontBuffer);
      const hindiFontBase64 = arrayBufferToBase64(hindiFontBuffer);

      // Define fonts
      const fonts = {
        AnekGujarati: {
          normal: "AnekGujarati-Regular.ttf",
          bold: "AnekGujarati-Regular.ttf",
          italics: "AnekGujarati-Regular.ttf",
          bolditalics: "AnekGujarati-Regular.ttf",
        },
        NotoSansDevanagari: {
          normal: "Karma-Regular.ttf",
          bold: "Karma-Regular.ttf",
          italics: "Karma-Regular.ttf",
          bolditalics: "Karma-Regular.ttf",
        },
      };

      // Virtual file system for fonts
      const vfs = {
        "AnekGujarati-Regular.ttf": gujaratiFontBase64,
        "Karma-Regular.ttf": hindiFontBase64,
      };

      // Prepare table data
      const headers = [
        "Date & Time",
        "Name",
        "Mobile",
        "City",
        "Address",
        "Pincode",
        "State",
        "Copies",
        "Delivery",
        "TrackingId"
      ];

      const rows = data.map((item) => [
        {
          text: new Date(item.timestamp).toLocaleString("en-IN"),
          font: "AnekGujarati",
        },
        {
          text: item["नाम"] + item["उपनाम"],
          font:
            detectScript(item["नाम"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["मोबाइल नंबर"],
          font:
            detectScript(item["मोबाइल नंबर"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["शहर"],
          font:
            detectScript(item["शहर"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] ,
          font:
            detectScript(item["એડ્રેસ/एड्रेस"]) || detectScript(item["એડ્રેસ"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["पिनकोड"],
          font:
            detectScript(item["पिनकोड"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["राज्य"],
          font:
            detectScript(item["राज्य"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item["નકલ"],
          font:
            detectScript(item["નકલ"]) === "devanagari"
              ? "NotoSansDevanagari"
              : "AnekGujarati",
        },
        {
          text: item.deliveryType || "-",
          font: "AnekGujarati",
        },
        {
          text: item.parcelId || "-",
          font: "AnekGujarati",
        },
      ]);

      // PDF document definition
      const docDefinition = {
        pageSize: "A4",
        pageOrientation: "landscape",
        content: [
          {
            text: `${title}-Order Report`,
            style: "header",
            margin: [0, 0, 0, 20],
          },
          {
            table: {
              headerRows: 1,
              widths: Array(headers.length).fill("auto"),
              body: [
                headers.map((header) => ({
                  text: header,
                  style: "tableHeader",
                  font: "AnekGujarati",
                })),
                ...rows,
              ],
            },
            layout: {
              hLineWidth: (i) => 0.5,
              vLineWidth: (i) => 0.5,
              hLineColor: (i) => "#aaa",
              vLineColor: (i) => "#aaa",
              paddingLeft: (i) => 4,
              paddingRight: (i) => 4,
              paddingTop: (i) => 4,
              paddingBottom: (i) => 4,
            },
          },
        ],
        defaultStyle: {
          font: "AnekGujarati",
          fontSize: 10,
        },
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: "white",
            fillColor: "#111827",
          },
        },
      };

      return { docDefinition, fonts, vfs };
    } catch (error) {
      console.error("Error preparing PDF:", error);
      throw error;
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    try {
      const { docDefinition, fonts, vfs } = await loadFontsAndPreparePDF(data);

      const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);

      pdfDoc.download(`${title}.pdf`);
      setIsExportOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Generate shipping labels function
  const generateShippingLabels = async () => {
    console.log(filteredRecords,"filteredRecords");
    try {
      await generateShippingLabelsPDF(data,title);
      setIsExportOpen(false);
    } catch (error) {
      console.error("Error generating shipping labels:", error);
      alert("Error generating shipping labels. Please try again.");
    }
  };

  const exportToCSV = () => {
    // Define the headers to match PDF format
    const headers = [
      "Date & Time",
      "Name",
      "Mobile",
      "City",
      "Address",
      "Pincode",
      "State",
      "Copies",
      "Delivery",
      "TrackingId"
    ];

    // Format the data to match the headers
    const formattedData = data.map(item => ({
      "Date & Time": new Date(item.timestamp).toLocaleString("en-IN"),
      "Name": item["नाम"] + item["उपनाम"],
      "Mobile": item["मोबाइल नंबर"],
      "City": item["शहर"],
      "Address": item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"],
      "Pincode": item["पिनकोड"],
      "State": item["राज्य"],
      "Copies": item["નકલ"],
      "Delivery": item.deliveryType || "-",
      "TrackingId": item.parcelId || "-"
    }));

    // Create the worksheet with the formatted data
    const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
    
    // Set column widths to make the data more readable
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    // Create a new workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");

    // Write the file and download it
    XLSX.writeFile(wb, `${title}.xlsx`);
    setIsExportOpen(false);
  };


  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 font-poppins bg-card border-b border-border shadow-sm">
        <div className="px-4 sm:px-6">
          {/* Main Header Row */}
          <div className="flex items-center justify-end h-16 gap-4">
            {/* <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href='/bookorder' className="">
                <img src="/logo.png" className="w-8" alt="Logo" />
              </Link>
            </div> */}

            {/* Stats and Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Book/Page Selector */}
              <div className="relative flex-1 w-[15rem] max-w-xs" ref={bookMenuRef}>
                <button
                  onClick={() => setIsBookMenuOpen(!isBookMenuOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FaBook className="flex-shrink-0 text-blue-600 dark:text-blue-400" size={14} />
                    <span className="truncate">{getCurrentSelection()}</span>
                  </div>
                  {isBookMenuOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>

                {/* Dropdown Menu */}
                {isBookMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-xl border border-border overflow-hidden z-50">
                    {/* Search Box */}
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                        <input
                          type="text"
                          placeholder="Search books..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                        />
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {/* Dashboard */}
                      <a
                        href="/admin/bookorder"
                        className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                          isDashboardPage ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                        }`}
                      >
                        <MdOutlineDashboard size={18} />
                        <span>Dashboard</span>
                      </a>

                      {/* All Recent Orders */}
                      <a
                        href="/admin/bookorder/recent-orders"
                        className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                          isRecentOrdersPage ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                        }`}
                      >
                        <FaBook size={16} />
                        <span>All Recent Orders</span>
                      </a>

                      {/* go to the form builder */}
                      {/* ✅ Show "Create a form" only for authorized roles */}
                      {user && (user.role === "super admin") && (
                        <a
                          href="/admin/forms"
                          className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                            pathname === '/admin/forms' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                          }`}
                        >
                          <MdLibraryAdd size={20} />
                          <span>Create a form</span>
                        </a>
                      )}

                      {/* Divider */}
                      <div className="border-t border-border my-1"></div>

                      {/* Book List */}
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      ) : filteredBooks.length > 0 ? (
                        filteredBooks.map(book => (
                          <a
                            key={book.id}
                            href={`/admin/bookorder/view-submission?book=${book.id}`}
                            className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                              currentBook === book.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-foreground'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-md bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {book.name.charAt(0)}
                            </div>
                            <span className="truncate">{book.name}</span>
                          </a>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No books found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Dropdown */}
              {!isDashboardPage && !isRecentOrdersPage && (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <FaDownload size={12} />
                    <span className="hidden sm:inline">Export</span>
                    {isExportOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                  </button>

                  {isExportOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-card rounded-lg shadow-xl border border-border overflow-hidden z-50">
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-muted text-foreground transition-colors"
                      >
                        <FaFileExcel size={16} className="text-green-600" />
                        <span>Excel/CSV</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-muted text-foreground transition-colors"
                      >
                        <FaFilePdf size={16} className="text-red-600" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={generateShippingLabels}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-muted text-foreground transition-colors"
                      >
                        <TbBorderAll size={18} className="text-blue-600" />
                        <span>Shipping Labels</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Filter Button with Badge */}
              {!isDashboardPage && !isRecentOrdersPage && (
                <button
                  onClick={onFilterClick}
                  className="relative flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors"
                >
                  <FaFilter size={12} />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}

              {/* Theme Toggle */}
              {/* <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <FaSun className="text-yellow-400" size={18} />
                ) : (
                  <FaMoon className="text-muted-foreground" size={18} />
                )}
              </button> */}

              {/* User & Logout */}
              {/* <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
                <button
                  onClick={handleLogoutClick}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  title="Logout"
                >
                  <FaSignOutAlt size={16} />
                </button>
              </div> */}

              {/* Mobile Logout */}
              <button
                onClick={handleLogoutClick}
                className="md:hidden p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                title="Logout"
              >
                <FaSignOutAlt size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fadeIn p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Confirm Logout</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to logout from your account?
              </p>
            </div>
            <div className="px-6 py-4 bg-muted/50 flex justify-end gap-3">
              <button
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
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
    </>
  );
};

export default Header;


// import React, { useState } from "react";
// import { 
//   FaDownload, 
//   FaFileExcel, 
//   FaFilePdf, 
//   FaStickerMule, 
//   FaSun, 
//   FaMoon, 
//   FaFilter,
//   FaChevronDown,
//   FaChevronUp
// } from 'react-icons/fa';
// import { TbBorderAll } from "react-icons/tb";

// import * as XLSX from "xlsx";
// import * as pdfMake from "pdfmake/build/pdfmake";
// import { useTheme } from "@/utils/ThemeProvider";
// import { generateShippingLabelsPDF } from "../../utils/shpping-label-generator"; // Import the function

// const Header = ({
//   totalCopies,
//   data,
//   title,
//   filterDeliveryType,
//   setFilterDeliveryType,
//   filteredRecords,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [copiesFilter, setCopiesFilter] = useState(0); // New state for copies filter
//   const { theme, toggleTheme } = useTheme();

//   const [isExportOpen, setIsExportOpen] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
   
//   const arrayBufferToBase64 = (buffer) => {
//     const bytes = new Uint8Array(buffer);
//     return btoa(
//       bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
//     );
//   };

//   // Utility function to detect script
//   const detectScript = (text) => {
//     if (!text) return "latin";
//     const devanagariPattern = /[\u0900-\u097F]/;
//     const gujaratiPattern = /[\u0A80-\u0AFF]/;

//     if (devanagariPattern.test(text)) return "devanagari";
//     if (gujaratiPattern.test(text)) return "gujarati";
//     return "latin";
//   };

//   const loadFontsAndPreparePDF = async (data) => {
//     try {
//       // Load both Gujarati and Hindi fonts
//       const gujaratiFontPath = "/AnekGujarati-Regular.ttf";
//       const hindiFontPath = "/Karma-Regular.ttf";

//       const [gujaratiFontResponse, hindiFontResponse] = await Promise.all([
//         fetch(gujaratiFontPath),
//         fetch(hindiFontPath),
//       ]);

//       const [gujaratiFontBuffer, hindiFontBuffer] = await Promise.all([
//         gujaratiFontResponse.arrayBuffer(),
//         hindiFontResponse.arrayBuffer(),
//       ]);

//       const gujaratiFontBase64 = arrayBufferToBase64(gujaratiFontBuffer);
//       const hindiFontBase64 = arrayBufferToBase64(hindiFontBuffer);

//       // Define fonts
//       const fonts = {
//         AnekGujarati: {
//           normal: "AnekGujarati-Regular.ttf",
//           bold: "AnekGujarati-Regular.ttf",
//           italics: "AnekGujarati-Regular.ttf",
//           bolditalics: "AnekGujarati-Regular.ttf",
//         },
//         NotoSansDevanagari: {
//           normal: "Karma-Regular.ttf",
//           bold: "Karma-Regular.ttf",
//           italics: "Karma-Regular.ttf",
//           bolditalics: "Karma-Regular.ttf",
//         },
//       };

//       // Virtual file system for fonts
//       const vfs = {
//         "AnekGujarati-Regular.ttf": gujaratiFontBase64,
//         "Karma-Regular.ttf": hindiFontBase64,
//       };

//       // Prepare table data
//       const headers = [
//         "Date & Time",
//         "Name",
//         "Mobile",
//         "City",
//         "Address",
//         "Pincode",
//         "State",
//         "Copies",
//         "Delivery",
//         "TrackingId"
//       ];

//       const rows = data.map((item) => [
//         {
//           text: new Date(item.timestamp).toLocaleString("en-IN"),
//           font: "AnekGujarati",
//         },
//         {
//           text: item["नाम"] + item["उपनाम"],
//           font:
//             detectScript(item["नाम"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["मोबाइल नंबर"],
//           font:
//             detectScript(item["मोबाइल नंबर"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["शहर"],
//           font:
//             detectScript(item["शहर"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] ,
//           font:
//             detectScript(item["એડ્રેસ/एड्रेस"]) || detectScript(item["એડ્રેસ"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["पिनकोड"],
//           font:
//             detectScript(item["पिनकोड"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["राज्य"],
//           font:
//             detectScript(item["राज्य"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["નકલ"],
//           font:
//             detectScript(item["નકલ"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item.deliveryType || "-",
//           font: "AnekGujarati",
//         },
//         {
//           text: item.parcelId || "-",
//           font: "AnekGujarati",
//         },
//       ]);

//       // PDF document definition
//       const docDefinition = {
//         pageSize: "A4",
//         pageOrientation: "landscape",
//         content: [
//           {
//             text: `${title}-Order Report`,
//             style: "header",
//             margin: [0, 0, 0, 20],
//           },
//           {
//             table: {
//               headerRows: 1,
//               widths: Array(headers.length).fill("auto"),
//               body: [
//                 headers.map((header) => ({
//                   text: header,
//                   style: "tableHeader",
//                   font: "AnekGujarati",
//                 })),
//                 ...rows,
//               ],
//             },
//             layout: {
//               hLineWidth: (i) => 0.5,
//               vLineWidth: (i) => 0.5,
//               hLineColor: (i) => "#aaa",
//               vLineColor: (i) => "#aaa",
//               paddingLeft: (i) => 4,
//               paddingRight: (i) => 4,
//               paddingTop: (i) => 4,
//               paddingBottom: (i) => 4,
//             },
//           },
//         ],
//         defaultStyle: {
//           font: "AnekGujarati",
//           fontSize: 10,
//         },
//         styles: {
//           header: {
//             fontSize: 18,
//             bold: true,
//             margin: [0, 0, 0, 10],
//           },
//           tableHeader: {
//             bold: true,
//             fontSize: 11,
//             color: "white",
//             fillColor: "#111827",
//           },
//         },
//       };

//       return { docDefinition, fonts, vfs };
//     } catch (error) {
//       console.error("Error preparing PDF:", error);
//       throw error;
//     }
//   };

//   // Export to PDF function
//   const exportToPDF = async () => {
//     try {
//       const { docDefinition, fonts, vfs } = await loadFontsAndPreparePDF(data);

//       const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);

//       pdfDoc.download(`${title}.pdf`);
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       alert("Error generating PDF. Please try again.");
//     }
//   };

//   // Generate shipping labels function
//   const generateShippingLabels = async () => {
//     try {
//       await generateShippingLabelsPDF(data, title, filterDeliveryType, copiesFilter);
//     } catch (error) {
//       console.error("Error generating shipping labels:", error);
//       alert("Error generating shipping labels. Please try again.");
//     }
//   };

//   const exportToCSV = () => {
//     // Define the headers to match PDF format
//     const headers = [
//       "Date & Time",
//       "Name",
//       "Mobile",
//       "City",
//       "Address",
//       "Pincode",
//       "State",
//       "Copies",
//       "Delivery",
//       "TrackingId"
//     ];

//     // Format the data to match the headers
//     const formattedData = data.map(item => ({
//       "Date & Time": new Date(item.timestamp).toLocaleString("en-IN"),
//       "Name": item["नाम"] + item["उपनाम"],
//       "Mobile": item["मोबाइल नंबर"],
//       "City": item["शहर"],
//       "Address": item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"],
//       "Pincode": item["पिनकोड"],
//       "State": item["राज्य"],
//       "Copies": item["નકલ"],
//       "Delivery": item.deliveryType || "-",
//       "TrackingId": item.parcelId || "-"
//     }));

//     // Create the worksheet with the formatted data
//     const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
    
//     // Set column widths to make the data more readable
//     const colWidths = headers.map(() => ({ wch: 20 }));
//     ws['!cols'] = colWidths;
    
//     // Create a new workbook and add the worksheet
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Registrations");

//     // Write the file and download it
//     XLSX.writeFile(wb, `${title}.xlsx`);
//   };
//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 shadow-md dark:bg-gray-800 bg-gray-50 transition-colors duration-200">
//       <div className="container dark:bg-gray-800 bg-gray-200 px-8 flex flex-col items-end justify-end">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo and Title - Left Section */}
//           <div className="flex items-center space-x-2">
//             {/* <img className="w-6 h-6" src="/hero1.png" alt="Logo" /> */}
//             {/* <h1 className="text-base uppercase font-semibold tracking-wider dark:text-white">
//               {title}
//             </h1> */}
//           </div>

//           {/* Order Count - Middle Section */}
//           <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 px-3 mr-2 py-2 rounded-md">
//             <span className="text-sm font-medium mr-2 dark:text-gray-200">
//               Orders/Copies:
//             </span>
//             <span className="text-sm font-bold dark:text-gray-200">
//               {filteredRecords}/{totalCopies}
//             </span>
//           </div>

//           {/* Action Buttons - Right Section */}
//           <div className="flex items-center space-x-3">
//             {/* Export Dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setIsExportOpen(!isExportOpen)}
//                 className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
//               >
//                 <FaDownload size={12} />
//                 <span className="hidden sm:inline">Export</span>
//                 {isExportOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
//               </button>

//               {/* Export Dropdown Menu */}
//               {isExportOpen && (
//                 <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border dark:border-gray-600">
//                   <button
//                     onClick={() => {
//                       exportToCSV();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <FaFileExcel size={14} className="text-green-600 mr-2" />
//                     Excel/CSV
//                   </button>
//                   <button
//                     onClick={() => {
//                       exportToPDF();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <FaFilePdf size={14} className="text-red-600 mr-2" />
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => {
//                       generateShippingLabels();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <TbBorderAll size={16} className="text-blue-600 mr-2" />
//                     Shipping Labels
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Filter Toggle Button */}
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className="flex items-center space-x-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded hover:bg-gray-400 dark:hover:bg-gray-600"
//             >
//               <FaFilter size={12} />
//               <span className="hidden sm:inline">Filters</span>
//               {showFilters ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
//             </button>

//             {/* Theme Toggle Button */}
//             <button
//               onClick={toggleTheme}
//               className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//               aria-label="Toggle Dark Mode"
//             >
//               {theme === 'dark' ? (
//                 <FaSun className="text-yellow-400" size={18} />
//               ) : (
//                 <FaMoon className="text-gray-700" size={18} />
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Filter Panel - Conditional Render */}
//         {showFilters && (
//           <div className="py-3 px-2 border-t dark:border-gray-700  dark:bg-gray-800">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
//               {/* Delivery Type Filter */}
//               <div className="flex items-center space-x-2">
//                 <label htmlFor="filterDeliveryType" className="text-sm font-medium dark:text-gray-200">
//                   Delivery Type:
//                 </label>
//                 <select
//                   id="filterDeliveryType"
//                   value={filterDeliveryType}
//                   onChange={(e) => setFilterDeliveryType(e.target.value)}
//                   className="text-sm rounded px-3 py-1.5 border focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="parcelId">Parcel</option>
//                   <option value="courierId">Courier</option>
//                   <option value="handtohand">Hand to Hand</option>
//                   <option value="unassigned">Unassigned</option>
//                 </select>
//               </div>

//               {/* Copies Filter */}
//               <div className="flex items-center space-x-2">
//                 <label htmlFor="filterCopies" className="text-sm font-medium dark:text-gray-200">
//                   Min Copies:
//                 </label>
//                 <input
//                   id="filterCopies"
//                   type="number"
//                   min="0"
//                   value={copiesFilter}
//                   onChange={(e) => setCopiesFilter(parseInt(e.target.value) || 0)}
//                   className="text-sm rounded px-3 py-1.5 border w-16 focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
//                 />
//               </div>

//               {/* Mobile-only Order Count */}
//               <div className="flex md:hidden items-center">
//                 <span className="text-sm font-medium mr-2 dark:text-gray-200">
//                   Orders/Copies:
//                 </span>
//                 <span className="text-sm font-bold dark:text-gray-200">
//                   {filteredRecords}/{totalCopies}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// export default Header;


// import React, { useState } from "react";
// import { 
//   FaDownload, 
//   FaFileExcel, 
//   FaFilePdf, 
//   FaStickerMule, 
//   FaSun, 
//   FaMoon, 
//   FaFilter,
//   FaChevronDown,
//   FaChevronUp,
//   FaLanguage
// } from 'react-icons/fa';
// import { TbBorderAll } from "react-icons/tb";

// import * as XLSX from "xlsx";
// import * as pdfMake from "pdfmake/build/pdfmake";
// import { useTheme } from "@/utils/ThemeProvider";
// import { generateShippingLabelsPDF } from "../../utils/shpping-label-generator";

// const Header = ({
//   totalCopies,
//   data,
//   title,
//   filterDeliveryType,
//   setFilterDeliveryType,
//   filteredRecords,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [copiesFilter, setCopiesFilter] = useState(0);
//   const { theme, toggleTheme } = useTheme();

//   const [isExportOpen, setIsExportOpen] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [transliterateLanguage, setTransliterateLanguage] = useState("none"); // none, hi, gu, en
//   const [isTransliterating, setIsTransliterating] = useState(false);
   
//   const arrayBufferToBase64 = (buffer) => {
//     const bytes = new Uint8Array(buffer);
//     return btoa(
//       bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
//     );
//   };

//   // Utility function to detect script
//   const detectScript = (text) => {
//     if (!text) return "latin";
//     const devanagariPattern = /[\u0900-\u097F]/;
//     const gujaratiPattern = /[\u0A80-\u0AFF]/;

//     if (devanagariPattern.test(text)) return "devanagari";
//     if (gujaratiPattern.test(text)) return "gujarati";
//     return "latin";
//   };

//   // Transliteration function using Google Input Tools API
//   const transliterateText = async (text, targetLang) => {
//     if (!text || text.trim() === "" || targetLang === "none") {
//       return text;
//     }

//     // Skip if text is already in latin script and target is english
//     if (targetLang === "en" && detectScript(text) === "latin") {
//       return text;
//     }

//     try {
//       // For addresses with commas, split and transliterate each part
//       const parts = text.split(',').map(part => part.trim()).filter(part => part);
      
//       if (parts.length > 1) {
//         // Transliterate each part separately
//         const transliteratedParts = await Promise.all(
//           parts.map(async (part) => {
//             try {
//               const response = await fetch(
//                 `https://inputtools.google.com/request?text=${encodeURIComponent(part)}&itc=${targetLang}-t-i0-und`,
//                 {
//                   method: "GET",
//                 }
//               );

//               const result = await response.json();
              
//               if (result && result[0] === "SUCCESS" && result[1] && result[1][0] && result[1][0][1]) {
//                 return result[1][0][1][0];
//               }
              
//               return part;
//             } catch (error) {
//               console.error("Part transliteration error:", error);
//               return part;
//             }
//           })
//         );
        
//         // Join back with commas
//         return transliteratedParts.join(', ');
//       } else {
//         // Single part, transliterate normally
//         const response = await fetch(
//           `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${targetLang}-t-i0-und`,
//           {
//             method: "GET",
//           }
//         );

//         const result = await response.json();
        
//         if (result && result[0] === "SUCCESS" && result[1] && result[1][0] && result[1][0][1]) {
//           return result[1][0][1][0];
//         }
        
//         return text;
//       }
//     } catch (error) {
//       console.error("Transliteration error:", error);
//       return text;
//     }
//   };

//   // Batch transliteration with delay to avoid rate limiting
//   const transliterateData = async (dataArray, targetLang) => {
//     const transliteratedData = [];
    
//     for (let i = 0; i < dataArray.length; i++) {
//       const item = dataArray[i];
      
//       // Add a small delay to avoid rate limiting
//       if (i > 0 && i % 10 === 0) {
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }

//       const transliteratedItem = {
//         ...item,
//         "Name": await transliterateText(item["Name"], targetLang),
//         "City": await transliterateText(item["City"], targetLang),
//         "Address": await transliterateText(item["Address"], targetLang),
//         "State": await transliterateText(item["State"], targetLang),
//       };

//       transliteratedData.push(transliteratedItem);
//     }

//     return transliteratedData;
//   };

//   const loadFontsAndPreparePDF = async (data) => {
//     try {
//       // Load both Gujarati and Hindi fonts
//       const gujaratiFontPath = "/AnekGujarati-Regular.ttf";
//       const hindiFontPath = "/Karma-Regular.ttf";

//       const [gujaratiFontResponse, hindiFontResponse] = await Promise.all([
//         fetch(gujaratiFontPath),
//         fetch(hindiFontPath),
//       ]);

//       const [gujaratiFontBuffer, hindiFontBuffer] = await Promise.all([
//         gujaratiFontResponse.arrayBuffer(),
//         hindiFontResponse.arrayBuffer(),
//       ]);

//       const gujaratiFontBase64 = arrayBufferToBase64(gujaratiFontBuffer);
//       const hindiFontBase64 = arrayBufferToBase64(hindiFontBuffer);

//       // Define fonts
//       const fonts = {
//         AnekGujarati: {
//           normal: "AnekGujarati-Regular.ttf",
//           bold: "AnekGujarati-Regular.ttf",
//           italics: "AnekGujarati-Regular.ttf",
//           bolditalics: "AnekGujarati-Regular.ttf",
//         },
//         NotoSansDevanagari: {
//           normal: "Karma-Regular.ttf",
//           bold: "Karma-Regular.ttf",
//           italics: "Karma-Regular.ttf",
//           bolditalics: "Karma-Regular.ttf",
//         },
//       };

//       // Virtual file system for fonts
//       const vfs = {
//         "AnekGujarati-Regular.ttf": gujaratiFontBase64,
//         "Karma-Regular.ttf": hindiFontBase64,
//       };

//       // Prepare table data
//       const headers = [
//         "Date & Time",
//         "Name",
//         "Mobile",
//         "City",
//         "Address",
//         "Pincode",
//         "State",
//         "Copies",
//         "Delivery",
//         "TrackingId"
//       ];

//       const rows = data.map((item) => [
//         {
//           text: new Date(item.timestamp).toLocaleString("en-IN"),
//           font: "AnekGujarati",
//         },
//         {
//           text: item["नाम"] + item["उपनाम"],
//           font:
//             detectScript(item["नाम"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["मोबाइल नंबर"],
//           font:
//             detectScript(item["मोबाइल नंबर"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["शहर"],
//           font:
//             detectScript(item["शहर"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] ,
//           font:
//             detectScript(item["એડ્રેસ/एड्रेस"]) || detectScript(item["એડ્રેસ"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["पिनकोड"],
//           font:
//             detectScript(item["पिनकोड"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["राज्य"],
//           font:
//             detectScript(item["राज्य"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item["નકલ"],
//           font:
//             detectScript(item["નકલ"]) === "devanagari"
//               ? "NotoSansDevanagari"
//               : "AnekGujarati",
//         },
//         {
//           text: item.deliveryType || "-",
//           font: "AnekGujarati",
//         },
//         {
//           text: item.parcelId || "-",
//           font: "AnekGujarati",
//         },
//       ]);

//       // PDF document definition
//       const docDefinition = {
//         pageSize: "A4",
//         pageOrientation: "landscape",
//         content: [
//           {
//             text: `${title}-Order Report`,
//             style: "header",
//             margin: [0, 0, 0, 20],
//           },
//           {
//             table: {
//               headerRows: 1,
//               widths: Array(headers.length).fill("auto"),
//               body: [
//                 headers.map((header) => ({
//                   text: header,
//                   style: "tableHeader",
//                   font: "AnekGujarati",
//                 })),
//                 ...rows,
//               ],
//             },
//             layout: {
//               hLineWidth: (i) => 0.5,
//               vLineWidth: (i) => 0.5,
//               hLineColor: (i) => "#aaa",
//               vLineColor: (i) => "#aaa",
//               paddingLeft: (i) => 4,
//               paddingRight: (i) => 4,
//               paddingTop: (i) => 4,
//               paddingBottom: (i) => 4,
//             },
//           },
//         ],
//         defaultStyle: {
//           font: "AnekGujarati",
//           fontSize: 10,
//         },
//         styles: {
//           header: {
//             fontSize: 18,
//             bold: true,
//             margin: [0, 0, 0, 10],
//           },
//           tableHeader: {
//             bold: true,
//             fontSize: 11,
//             color: "white",
//             fillColor: "#111827",
//           },
//         },
//       };

//       return { docDefinition, fonts, vfs };
//     } catch (error) {
//       console.error("Error preparing PDF:", error);
//       throw error;
//     }
//   };

//   // Export to PDF function
//   const exportToPDF = async () => {
//     try {
//       const { docDefinition, fonts, vfs } = await loadFontsAndPreparePDF(data);

//       const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);

//       pdfDoc.download(`${title}.pdf`);
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       alert("Error generating PDF. Please try again.");
//     }
//   };

//   // Generate shipping labels function
//   const generateShippingLabels = async () => {
//     try {
//       await generateShippingLabelsPDF(data, title, filterDeliveryType, copiesFilter);
//     } catch (error) {
//       console.error("Error generating shipping labels:", error);
//       alert("Error generating shipping labels. Please try again.");
//     }
//   };

//   const exportToCSV = async () => {
//     try {
//       setIsTransliterating(true);

//       // Define the headers to match PDF format
//       const headers = [
//         "Date & Time",
//         "Name",
//         "Mobile",
//         "City",
//         "Address",
//         "Pincode",
//         "State",
//         "Copies",
//         "Delivery",
//         "TrackingId"
//       ];

//       // Format the data to match the headers
//       let formattedData = data.map(item => ({
//         "Date & Time": new Date(item.timestamp).toLocaleString("en-IN"),
//         "Name": item["नाम"] + item["उपनाम"],
//         "Mobile": item["मोबाइल नंबर"],
//         "City": item["शहर"],
//         "Address": item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"],
//         "Pincode": item["पिनकोड"],
//         "State": item["राज्य"],
//         "Copies": item["નકલ"],
//         "Delivery": item.deliveryType || "-",
//         "TrackingId": item.parcelId || "-"
//       }));

//       // Transliterate if a language is selected
//       if (transliterateLanguage !== "none") {
//         formattedData = await transliterateData(formattedData, transliterateLanguage);
//       }

//       // Create the worksheet with the formatted data
//       const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
      
//       // Set column widths to make the data more readable
//       const colWidths = headers.map(() => ({ wch: 20 }));
//       ws['!cols'] = colWidths;
      
//       // Create a new workbook and add the worksheet
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, "Registrations");

//       // Write the file and download it
//       const filename = transliterateLanguage !== "none" 
//         ? `${title}_${transliterateLanguage}.xlsx`
//         : `${title}.xlsx`;
      
//       XLSX.writeFile(wb, filename);
      
//       setIsTransliterating(false);
//     } catch (error) {
//       console.error("Error exporting to CSV:", error);
//       alert("Error exporting to CSV. Please try again.");
//       setIsTransliterating(false);
//     }
//   };

//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 shadow-md dark:bg-gray-800 bg-gray-50 transition-colors duration-200">
//       <div className="container dark:bg-gray-800 bg-gray-200 px-8 flex flex-col items-end justify-end">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo and Title - Left Section */}
//           <div className="flex items-center space-x-2">
//             {/* <img className="w-6 h-6" src="/hero1.png" alt="Logo" /> */}
//             {/* <h1 className="text-base uppercase font-semibold tracking-wider dark:text-white">
//               {title}
//             </h1> */}
//           </div>

//           {/* Order Count - Middle Section */}
//           <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 px-3 mr-2 py-2 rounded-md">
//             <span className="text-sm font-medium mr-2 dark:text-gray-200">
//               Orders/Copies:
//             </span>
//             <span className="text-sm font-bold dark:text-gray-200">
//               {filteredRecords}/{totalCopies}
//             </span>
//           </div>

//           {/* Action Buttons - Right Section */}
//           <div className="flex items-center space-x-3">
//             {/* Export Dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setIsExportOpen(!isExportOpen)}
//                 disabled={isTransliterating}
//                 className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
//               >
//                 <FaDownload size={12} />
//                 <span className="hidden sm:inline">
//                   {isTransliterating ? "Processing..." : "Export"}
//                 </span>
//                 {isExportOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
//               </button>

//               {/* Export Dropdown Menu */}
//               {isExportOpen && (
//                 <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border dark:border-gray-600">
//                   <button
//                     onClick={() => {
//                       exportToCSV();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <FaFileExcel size={14} className="text-green-600 mr-2" />
//                     Excel/CSV
//                   </button>
//                   <button
//                     onClick={() => {
//                       exportToPDF();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <FaFilePdf size={14} className="text-red-600 mr-2" />
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => {
//                       generateShippingLabels();
//                       setIsExportOpen(false);
//                     }}
//                     className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
//                   >
//                     <TbBorderAll size={16} className="text-blue-600 mr-2" />
//                     Shipping Labels
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Filter Toggle Button */}
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className="flex items-center space-x-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded hover:bg-gray-400 dark:hover:bg-gray-600"
//             >
//               <FaFilter size={12} />
//               <span className="hidden sm:inline">Filters</span>
//               {showFilters ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
//             </button>

//             {/* Theme Toggle Button */}
//             <button
//               onClick={toggleTheme}
//               className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//               aria-label="Toggle Dark Mode"
//             >
//               {theme === 'dark' ? (
//                 <FaSun className="text-yellow-400" size={18} />
//               ) : (
//                 <FaMoon className="text-gray-700" size={18} />
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Filter Panel - Conditional Render */}
//         {showFilters && (
//           <div className="py-3 px-2 border-t dark:border-gray-700  dark:bg-gray-800">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
//               {/* Delivery Type Filter */}
//               <div className="flex items-center space-x-2">
//                 <label htmlFor="filterDeliveryType" className="text-sm font-medium dark:text-gray-200">
//                   Delivery Type:
//                 </label>
//                 <select
//                   id="filterDeliveryType"
//                   value={filterDeliveryType}
//                   onChange={(e) => setFilterDeliveryType(e.target.value)}
//                   className="text-sm rounded px-3 py-1.5 border focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="parcelId">Parcel</option>
//                   <option value="courierId">Courier</option>
//                   <option value="handtohand">Hand to Hand</option>
//                   <option value="unassigned">Unassigned</option>
//                 </select>
//               </div>

//               {/* Transliteration Language Filter */}
//               <div className="flex items-center space-x-2">
//                 <FaLanguage className="dark:text-gray-200" size={16} />
//                 <label htmlFor="transliterateLanguage" className="text-sm font-medium dark:text-gray-200">
//                   Excel Language:
//                 </label>
//                 <select
//                   id="transliterateLanguage"
//                   value={transliterateLanguage}
//                   onChange={(e) => setTransliterateLanguage(e.target.value)}
//                   className="text-sm rounded px-3 py-1.5 border focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
//                 >
//                   <option value="none">Original</option>
//                   <option value="hi">Hindi (हिंदी)</option>
//                   <option value="gu">Gujarati (ગુજરાતી)</option>
//                   <option value="en">English</option>
//                 </select>
//               </div>

//               {/* Copies Filter */}
//               <div className="flex items-center space-x-2">
//                 <label htmlFor="filterCopies" className="text-sm font-medium dark:text-gray-200">
//                   Min Copies:
//                 </label>
//                 <input
//                   id="filterCopies"
//                   type="number"
//                   min="0"
//                   value={copiesFilter}
//                   onChange={(e) => setCopiesFilter(parseInt(e.target.value) || 0)}
//                   className="text-sm rounded px-3 py-1.5 border w-16 focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
//                 />
//               </div>

//               {/* Mobile-only Order Count */}
//               <div className="flex md:hidden items-center">
//                 <span className="text-sm font-medium mr-2 dark:text-gray-200">
//                   Orders/Copies:
//                 </span>
//                 <span className="text-sm font-bold dark:text-gray-200">
//                   {filteredRecords}/{totalCopies}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// export default Header;