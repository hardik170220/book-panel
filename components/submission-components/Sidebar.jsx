import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FaBook, FaSignOutAlt, FaBars } from "react-icons/fa";
import { LuArrowLeftToLine } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { MdOutlineDashboard } from "react-icons/md";

const Sidebar = ({ onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const currentBook = searchParams.get('book');
  const isDashboardPage = pathname === '/' || pathname === '/pages/dashboard';
  
  const { canEdit, canDelete, isAdmin, isViewer, userName, userRole } = useAuth();

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://getbookordercollections-fahifz22ha-uc.a.run.app/');
        const data = await response.json();
        
        if (data.success && data.collections) {
          // Transform collections into book objects
          const bookData = data.collections.map(collection => {
            // Remove '-bookorder' suffix and get book ID
            const bookId = collection.replace(/-bookorder$/i, '');
            
            // Format book name (capitalize and add spaces)
            const bookName = bookId
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join('-');
            
            return {
              id: bookId,
              name: bookName,
              collection: collection,
              // You can add default images or fetch them separately
              src: `/books/${bookId}.jpg`
            };
          });
          
          setBooks(bookData);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        // Fallback to empty array on error
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const isActive = (bookId) => {
    return currentBook === bookId;
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };
  
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  return (
    <>
      <div className={`fixed left-0 top-0 h-full ${isExpanded ? 'w-64' : 'w-20'} flex flex-col transition-all bg-gray-50 dark:bg-gray-800 dark:text-gray-200 duration-300 shadow-lg z-[999]`}>
        {/* Header with toggle button */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          {isExpanded ? (
            <>
              <div className="w-4"></div>
              <div className="flex gap-4 items-center justify-center">
                <img src="/hero1.png" className="h-8" alt="adhyatm" />
                <Link href="/" className="font-bold text-xl">Dashboard</Link>
              </div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full"
              >
                <LuArrowLeftToLine size={18} />
              </button>
            </>
          ) : (
            <>
              <div></div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full mx-auto"
              >
                <FaBars size={16} />
              </button>
              <div></div>
            </>
          )}
        </div>
        
        {/* Book Categories */}
        <div className="py-6 scrollwidth flex-grow dark:bg-gray-800 bg-gray-200 overflow-y-auto">
          <h3 className={`px-4 text-xs uppercase font-semibold mb-4 ${!isExpanded && 'text-center'}`}>
            {isExpanded ? 'Book Orders' : 'Books'}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <nav className="flex flex-col font-nunito font-semibold text-sm">
              <a 
                  href={`/`}
                  className={`flex items-center py-3 px-4 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 ${
                    isDashboardPage
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-r-4 border-blue-500 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div 
                    className={`${isExpanded ? "mr-3 h-10 w-10" : "mx-auto w-10 h-10"} rounded-md bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold`}
                  >
                  
                   <MdOutlineDashboard size={22} />
                  

                  </div>
                  {isExpanded && <span>Dashboard</span>}
                </a>
              {books.map(book => (
                <a 
                  key={book.id}
                  href={`/pages/bookorder?book=${book.id}`}
                  className={`flex items-center py-3 px-4 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 ${
                    isActive(book.id) 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-r-4 border-blue-500 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div 
                    className={`${isExpanded ? "mr-3 h-10 w-10" : "mx-auto w-10 h-10"} rounded-md bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold`}
                  >
                    {book.name.charAt(0)}
                  </div>
                  {isExpanded && <span>{book.name}</span>}
                </a>
              ))}
            </nav>
          )}
        </div>
        
        {/* User & Logout Section */}
        <div className="mt-auto border-t dark:border-gray-700">
          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} p-4`}>
            {isExpanded && (
              <div className="flex-grow">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-xs">Adhyatm Parivar</div>
              </div>
            )}
            
            <button 
              onClick={handleLogoutClick} 
              className={`flex items-center text-sm ${isExpanded ? 'px-4' : ''} py-2 rounded-sm transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400`}
              title="Logout"
            >
              <FaSignOutAlt size={16} className={isExpanded ? "mr-2" : ""} />
              {isExpanded && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900/40 dark:text-gray-200 text-sm bg-opacity-50 flex items-center justify-center z-[1000] animate-fadeIn">
          <div className="rounded-sm shadow-xl w-80 bg-white dark:bg-gray-800 dark:text-gray-200 max-w-md mx-4 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">Confirm Logout</h3>
            </div>
            <div className="px-6 py-4">
              <p className="">Are you sure you want to logout?</p>
            </div>
            <div className="px-6 py-3 flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-1 transition hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-1 text-white bg-red-500 rounded-sm hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

// import Link from "next/link";
// import React, { useState } from "react";
// import { FaBook, FaSignOutAlt, FaBars } from "react-icons/fa";
// import { LuArrowLeftToLine } from "react-icons/lu";
// import { useAuth } from "../context/AuthContext";

// const Sidebar = ({ onLogout }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
//   const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
//     const { canEdit, canDelete, isAdmin, isViewer, userName, userRole } = useAuth();

  
//   const isActive = (bookId) => {
//     return pathname.includes(`/pages/bookorderdata/${bookId}`);
//   };

//   const books = [
//     { id: "udayanmantri", name: "Udayanmantri", src: "/udayanmantri-book.jpg", active: true },
//     { id: "mahabharat", name: "Mahabharat", src: "/Mahabharat.jpg", active: false },
//     { id: "ravanni-bhitarma", name: "Ravanni-Bhitarma", src: "/ravanni-bhitarma.jpg", active: false },
//     { id: "bhagwan-mahavir", name: "Bhagwan-Mahavir", src: "/bhagwan-mahavir.jpg", active: false },
//     { id: "panchang-2082", name: "Panchang-2082", src: "/calendar-2082.jpg", active: false },
//     { id: "aapno-gyanvaibhav", name: "Aapno-Gyanvaibhav", src: "/aapnogyanvaibhav.jpg", active: false },
//     { id: "sanskrutam-saralam", name: "Sanskrutam-Saralam", src: "/prathamyatra.jpg", active: false },
//   ];
  
//   const handleLogoutClick = () => {
//     setShowLogoutConfirm(true);
//   };
  
//   const confirmLogout = () => {
//     setShowLogoutConfirm(false);
//     onLogout();
//   };
  
//   const cancelLogout = () => {
//     setShowLogoutConfirm(false);
//   };
  
//   return (
//     <>
//       <div className={`fixed  left-0 top-0 h-full ${isExpanded ? 'w-64' : 'w-20'} flex flex-col transition-all bg-gray-50 dark:bg-gray-800 dark:text-gray-200 duration-300 shadow-lg z-[999]`}>
//         {/* Header with toggle button */}
//         <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
//           {isExpanded ? (
//             <>
//               <div className="w-4"></div>
//               <div className="flex gap-4 items-center justify-center">
//                 <img src="/hero1.png" className="h-8" alt="adhyatm" />
//               <Link href="/" className="font-bold text-xl">Dashboard</Link>
//               </div>
//               <button 
//                 onClick={() => setIsExpanded(!isExpanded)}
//                 className="p-2 rounded-full"
//               >
//                 <LuArrowLeftToLine size={18} />
//               </button>
//             </>
//           ) : (
//             <>
//               <div></div>
//               <button 
//                 onClick={() => setIsExpanded(!isExpanded)}
//                 className="p-2 rounded-full mx-auto"
//               >
//                 <FaBars size={16} />
//               </button>
//               <div></div>
//             </>
//           )}
//         </div>
        
//         {/* Book Categories */}
//         <div className="py-6 scrollwidth flex-grow dark:bg-gray-800 bg-gray-200 overflow-y-auto">
//           <h3 className={`px-4 text-xs uppercase font-semibold mb-4 ${!isExpanded && 'text-center'}`}>
//             {isExpanded ? 'Book Orders' : 'Books'}
//           </h3>
          
//           <nav className="flex flex-col font-nunito font-semibold uppercase text-sm">
//             {books.map(book => (
//               <a 
//                 key={book.id}
//                 href={`/pages/bookorderdata/${book.id}`}
//                 className={`flex items-center py-3 px-4 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 ${
//                   isActive(book.id) 
//                     ? 'bg-blue-100 dark:bg-blue-900/30 border-r-4 border-blue-500 text-blue-700 dark:text-blue-300' 
//                     : 'text-gray-700 dark:text-gray-300'
//                 }`}
//               >
//                 <img 
//                   src={book.src} 
//                   className={`${isExpanded ? "mr-3 h-10 w-10" : "mx-auto w-10 h-10"} rounded-md`} 
//                   alt={book.name} 
//                 />
//                 {isExpanded && <span>{book.name}</span>}
//               </a>
//             ))}
//           </nav>
//         </div>
        
//         {/* User & Logout Section */}
//         <div className="mt-auto border-t dark:border-gray-700">
//           <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} p-4`}>
//             {isExpanded && (
//               <div className="flex-grow">
//                 <div className="font-medium truncate">{userName}</div>
//                 <div className="text-xs">Adhyatm Parivar</div>
//               </div>
//             )}
            
//             <button 
//               onClick={handleLogoutClick} 
//               className={`flex items-center text-sm ${isExpanded ? 'px-4' : ''} py-2 rounded-sm transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400`}
//               title="Logout"
//             >
//               <FaSignOutAlt size={16} className={isExpanded ? "mr-2" : ""} />
//               {isExpanded && <span>Logout</span>}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Logout Confirmation Modal */}
//       {showLogoutConfirm && (
//         <div className="fixed inset-0 bg-white dark:bg-gray-900/40 dark:text-gray-200 text-sm bg-opacity-50 flex items-center justify-center z-[1000] animate-fadeIn">
//           <div className="rounded-sm shadow-xl w-80 bg-white dark:bg-gray-800 dark:text-gray-200 max-w-md mx-4 overflow-hidden animate-scaleIn">
//             <div className="px-6 py-4 border-b">
//               <h3 className="text-lg font-medium">Confirm Logout</h3>
//             </div>
//             <div className="px-6 py-4">
//               <p className="">Are you sure you want to logout?</p>
//             </div>
//             <div className="px-6 py-3 flex justify-end space-x-3">
//               <button
//                 onClick={cancelLogout}
//                 className="px-4 py-1 transition hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmLogout}
//                 className="px-4 py-1 text-white bg-red-500 rounded-sm hover:bg-red-600 transition"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Sidebar;