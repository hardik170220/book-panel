// "use client";
// import React, { useState } from "react";
// import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
// import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
// import { FaDownload, FaFileCsv, FaFileExcel, FaFilePdf, FaSortUp, FaSortDown, FaSort, FaCheckSquare, FaSquare } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import * as pdfMake from "pdfmake/build/pdfmake";

// const TableUI = ({ 
//   data, 
//   loading, 
//   columns, 
//   extraData, 
//   bookName,
//   filteredRecords,
//   totalCopies,
//   actionButtons = null,
//   title = "Data Records",
//   defaultItemsPerPage = 10,
//   showExport = true,
//   onRowClick = null,
//   onMarkDelivered = null,
// }) => {
//   // console.log("TableUI data:", data);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
//   const [selectedRows, setSelectedRows] = useState(new Set());
//   const [showDeliveryModal, setShowDeliveryModal] = useState(false);
//   const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

//   const filteredData = data.filter((item) => {
//     if (!searchTerm.trim()) return true;
    
//     const allColumns = [...columns, ...extraData];
//     return allColumns.some((column) => {
//       const value = item[column.field];
//       return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
//     });
//   });

//   const sortedData = React.useMemo(() => {
//     if (!sortConfig.key || !sortConfig.direction) {
//       return filteredData;
//     }

//     return [...filteredData].sort((a, b) => {
//       let aValue = a[sortConfig.key];
//       let bValue = b[sortConfig.key];
//       console.log(aValue, bValue);

//       if (sortConfig.key.includes('.')) {
//         const keys = sortConfig.key.split('.');
//         aValue = keys.reduce((obj, key) => obj?.[key], a);
//         bValue = keys.reduce((obj, key) => obj?.[key], b);
//       }

//       if (aValue == null) aValue = '';
//       if (bValue == null) bValue = '';

//       const aStr = String(aValue).toLowerCase();
//       const bStr = String(bValue).toLowerCase();

//       const aNum = Number(aValue);
//       const bNum = Number(bValue);
      
//       if (!isNaN(aNum) && !isNaN(bNum)) {
//         return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
//       }

//       if (aStr < bStr) {
//         return sortConfig.direction === 'asc' ? -1 : 1;
//       }
//       if (aStr > bStr) {
//         return sortConfig.direction === 'asc' ? 1 : -1;
//       }
//       return 0;
//     });
//   }, [filteredData, sortConfig]);

//   const handleSort = (field) => {
//     let direction = 'asc';
    
//     if (sortConfig.key === field) {
//       if (sortConfig.direction === 'asc') {
//         direction = 'desc';
//       } else if (sortConfig.direction === 'desc') {
//         direction = null;
//       }
//     }
    
//     setSortConfig({ key: field, direction });
//     setCurrentPage(1);
//   };

//   const getSortIcon = (field) => {
//     if (sortConfig.key !== field) {
//       return <FaSort className="inline ml-1 text-gray-400" />;
//     }
//     if (sortConfig.direction === 'asc') {
//       return <FaSortUp className="inline ml-1 text-blue-600" />;
//     }
//     if (sortConfig.direction === 'desc') {
//       return <FaSortDown className="inline ml-1 text-blue-600" />;
//     }
//     return <FaSort className="inline ml-1 text-gray-400" />;
//   };

//   const setColorDeliveryWise = (item) => {
//     if (item.deliveredDate) return "bg-green-200 text-green-800";
//     if (item.deliveryType === "courierId") return "bg-green-200 text-green-800";
//     if (item.deliveryType === "parcelId") return "bg-yellow-200 text-yellow-800";
//     if (item.deliveryType === "handtohand") return "bg-blue-200 text-blue-800";
//     return "";
//   };

//   const toggleRowSelection = (item, rowIndex) => {
//     const newSelected = new Set(selectedRows);
//     const itemKey = rowIndex + "-" + (item.parcelId || item["मोबाइल नंबर"] || rowIndex);
    
//     if (newSelected.has(itemKey)) {
//       newSelected.delete(itemKey);
//     } else {
//       newSelected.add(itemKey);
//     }
    
//     setSelectedRows(newSelected);
//   };

//   const toggleSelectAll = () => {
//     if (selectedRows.size === currentItems.length) {
//       setSelectedRows(new Set());
//     } else {
//       const allKeys = currentItems.map((item, idx) => {
//         return (indexOfFirstItem + idx) + "-" + (item.parcelId || item["मोबाइल नंबर"] || idx);
//       });
//       setSelectedRows(new Set(allKeys));
//     }
//   };

//   const isRowSelected = (item, rowIndex) => {
//     const itemKey = rowIndex + "-" + (item.parcelId || item["मोबाइल नंबर"] || rowIndex);
//     return selectedRows.has(itemKey);
//   };

//   const handleMarkAsDelivered = async () => {
//     if (selectedRows.size === 0) {
//       alert("Please select at least one row");
//       return;
//     }

//     const selectedItems = currentItems.filter((item, idx) => {
//       const itemKey = (indexOfFirstItem + idx) + "-" + (item.parcelId || item["मोबाइल नंबर"] || idx);
//       return selectedRows.has(itemKey);
//     });

//     if (onMarkDelivered) {
//       await onMarkDelivered(selectedItems, deliveryDate);
//     }

//     setSelectedRows(new Set());
//     setShowDeliveryModal(false);
//   };

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(sortedData.length / itemsPerPage);

//   const formatCellContent = (item, field) => {
//     if (!item || field === undefined) return 'N/A';
    
//     if (field === 'timestamp' && item.timestamp) {
//       return new Date(item.timestamp).toLocaleDateString("en-IN") + " " + new Date(item.timestamp).toLocaleTimeString("en-IN");
//     }

//     if (field === 'deliveredDate' && item.deliveredDate) {
//       return new Date(item.deliveredDate).toLocaleDateString("en-IN");
//     }
    
//     const isSanskrutamSaralamBook = bookName === "Sanskrutam Saralam Book" ? true : false;
    
//     if (isSanskrutamSaralamBook && field.startsWith('book_quantities.')) {
//       const bookQuantityField = field.replace('book_quantities.', '');
//       const bookQuantities = item.book_quantities;
      
//       if (bookQuantities && typeof bookQuantities === 'object') {
//         const value = bookQuantities[bookQuantityField];
//         return value !== undefined && value !== null ? value : 'N/A';
//       }
//       return 'N/A';
//     }
    
//     const value = item[field];
//     return value !== undefined && value !== null ? value : 'N/A';
//   };

//   const allColumns = [...columns, ...extraData];
//   const isMahabharatBook = bookName === "Mahabharat Book" ? true : false;

//   return (
//     <div className={" py-4"  + (isMahabharatBook ? ' mt-16' : '')}>
//       <div className="flex w-full  flex-col md:flex-row justify-between items-center mb-4">
//         <div className="flex bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 py-2 px-8 w-full items-center justify-between">
//            <h1 className="text-lg capitalize font-poppins font-bold">
//              {bookName} {" "}
//              <span className="lowercase text-gray-400 dark:text-gray-500">
//                {"(" + totalCopies + " copies of " + filteredRecords + " orders)"}
//              </span>
//            </h1>
           
//           <div className="w-full md:w-1/3 mb-4 md:mb-0">
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full p-2 text-sm bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 border rounded border-gray-600 dark:border-gray-400"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>

//       {selectedRows.size > 0 && (
//         <div className="bg-blue-100 font-poppins dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded p-3 mb-4 flex items-center justify-between">
//           <span className="font-semibold">
//             {selectedRows.size} row(s) selected
//           </span>
//           <button
//             onClick={() => setShowDeliveryModal(true)}
//             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
//           >
//             Mark as Delivered
//           </button>
//         </div>
//       )}

//       {showDeliveryModal && (
//         <div className="fixed inset-0 font-poppins bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
//             <h2 className="text-xl font-bold mb-4">Mark as Delivered</h2>
//             <p className="mb-4 text-gray-600 dark:text-gray-400">
//               Set delivery date for {selectedRows.size} selected order(s)
//             </p>
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold">Delivery Date:</label>
//               <input
//                 type="date"
//                 value={deliveryDate}
//                 onChange={(e) => setDeliveryDate(e.target.value)}
//                 className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
//               />
//             </div>
//             <div className="flex justify-end space-x-3">
//               <button
//                 onClick={() => setShowDeliveryModal(false)}
//                 className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleMarkAsDelivered}
//                 className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="overflow-x-auto max-w-[62rem] lg:max-w-6xl w-full">
//         <Table className="table-auto  text-sm border-collapse border-b w-full">
//           <Thead className="text-sm">
//             <Tr>
//               <Th className="border-b py-3 text-left px-2 w-10">
//                 <button
//                   onClick={toggleSelectAll}
//                   className="text-lg hover:text-blue-600"
//                 >
//                   {selectedRows.size === currentItems.length && currentItems.length > 0 ? 
//                     <FaCheckSquare /> : <FaSquare />
//                   }
//                 </button>
//               </Th>
//               {allColumns.map((column, index) => (
//                 <Th 
//                   key={index} 
//                   className="border-b py-3 text-left px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
//                   onClick={() => handleSort(column.field)}
//                 >
//                   <div style={{fontSize:".7rem"}} className="flex font-poppins items-center">
//                     {column.header}
//                     {getSortIcon(column.field)}
//                   </div>
//                 </Th>
//               ))}
//               {actionButtons && <Th className="border-b py-3 text-center px-2">Actions</Th>}
//             </Tr>
//           </Thead>
//           <Tbody className="font-poppins">
//             {currentItems.map((item, rowIndex) => {
//               const actualRowIndex = indexOfFirstItem + rowIndex;
//               const isSelected = isRowSelected(item, actualRowIndex);
              
//               return (
//                 <Tr 
//                   key={rowIndex} 
//                   className={setColorDeliveryWise(item) + (isSelected ? ' ring-2 ring-blue-500' : '')}
//                 >
//                   <Td className="border-b px-2 py-2">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         toggleRowSelection(item, actualRowIndex);
//                       }}
//                       className="text-base hover:text-blue-600"
//                     >
//                       {isSelected ? <FaCheckSquare /> : <FaSquare />}
//                     </button>
//                   </Td>
//                   {allColumns.map((column, colIndex) => (
//                     <Td 
//                       key={colIndex} 
//                       className="border-b px-2 capitalize py-2"
//                       onClick={() => onRowClick && onRowClick(item, actualRowIndex)}
//                       style={onRowClick ? { cursor: 'pointer',fontSize:"0.85rem" } : {fontSize:"0.82rem"}}
//                     >
//                       {formatCellContent(item, column.field)}
//                     </Td>
//                   ))}
//                   {actionButtons && (
//                     <Td className="border-b px-2 py-2">
//                       <div className="flex items-center justify-center space-x-2">
//                         {actionButtons(item, actualRowIndex)}
//                       </div>
//                     </Td>
//                   )}
//                 </Tr>
//               );
//             })}
//           </Tbody>
//         </Table>
//         {!loading && currentItems.length === 0 && (
//           <div className="text-center py-4 text-gray-500 dark:text-gray-400">
//             No records found
//           </div>
//         )}
//       </div>

//       <div className="flex bg-gray-200 dark:bg-gray-800 p-2 justify-between text-sm items-center mt-4">
//         <div>
//           <select
//             className="border p-1 dark:bg-gray-800 dark:border-gray-700"
//             value={itemsPerPage}
//             onChange={(e) => {
//               setItemsPerPage(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//           >
//             <option value={10}>10 per page</option>
//             <option value={25}>25 per page</option>
//             <option value={50}>50 per page</option>
//             <option value={100}>100 per page</option>
//             <option value={data.length}>All Entries</option>
//           </select>
//           <span className="ml-2 text-sm">
//             Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} of {sortedData.length} records
//           </span>
//         </div>
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={() => setCurrentPage(1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
//           >
//             First
//           </button>
//           <button
//             onClick={() => setCurrentPage(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
//           >
//             Prev
//           </button>
//           <span className="px-3 py-1">
//             Page {currentPage} of {totalPages || 1}
//           </span>
//           <button
//             onClick={() => setCurrentPage(currentPage + 1)}
//             disabled={currentPage === totalPages || totalPages === 0}
//             className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
//           >
//             Next
//           </button>
//           <button
//             onClick={() => setCurrentPage(totalPages)}
//             disabled={currentPage === totalPages || totalPages === 0}
//             className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
//           >
//             Last
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TableUI;

"use client";
import React, { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { FaCheckSquare, FaSquare } from "react-icons/fa";

const TableUI = ({ 
  data, 
  loading, 
  columns, 
  extraData, 
  bookName,
  filteredRecords,
  totalCopies,
  actionButtons = null,
  title = "Data Records",
  defaultItemsPerPage = 10,
  showExport = true,
  onRowClick = null,
  onMarkDelivered = null,
}) => {
  // console.log("TableUI data:", data);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  // Sort data by date in descending order (assuming there's a timestamp field)
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [data]);

  const filteredData = sortedData.filter((item) => {
    if (!searchTerm.trim()) return true;
    
    const allColumns = [...columns, ...extraData];
    return allColumns.some((column) => {
      const value = item[column.field];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const setColorDeliveryWise = (item) => {
    if (item.deliveredDate) return "bg-green-200 text-green-800";
    if (item.deliveryType === "courierId") return "bg-green-200 text-green-800";
    if (item.deliveryType === "parcelId") return "bg-yellow-200 text-yellow-800";
    if (item.deliveryType === "handtohand") return "bg-blue-200 text-blue-800";
    return "";
  };

  const toggleRowSelection = (item, rowIndex) => {
    const newSelected = new Set(selectedRows);
    const itemKey = rowIndex + "-" + (item.parcelId || item["मोबाइल नंबर"] || rowIndex);
    
    if (newSelected.has(itemKey)) {
      newSelected.delete(itemKey);
    } else {
      newSelected.add(itemKey);
    }
    
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === currentItems.length) {
      setSelectedRows(new Set());
    } else {
      const allKeys = currentItems.map((item, idx) => {
        return (indexOfFirstItem + idx) + "-" + (item.parcelId || item["मोबाइल नंबर"] || idx);
      });
      setSelectedRows(new Set(allKeys));
    }
  };

  const isRowSelected = (item, rowIndex) => {
    const itemKey = rowIndex + "-" + (item.parcelId || item["मोबाइल नंबर"] || rowIndex);
    return selectedRows.has(itemKey);
  };

  const handleMarkAsDelivered = async () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one row");
      return;
    }

    const selectedItems = currentItems.filter((item, idx) => {
      const itemKey = (indexOfFirstItem + idx) + "-" + (item.parcelId || item["मोबाइल नंबर"] || idx);
      return selectedRows.has(itemKey);
    });

    if (onMarkDelivered) {
      await onMarkDelivered(selectedItems, deliveryDate);
    }

    setSelectedRows(new Set());
    setShowDeliveryModal(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const formatCellContent = (item, field) => {
    if (!item || field === undefined) return 'N/A';
    
    if (field === 'timestamp' && item.timestamp) {
      return new Date(item.timestamp).toLocaleDateString("en-IN") + " " + new Date(item.timestamp).toLocaleTimeString("en-IN");
    }

    if (field === 'deliveredDate' && item.deliveredDate) {
      return new Date(item.deliveredDate).toLocaleDateString("en-IN");
    }
    
    const isSanskrutamSaralamBook = bookName === "Sanskrutam Saralam Book" ? true : false;
    
    if (isSanskrutamSaralamBook && field.startsWith('book_quantities.')) {
      const bookQuantityField = field.replace('book_quantities.', '');
      const bookQuantities = item.book_quantities;
      
      if (bookQuantities && typeof bookQuantities === 'object') {
        const value = bookQuantities[bookQuantityField];
        return value !== undefined && value !== null ? value : 'N/A';
      }
      return 'N/A';
    }
    
    const value = item[field];
    return value !== undefined && value !== null ? value : 'N/A';
  };

  const allColumns = [...columns, ...extraData];
  const isMahabharatBook = bookName === "Mahabharat Book" ? true : false;

  return (
    <div className={"flex flex-col min-h-screen py-4" + (isMahabharatBook ? ' mt-16' : '')}>
      {/* Fixed Search Header */}
      <div className="sticky top-0 z-40 bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 py-2 px-4 md:px-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-lg capitalize font-poppins font-bold mb-2 md:mb-0">
            {bookName} {" "}
            <span className="lowercase text-gray-400 dark:text-gray-500">
              {"(" + totalCopies + " copies of " + filteredRecords + " orders)"}
            </span>
          </h1>
          
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 text-sm bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 border rounded border-gray-600 dark:border-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {selectedRows.size > 0 && (
        <div className="bg-blue-100 font-poppins dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded p-3 m-4 flex items-center justify-between">
          <span className="font-semibold">
            {selectedRows.size} row(s) selected
          </span>
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          >
            Mark as Delivered
          </button>
        </div>
      )}

      {showDeliveryModal && (
        <div className="fixed inset-0 font-poppins bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Mark as Delivered</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Set delivery date for {selectedRows.size} selected order(s)
            </p>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Delivery Date:</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsDelivered}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container - Takes remaining space */}
      <div className="flex-1 overflow-x-auto  w-full mx-auto px-4">
        <Table className="table-auto text-sm border-collapse border-b w-full">
          <Thead className="text-sm">
            <Tr>
              <Th className="border-b py-3 text-left px-2 w-10">
                <button
                  onClick={toggleSelectAll}
                  className="text-lg hover:text-blue-600"
                >
                  {selectedRows.size === currentItems.length && currentItems.length > 0 ? 
                    <FaCheckSquare /> : <FaSquare />
                  }
                </button>
              </Th>
              {allColumns.map((column, index) => (
                <Th 
                  key={index} 
                  className="border-b py-3 text-left px-2"
                >
                  <div style={{fontSize:".7rem"}} className="flex font-poppins items-center">
                    {column.header}
                  </div>
                </Th>
              ))}
              {actionButtons && <Th className="border-b py-3 text-center px-2">Actions</Th>}
            </Tr>
          </Thead>
          <Tbody className="font-poppins">
            {currentItems.map((item, rowIndex) => {
              const actualRowIndex = indexOfFirstItem + rowIndex;
              const isSelected = isRowSelected(item, actualRowIndex);
              
              return (
                <Tr 
                  key={rowIndex} 
                  className={setColorDeliveryWise(item) + (isSelected ? ' ring-2 ring-blue-500' : '')}
                >
                  <Td className="border-b px-2 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowSelection(item, actualRowIndex);
                      }}
                      className="text-base hover:text-blue-600"
                    >
                      {isSelected ? <FaCheckSquare /> : <FaSquare />}
                    </button>
                  </Td>
                  {allColumns.map((column, colIndex) => (
                    <Td 
                      key={colIndex} 
                      className="border-b px-2 capitalize py-2"
                      onClick={() => onRowClick && onRowClick(item, actualRowIndex)}
                      style={onRowClick ? { cursor: 'pointer',fontSize:"0.85rem" } : {fontSize:"0.82rem"}}
                    >
                      {formatCellContent(item, column.field)}
                    </Td>
                  ))}
                  {actionButtons && (
                    <Td className="border-b px-2 py-2">
                      <div className="flex items-center justify-center space-x-2">
                        {actionButtons(item, actualRowIndex)}
                      </div>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        {!loading && currentItems.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No records found
          </div>
        )}
      </div>

      {/* Fixed Pagination Footer */}
      <div className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 p-3 border-t border-gray-300 dark:border-gray-700 shadow-lg">
        <div className="max-w-[62rem] lg:max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <select
                className="border p-1 dark:bg-gray-800 dark:border-gray-700 rounded text-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={data.length}>All Entries</option>
              </select>
              <span className="text-sm">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableUI;