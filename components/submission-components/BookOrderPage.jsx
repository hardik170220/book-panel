// "use client";
// import React, { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { FaEye, FaEdit, FaTrash, FaTimes, FaCheck } from "react-icons/fa";
// import { initializeApp } from "firebase/app";
// import {
//   getFirestore,
//   collection,
//   getDocs,
//   query,
//   orderBy,
//   doc,
//   updateDoc,
//   deleteDoc,
// } from "firebase/firestore";
// import Sidebar from "@/app/_components/Sidebar";
// import Header from "@/app/_components/Header";
// import TableUI from "@/app/_components/TableUI";
// import { useAuth } from "@/app/context/AuthContext";

// // Firebase configuration
// ************************************ enter config

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// const DynamicBookOrderPage = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const bookName = searchParams.get("book");

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isLogin, setIsLogin] = useState(null);
//   const [error, setError] = useState(null);
//   const [viewModalOpen, setViewModalOpen] = useState(false);
//   const [currentViewItem, setCurrentViewItem] = useState(null);
//   const [copyStatus, setCopyStatus] = useState(null);
//   const [totalCopies, setTotalCopies] = useState(0);
//   const [filterDeliveryType, setFilterDeliveryType] = useState("all");
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [currentEditItem, setCurrentEditItem] = useState(null);
//   const [parcelId, setParcelId] = useState("");
//   const [deliveryType, setDeliveryType] = useState("parcelId");
//   const [updateStatus, setUpdateStatus] = useState(null);
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
//   const [collectionName, setCollectionName] = useState("");

//   const { canEdit, canDelete, isAdmin, isViewer, userName, userRole } = useAuth();

//   // Book configuration - defines structure for different books
//   const bookConfigs = {
//     "sanskrutam-saralam": {
//       hasBookQuantities: true,
//       hasCopies: false,
//       bookQuantityFields: [
//         { key: "pratham_yatra", label: "Pratham Yatra" },
//         { key: "dwitiy_yatra", label: "Dwitiya Yatra" },
//         { key: "dhatunaamrup_shreni", label: "Dhatunaamrup Shreni" },
//       ],
//     },
//     default: {
//       hasBookQuantities: false,
//       hasCopies: true,
//       copiesField: "નકલ",
//     },
//   };

//   const getBookConfig = () => {
//     const normalizedBookName = bookName?.toLowerCase().replace(/\s+/g, "-");
//     return bookConfigs[normalizedBookName] || bookConfigs.default;
//   };

//   const bookConfig = getBookConfig();

//   // Dynamic table columns based on book configuration
//   const getTableColumns = () => {
//     const baseColumns = [
//       { field: "timestamp", header: "Date & Time" },
//       { field: "नाम", header: "Name" },
//       { field: "मोबाइल नंबर", header: "Mobile" },
//       { field: "शहर", header: "City" },
//       { field: "એડ્રેસ", header: "Address" },
//       { field: "पिनकोड", header: "Pincode" },
//       { field: "राज्य", header: "State" },
//     ];

//     if (bookConfig.hasBookQuantities) {
//       bookConfig.bookQuantityFields.forEach((field) => {
//         baseColumns.push({
//           field: `book_quantities.${field.key}`,
//           header: `${field.label} (Q)`,
//         });
//       });
//     } else if (bookConfig.hasCopies) {
//       baseColumns.push({ field: "નકલ", header: "Copies" });
//     }

//     baseColumns.push(
//       { field: "parcelId", header: "Parcel ID" },
//       { field: "deliveryType", header: "Delivery Type" },
//       { field: "actions", header: "Actions" }
//     );

//     return baseColumns;
//   };

//   const tableColumns = getTableColumns();
//   const extraDataColumns = [];

//   const filteredRecords = data.filter((item) => {
//     if (filterDeliveryType === "all") return true;
//     if (filterDeliveryType === "unassigned") return !item.hasParcel;
//     if (filterDeliveryType === "parcelId") {
//       return item.deliveryType === "parcelId" && item.hasParcel;
//     }
//     return item.deliveryType === filterDeliveryType;
//   }).length;

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const passFromLocalStorage = localStorage.getItem("password");
//       const correctPassword = "mahavir@2550";
//       setIsLogin(
//         passFromLocalStorage === correctPassword ||
//           passFromLocalStorage === "adhyatm@parivar"
//       );
//     }
//   }, []);

//   useEffect(() => {
//     if (isLogin === false) {
//       router.push("/");
//       return;
//     }

//     if (isLogin === true && bookName) {
//       loadBookOrderData();
//     }
//   }, [isLogin, bookName]);

//   const handleView = (item) => {
//     setCurrentViewItem(item);
//     setViewModalOpen(true);
//   };

//   const handleEdit = (item, index) => {
//     setCurrentEditItem({ ...item, index });
//     setParcelId(item.parcelId || "");
//     setDeliveryType(item.deliveryType || "parcelId");
//     setEditModalOpen(true);
//   };

//   const handleDelete = (index) => {
//     setItemToDeleteIndex(index);
//     setDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       const index = itemToDeleteIndex;
//       const itemToDelete = data[index];

//       await deleteDoc(doc(db, collectionName, itemToDelete.id));

//       const newData = [...data];
//       newData.splice(index, 1);
//       setData(newData);

//       setUpdateStatus({
//         type: "success",
//         message: "Order deleted successfully",
//       });
//       setTimeout(() => setUpdateStatus(null), 3000);
//     } catch (error) {
//       console.error("Error deleting order:", error);
//       setUpdateStatus({
//         type: "error",
//         message: "Failed to delete order: " + error.message,
//       });
//       setTimeout(() => setUpdateStatus(null), 5000);
//     } finally {
//       setDeleteModalOpen(false);
//       setItemToDeleteIndex(null);
//     }
//   };

//   const handleSaveParcelId = async () => {
//     try {
//       setUpdateStatus({
//         type: "loading",
//         message: "Saving delivery information...",
//       });

//       const itemToUpdate = currentEditItem;
//       const orderDocRef = doc(db, collectionName, itemToUpdate.id);

//       await updateDoc(orderDocRef, {
//         parcelId: deliveryType === "handtohand" ? "On Hand" : parcelId.trim(),
//         deliveryType: deliveryType,
//         hasParcel: true,
//         lastUpdated: new Date(),
//       });

//       const newData = [...data];
//       newData[currentEditItem.index] = {
//         ...currentEditItem,
//         parcelId: deliveryType === "handtohand" ? "On Hand" : parcelId.trim(),
//         deliveryType: deliveryType,
//         hasParcel: true,
//       };
//       newData.sort((a, b) => b.timestamp - a.timestamp);
//       setData(newData);

//       setUpdateStatus({
//         type: "success",
//         message: "Delivery information saved successfully",
//       });
//       setTimeout(() => setUpdateStatus(null), 3000);

//       setEditModalOpen(false);
//     } catch (error) {
//       console.error("Error saving delivery information:", error);
//       setUpdateStatus({
//         type: "error",
//         message: "Failed to save: " + error.message,
//       });
//       setTimeout(() => setUpdateStatus(null), 5000);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("password");
//     setIsLogin(false);
//     router.push("/");
//   };

//   const handleCopyDetails = () => {
//     if (!currentViewItem) return;

//     let copiesInfo = "";
//     if (bookConfig.hasBookQuantities) {
//       bookConfig.bookQuantityFields.forEach((field) => {
//         const qty = currentViewItem.book_quantities?.[field.key] || 0;
//         copiesInfo += `${field.label}: ${qty}\n`;
//       });
//     } else if (bookConfig.hasCopies) {
//       copiesInfo = `Copies: ${currentViewItem["નકલ"] || currentViewItem["नकल"] || 1}\n`;
//     }

//     const details = `
// Name: ${currentViewItem["नाम"]} ${currentViewItem["उपनाम"] || ""}
// Mobile: ${currentViewItem["मोबाइल नंबर"]}
// City: ${currentViewItem["शहर"]}
// Address: ${currentViewItem["એડ્રેસ"]}
// Pincode: ${currentViewItem["पिनकोड"]}
// State: ${currentViewItem["राज्य"]}
// ${copiesInfo}Parcel ID: ${currentViewItem.parcelId || "Not Assigned"}
//   `.trim();

//     navigator.clipboard
//       .writeText(details)
//       .then(() => {
//         setCopyStatus("Copied!");
//         setTimeout(() => setCopyStatus(null), 2000);
//       })
//       .catch((err) => {
//         console.error("Failed to copy: ", err);
//         setCopyStatus("Failed to copy");
//         setTimeout(() => setCopyStatus(null), 2000);
//       });
//   };

//   const calculateTotalCopies = (dataArray) => {
//     return dataArray.reduce((sum, item) => {
//       if (bookConfig.hasBookQuantities) {
//         const totalBookQty = bookConfig.bookQuantityFields.reduce((total, field) => {
//           return total + (parseInt(item.book_quantities?.[field.key] || 0, 10) || 0);
//         }, 0);
//         return sum + totalBookQty;
//       } else if (bookConfig.hasCopies) {
//         const copies = parseInt(item["નકલ"] || item["नकल"] || 1, 10);
//         return sum + (isNaN(copies) ? 1 : copies);
//       }
//       return sum;
//     }, 0);
//   };

//   const loadBookOrderData = async () => {
//     try {
//       setLoading(true);

//       if (!bookName) {
//         setError("No book name provided");
//         setLoading(false);
//         return;
//       }

//       const normalizedCollectionName = `${bookName
//         // .toLowerCase()
//         .replace(/\s+/g, "-")}-bookorder`;
//         console.log("Loading collection:", normalizedCollectionName);
      
//       setCollectionName(normalizedCollectionName);

//       const ordersCollection = collection(db, normalizedCollectionName);
//       const ordersQuery = query(ordersCollection, orderBy("timestamp", "asc"));
//       const orderSnapshot = await getDocs(ordersQuery);

//       if (!orderSnapshot.empty) {
//         const formattedData = orderSnapshot.docs.map((doc) => {
//           const item = doc.data();
//           const baseData = {
//             id: doc.id,
//             नाम: item["નામ"] || item["नाम"] || "N/A",
//             उपनाम: item["ઉપનામ"] || item["उपनाम"] || "",
//             "मोबाइल नंबर": item["મોબાઈલ નંબર"] || item["मोबाइल नंबर"] || "N/A",
//             शहर: item["શહેર"] || item["शहर"] || "N/A",
//             એડ્રેસ: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] || item["एड्रेस"] || "N/A",
//             पिनकोड: item["પિનકોડ"] || item["पिनकोड"] || "N/A",
//             राज्य: item["રાજ્ય"] || item["राज्य"] || "N/A",
//             parcelId: item.parcelId || "",
//             deliveryType:
//               item.deliveryType || (item.parcelId ? "parcelId" : ""),
//             hasParcel: item.hasParcel || false,
//             timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
//           };

//           if (bookConfig.hasBookQuantities) {
//             baseData.book_quantities = item.book_quantities || {};
//           } else if (bookConfig.hasCopies) {
//             baseData.નકલ = item["નકલ"] || item["नकल"] || 1;
//           }

//           return baseData;
//         });

//         setData(formattedData);
//         setTotalCopies(calculateTotalCopies(formattedData));
//       } else {
//         setError("No records found for this book");
//       }
//     } catch (error) {
//       console.error("Error loading data:", error);
//       setError("Failed to load book orders: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const prepareDataWithActions = () => {
//     return data
//       .filter((item) => {
//         if (filterDeliveryType === "all") return true;
//         if (filterDeliveryType === "unassigned") return !item.hasParcel;
//         if (filterDeliveryType === "parcelId")
//           return item.deliveryType === "parcelId" && item.hasParcel;
//         return item.deliveryType === filterDeliveryType;
//       })
//       .map((item, index) => {
//         const processedItem = {
//           ...item,
//           नाम: `${item["नाम"]} ${item["उपनाम"] || ""}`,
//           timestamp: item.timestamp,
//           originalIndex: index,
//         };

//         // Add book quantities to the flat structure for table display
//         if (bookConfig.hasBookQuantities && item.book_quantities) {
//           bookConfig.bookQuantityFields.forEach((field) => {
//             processedItem[`book_quantities.${field.key}`] = 
//               item.book_quantities[field.key] || 0;
//           });
//         }

//         // Add actions
//         processedItem.actions = (
//           <div className="flex items-center justify-center space-x-2">
//             <button
//               onClick={() => handleView(item)}
//               className="p-1 text-green-700 rounded"
//               title="View Details"
//             >
//               <FaEye size={14} />
//             </button>
//             {canEdit && (
//               <button
//                 onClick={() => handleEdit(item, index)}
//                 className="p-1 text-blue-500 rounded"
//                 title="Edit/Add Parcel ID"
//               >
//                 <FaEdit size={14} />
//               </button>
//             )}
//             {canDelete && (
//               <button
//                 onClick={() => handleDelete(index)}
//                 className="p-1 text-red-500 rounded"
//                 title="Delete Order"
//               >
//                 <FaTrash size={14} />
//               </button>
//             )}
//           </div>
//         );

//         return processedItem;
//       });
//   };

//   if (isLogin === null) return null;
//   if (!isLogin) return null;

//   if (error) {
//     return (
//       <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
//         {/* <Sidebar onLogout={handleLogout} userName={userName || "Administrator"} /> */}
//         <div className="flex-1">
//           <div className="p-8 mt-20">
//             <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
//               <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
//                 Error
//               </h2>
//               <p className="text-red-600 dark:text-red-300">{error}</p>
//               <button
//                 onClick={() => router.back()}
//                 className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
//               >
//                 Go Back
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col font-anek bg-white dark:bg-gray-900 dark:text-gray-200 transition-colors duration-200">
//       {/* <Sidebar onLogout={handleLogout} userName={userName || "Administrator"} /> */}

//       <div className="flex-1  transition-all duration-300">
//         <Header
//           totalCopies={totalCopies}
//           filterDeliveryType={filterDeliveryType}
//           setFilterDeliveryType={setFilterDeliveryType}
//           filteredRecords={filteredRecords}
//           data={data}
//           title={`${bookName} Book Orders`}
//         />

//         {/* Status notification */}
//         {updateStatus && (
//           <div
//             className={`fixed top-20 right-4 p-3 rounded shadow-md z-50 ${
//               updateStatus.type === "success"
//                 ? "bg-green-700 text-green-100"
//                 : updateStatus.type === "error"
//                 ? "bg-red-800 text-red-200"
//                 : "bg-blue-100 text-blue-800"
//             }`}
//           >
//             {updateStatus.type === "loading" && (
//               <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent inline-block mr-2"></div>
//             )}
//             {updateStatus.type === "success" && (
//               <FaCheck className="inline-block mr-2" size={14} />
//             )}
//             {updateStatus.type === "error" && (
//               <FaTimes className="inline-block mr-2" size={14} />
//             )}
//             {updateStatus.message}
//           </div>
//         )}

//         {loading ? (
//           <div className="flex justify-center items-center h-screen">
//             <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         ) : (
//           <div className="overflow-x-auto w-full mt-24 sm:mt-20 px-2 sm:px-4">
//             <TableUI
//               data={prepareDataWithActions()}
//               loading={loading}
//               filteredRecords={filteredRecords}
//               totalCopies={totalCopies}
//               columns={tableColumns}
//               extraData={extraDataColumns}
//               bookName={bookName}
//             />
//           </div>
//         )}

//         {/* Edit Modal */}
//         {editModalOpen && (
//           <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn bg-white dark:bg-gray-900/40 dark:text-gray-200">
//             <div className="rounded-sm font-anek p-6 w-full max-w-md animate-scaleIn bg-gray-100 dark:bg-gray-800 dark:text-gray-200 shadow-lg border">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Add Parcel Information</h2>
//                 <button
//                   onClick={() => setEditModalOpen(false)}
//                   className="p-1 rounded-full"
//                 >
//                   <FaTimes size={20} />
//                 </button>
//               </div>

//               <div className="mb-4">
//                 <label
//                   className="block text-sm font-bold mb-2"
//                   htmlFor="deliveryType"
//                 >
//                   Delivery Type
//                 </label>
//                 <select
//                   id="deliveryType"
//                   value={deliveryType}
//                   onChange={(e) => setDeliveryType(e.target.value)}
//                   className="bg-white dark:bg-gray-900 dark:text-gray-200 shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
//                 >
//                   <option value="parcelId">Parcel ID</option>
//                   <option value="courierId">Courier ID</option>
//                   <option value="handtohand">Hand to Hand</option>
//                 </select>
//               </div>

//               {deliveryType !== "handtohand" && (
//                 <div className="mb-4">
//                   <label
//                     className="block text-sm font-bold mb-2"
//                     htmlFor="parcelId"
//                   >
//                     {deliveryType === "parcelId"
//                       ? "Parcel Tracking ID"
//                       : "Courier ID"}
//                   </label>
//                   <input
//                     id="parcelId"
//                     type="text"
//                     value={parcelId}
//                     onChange={(e) => setParcelId(e.target.value)}
//                     className="bg-white dark:bg-gray-900 dark:text-gray-200 shadow appearance-none border placeholder:text-sm rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
//                     placeholder={
//                       deliveryType === "parcelId"
//                         ? "Enter parcel tracking ID"
//                         : "Enter courier ID"
//                     }
//                   />
//                 </div>
//               )}

//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => setEditModalOpen(false)}
//                   className="bg-red-700 hover:bg-red-800 text-gray-200 text-sm font-bold py-1 px-4 rounded-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveParcelId}
//                   className="bg-green-600 hover:bg-green-700 text-sm text-white font-bold py-1 px-4 rounded-sm"
//                 >
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* View Details Modal */}
//         {viewModalOpen && (
//           <div className="bg-white dark:bg-gray-900/40 dark:text-gray-200 fixed inset-0 text-sm bg-opacity-50 flex font-anek items-center justify-center z-50 animate-fadeIn">
//             <div className="bg-gray-200 border dark:bg-gray-800 dark:text-gray-200 rounded-lg p-6 w-full max-w-md animate-scaleIn">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Order Details</h2>
//                 <button
//                   onClick={() => setViewModalOpen(false)}
//                   className="p-1 rounded-full"
//                 >
//                   <FaTimes size={20} />
//                 </button>
//               </div>

//               <div className="mb-4 p-4 rounded-lg">
//                 <div className="grid grid-cols-3 gap-2 mb-2">
//                   <div className="col-span-3">
//                     <p className="text-sm">Name</p>
//                     <p className="font-medium">
//                       {currentViewItem?.["नाम"]}{" "}
//                       {currentViewItem?.["उपनाम"] || ""}
//                     </p>
//                   </div>
//                   <div className="col-span-3">
//                     <p className="text-sm">Mobile Number</p>
//                     <p className="font-medium">
//                       {currentViewItem?.["मोबाइल नंबर"]}
//                     </p>
//                   </div>
//                   <div className="col-span-3">
//                     <p className="text-sm">City</p>
//                     <p className="font-medium">{currentViewItem?.["शहर"]}</p>
//                   </div>
                  
//                   {bookConfig.hasBookQuantities && (
//                     <div className="col-span-3">
//                       <p className="text-sm font-semibold mb-1">Book Quantities</p>
//                       {bookConfig.bookQuantityFields.map((field) => (
//                         <div key={field.key} className="flex justify-between text-sm mb-1">
//                           <span>{field.label}:</span>
//                           <span className="font-medium">
//                             {currentViewItem?.book_quantities?.[field.key] || 0}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
                  
//                   {bookConfig.hasCopies && (
//                     <div className="col-span-3">
//                       <p className="text-sm">Copies</p>
//                       <p className="font-medium">{currentViewItem?.["નકલ"] || currentViewItem?.["नकल"]}</p>
//                     </div>
//                   )}
                  
//                   <div className="col-span-3">
//                     <p className="text-sm">Address</p>
//                     <p className="font-medium">{currentViewItem?.["એડ્રેસ"]}</p>
//                   </div>
//                   <div className="col-span-1">
//                     <p className="text-sm">Pincode</p>
//                     <p className="font-medium">
//                       {currentViewItem?.["पिनकोड"]}
//                     </p>
//                   </div>
//                   <div className="col-span-2">
//                     <p className="text-sm">State</p>
//                     <p className="font-medium">{currentViewItem?.["राज्य"]}</p>
//                   </div>
//                   <div className="col-span-3">
//                     <p className="text-sm">Parcel ID</p>
//                     <p className="font-medium">
//                       {currentViewItem?.parcelId ? (
//                         <span className="text-xs font-medium py-1 px-2 rounded-sm">
//                           {currentViewItem.parcelId}
//                         </span>
//                       ) : (
//                         <span>Not assigned</span>
//                       )}
//                     </p>
//                   </div>
//                   <div className="col-span-3">
//                     <p className="text-sm">Order Date</p>
//                     <p className="font-medium">
//                       {currentViewItem?.timestamp &&
//                         `${new Date(
//                           currentViewItem.timestamp
//                         ).toLocaleDateString("en-IN")} 
//                 ${new Date(currentViewItem.timestamp).toLocaleTimeString(
//                   "en-IN"
//                 )}`}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end items-center gap-2">
//                 <div className="flex-grow">
//                   {copyStatus && (
//                     <span className="text-sm text-green-600">{copyStatus}</span>
//                   )}
//                 </div>
//                 <button
//                   onClick={handleCopyDetails}
//                   className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold py-1 px-4 text-sm"
//                 >
//                   Copy Details
//                 </button>
//                 <button
//                   onClick={() => setViewModalOpen(false)}
//                   className="bg-red-700 hover:bg-red-800 rounded-sm text-gray-200 font-bold py-1 px-4 text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Delete Modal */}
//         {deleteModalOpen && (
//           <div className="bg-white dark:bg-gray-900/40 dark:text-gray-200 fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
//             <div className="bg-gray-200 border dark:bg-gray-800 dark:text-gray-200 rounded-sm font-anek p-6 w-full max-w-md animate-scaleIn">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Confirm Deletion</h2>
//                 <button
//                   onClick={() => setDeleteModalOpen(false)}
//                   className="p-1 rounded-full hover:bg-gray-700"
//                 >
//                   <FaTimes size={20} />
//                 </button>
//               </div>

//               <div className="mb-6">
//                 <p>
//                   Are you sure you want to delete this order? This action cannot
//                   be undone.
//                 </p>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => setDeleteModalOpen(false)}
//                   className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-1 px-4 rounded-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmDelete}
//                   className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1 px-4 rounded-sm"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DynamicBookOrderPage;

"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEdit, FaTrash, FaTimes, FaCheck, FaFilter } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
// import Sidebar from "@/app/_components/Sidebar";
import Header from "../submission-components/Header";
import TableUI from "../submission-components/TableUI";
// import { useAuth } from "@/app/context/AuthContext";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DynamicBookOrderPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookName = searchParams.get("book");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(null);
  const [error, setError] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentViewItem, setCurrentViewItem] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [totalCopies, setTotalCopies] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [parcelId, setParcelId] = useState("");
  const [deliveryType, setDeliveryType] = useState("parcelId");
  const [updateStatus, setUpdateStatus] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
  const [collectionName, setCollectionName] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    deliveryType: "all",
    minCopies: 0,
    maxCopies: "",
    city: "",
    state: "",
    pincode: "",
    searchName: "",
    searchMobile: "",
    dateFrom: "",
    dateTo: "",
  });

  // const { canEdit, canDelete, isAdmin, isViewer, userName, userRole } = useAuth();

  // Book configuration
  const bookConfigs = {
    "sanskrutam-saralam": {
      hasBookQuantities: true,
      hasCopies: false,
      bookQuantityFields: [
        { key: "pratham_yatra", label: "Pratham Yatra" },
        { key: "dwitiy_yatra", label: "Dwitiya Yatra" },
        { key: "dhatunaamrup_shreni", label: "Dhatunaamrup Shreni" },
      ],
    },
    default: {
      hasBookQuantities: false,
      hasCopies: true,
      copiesField: "નકલ",
    },
  };

  const getBookConfig = () => {
    const normalizedBookName = bookName?.toLowerCase().replace(/\s+/g, "-");
    return bookConfigs[normalizedBookName] || bookConfigs.default;
  };

  const bookConfig = getBookConfig();

  // Dynamic table columns
  const getTableColumns = () => {
    const baseColumns = [
      { field: "timestamp", header: "Date & Time" },
      { field: "नाम", header: "Name" },
      { field: "मोबाइल नंबर", header: "Mobile" },
      { field: "शहर", header: "City" },
      { field: "એડ્રેસ", header: "Address" },
      { field: "पिनकोड", header: "Pincode" },
      { field: "राज्य", header: "State" },
    ];

    if (bookConfig.hasBookQuantities) {
      bookConfig.bookQuantityFields.forEach((field) => {
        baseColumns.push({
          field: "book_quantities." + field.key,
          header: field.label + " (Q)",
        });
      });
    } else if (bookConfig.hasCopies) {
      baseColumns.push({ field: "નકલ", header: "Copies" });
    }

    baseColumns.push(
      { field: "parcelId", header: "Parcel ID" },
      { field: "deliveryType", header: "Delivery Type" },
      { field: "deliveredDate", header: "Delivered Date" },
      { field: "actions", header: "Actions" }
    );

    return baseColumns;
  };

  const tableColumns = getTableColumns();
  const extraDataColumns = [];

  // Apply all filters to data
  const applyFilters = (dataArray) => {
    return dataArray.filter((item) => {
      // Delivery Type filter
      if (filters.deliveryType !== "all") {
        if (filters.deliveryType === "unassigned" && item.hasParcel) return false;
        if (filters.deliveryType === "parcelId" && (!item.hasParcel || item.deliveryType !== "parcelId")) return false;
        if (filters.deliveryType !== "unassigned" && filters.deliveryType !== "parcelId" && item.deliveryType !== filters.deliveryType) return false;
      }

      // Copies filter
      const copies = bookConfig.hasBookQuantities 
        ? bookConfig.bookQuantityFields.reduce((total, field) => total + (parseInt(item.book_quantities?.[field.key] || 0, 10) || 0), 0)
        : parseInt(item["નકલ"] || item["नकल"] || 1, 10);
      
      if (filters.minCopies && copies < filters.minCopies) return false;
      if (filters.maxCopies && copies > filters.maxCopies) return false;

      // City filter
      if (filters.city && !item["शहर"]?.toLowerCase().includes(filters.city.toLowerCase())) return false;

      // State filter
      if (filters.state && !item["राज्य"]?.toLowerCase().includes(filters.state.toLowerCase())) return false;

      // Pincode filter
      if (filters.pincode && !item["पिनकोड"]?.includes(filters.pincode)) return false;

      // Name search
      if (filters.searchName) {
        const fullName = (item["नाम"] + " " + (item["उपनाम"] || "")).toLowerCase();
        if (!fullName.includes(filters.searchName.toLowerCase())) return false;
      }

      // Mobile search
      if (filters.searchMobile && !item["मोबाइल नंबर"]?.includes(filters.searchMobile)) return false;

      // Date range filter
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

  const filteredData = applyFilters(data);
  const filteredRecords = filteredData.length;

  // Reset filters
  const resetFilters = () => {
    setFilters({
      deliveryType: "all",
      minCopies: 0,
      maxCopies: "",
      city: "",
      state: "",
      pincode: "",
      searchName: "",
      searchMobile: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.deliveryType !== "all") count++;
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const passFromLocalStorage = localStorage.getItem("password");
      const correctPassword = "mahavir@2550";
      setIsLogin(
        passFromLocalStorage === correctPassword ||
          passFromLocalStorage === "adhyatm@parivar"
      );
    }
  }, []);

  useEffect(() => {
    if (isLogin === false) {
      router.push("/");
      return;
    }

    if (isLogin === true && bookName) {
      loadBookOrderData();
    }
  }, [isLogin, bookName]);

  // Handle mark as delivered callback
  const handleMarkAsDelivered = async (selectedItems, deliveryDate) => {
    try {
      setUpdateStatus({
        type: "loading",
        message: "Marking orders as delivered...",
      });

      // Update each selected item in Firebase
      const updatePromises = selectedItems.map(async (item) => {
        const orderDocRef = doc(db, collectionName, item.id);
        await updateDoc(orderDocRef, {
          deliveredDate: deliveryDate,
          lastUpdated: new Date(),
        });
      });

      await Promise.all(updatePromises);

      // Update local data
      const updatedData = data.map((item) => {
        const matchedItem = selectedItems.find(
          (selected) => selected.id === item.id
        );
        if (matchedItem) {
          return {
            ...item,
            deliveredDate: deliveryDate,
          };
        }
        return item;
      });

      setData(updatedData);

      setUpdateStatus({
        type: "success",
        message: selectedItems.length + " order(s) marked as delivered successfully",
      });
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error("Error marking as delivered:", error);
      setUpdateStatus({
        type: "error",
        message: "Failed to mark as delivered: " + error.message,
      });
      setTimeout(() => setUpdateStatus(null), 5000);
    }
  };

  const handleView = (item) => {
    setCurrentViewItem(item);
    setViewModalOpen(true);
  };

  const handleEdit = (item, index) => {
    setCurrentEditItem({ ...item, index });
    setParcelId(item.parcelId || "");
    setDeliveryType(item.deliveryType || "parcelId");
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setItemToDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const index = itemToDeleteIndex;
      const itemToDelete = data[index];

      await deleteDoc(doc(db, collectionName, itemToDelete.id));

      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);

      setUpdateStatus({
        type: "success",
        message: "Order deleted successfully",
      });
      setTimeout(() => setUpdateStatus(null), 3000);
    } catch (error) {
      console.error("Error deleting order:", error);
      setUpdateStatus({
        type: "error",
        message: "Failed to delete order: " + error.message,
      });
      setTimeout(() => setUpdateStatus(null), 5000);
    } finally {
      setDeleteModalOpen(false);
      setItemToDeleteIndex(null);
    }
  };

  const handleSaveParcelId = async () => {
    try {
      setUpdateStatus({
        type: "loading",
        message: "Saving delivery information...",
      });

      const itemToUpdate = currentEditItem;
      const orderDocRef = doc(db, collectionName, itemToUpdate.id);

      await updateDoc(orderDocRef, {
        parcelId: deliveryType === "handtohand" ? "On Hand" : parcelId.trim(),
        deliveryType: deliveryType,
        hasParcel: true,
        lastUpdated: new Date(),
      });

      const newData = [...data];
      newData[currentEditItem.index] = {
        ...currentEditItem,
        parcelId: deliveryType === "handtohand" ? "On Hand" : parcelId.trim(),
        deliveryType: deliveryType,
        hasParcel: true,
      };
      newData.sort((a, b) => b.timestamp - a.timestamp);
      setData(newData);

      setUpdateStatus({
        type: "success",
        message: "Delivery information saved successfully",
      });
      setTimeout(() => setUpdateStatus(null), 3000);

      setEditModalOpen(false);
    } catch (error) {
      console.error("Error saving delivery information:", error);
      setUpdateStatus({
        type: "error",
        message: "Failed to save: " + error.message,
      });
      setTimeout(() => setUpdateStatus(null), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("password");
    setIsLogin(false);
    router.push("/");
  };

  const handleCopyDetails = () => {
    if (!currentViewItem) return;

    let copiesInfo = "";
    if (bookConfig.hasBookQuantities) {
      bookConfig.bookQuantityFields.forEach((field) => {
        const qty = currentViewItem.book_quantities?.[field.key] || 0;
        copiesInfo += field.label + ": " + qty + "\n";
      });
    } else if (bookConfig.hasCopies) {
      copiesInfo = "Copies: " + (currentViewItem["નકલ"] || currentViewItem["नकल"] || 1) + "\n";
    }

    const details = "\nName: " + currentViewItem["नाम"] + " " + (currentViewItem["उपनाम"] || "") + "\n" +
      "Mobile: " + currentViewItem["मोबाइल नंबर"] + "\n" +
      "City: " + currentViewItem["शहर"] + "\n" +
      "Address: " + currentViewItem["એડ્રેસ"] + "\n" +
      "Pincode: " + currentViewItem["पिनकोड"] + "\n" +
      "State: " + currentViewItem["राज्य"] + "\n" +
      copiesInfo + "Parcel ID: " + (currentViewItem.parcelId || "Not Assigned");

    navigator.clipboard
      .writeText(details.trim())
      .then(() => {
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setCopyStatus("Failed to copy");
        setTimeout(() => setCopyStatus(null), 2000);
      });
  };

  const calculateTotalCopies = (dataArray) => {
    return dataArray.reduce((sum, item) => {
      if (bookConfig.hasBookQuantities) {
        const totalBookQty = bookConfig.bookQuantityFields.reduce((total, field) => {
          return total + (parseInt(item.book_quantities?.[field.key] || 0, 10) || 0);
        }, 0);
        return sum + totalBookQty;
      } else if (bookConfig.hasCopies) {
        const copies = parseInt(item["નકલ"] || item["नकल"] || 1, 10);
        return sum + (isNaN(copies) ? 1 : copies);
      }
      return sum;
    }, 0);
  };

  const loadBookOrderData = async () => {
    try {
      setLoading(true);

      if (!bookName) {
        setError("No book name provided");
        setLoading(false);
        return;
      }

      const normalizedCollectionName = bookName.replace(/\s+/g, "-") + "-bookorder";
      console.log("Loading collection:", normalizedCollectionName);
      
      setCollectionName(normalizedCollectionName);

      const ordersCollection = collection(db, normalizedCollectionName);
      const ordersQuery = query(ordersCollection, orderBy("timestamp", "asc"));
      const orderSnapshot = await getDocs(ordersQuery);

      if (!orderSnapshot.empty) {
        const formattedData = orderSnapshot.docs.map((doc) => {
          const item = doc.data();
          const baseData = {
            id: doc.id,
            नाम: item["નામ"] || item["नाम"] || "N/A",
            उपनाम: item["ઉપનામ"] || item["उपनाम"] || "",
            "मोबाइल नंबर": item["મોબાઈલ નંબર"] || item["मोबाइल नंबर"] || "N/A",
            शहर: item["શહેર"] || item["शहर"] || "N/A",
            એડ્રેસ: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] || item["एड्रेस"] || "N/A",
            पिनकोड: item["પિનકોડ"] || item["पिनकोड"] || "N/A",
            राज्य: item["રાજ્ય"] || item["राज्य"] || "N/A",
            parcelId: item.parcelId || "",
            deliveryType: item.deliveryType || (item.parcelId ? "parcelId" : ""),
            hasParcel: item.hasParcel || false,
            deliveredDate: item.deliveredDate || null,
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          };

          if (bookConfig.hasBookQuantities) {
            baseData.book_quantities = item.book_quantities || {};
          } else if (bookConfig.hasCopies) {
            baseData.નકલ = item["નકલ"] || item["नकल"] || 1;
          }

          return baseData;
        });

        setData(formattedData);
        setTotalCopies(calculateTotalCopies(formattedData));
      } else {
        setError("No records found for this book");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load book orders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareDataWithActions = () => {
    return filteredData.map((item, index) => {
      const processedItem = {
        ...item,
        नाम: item["नाम"] + " " + (item["उपनाम"] || ""),
        timestamp: item.timestamp,
        originalIndex: data.indexOf(item),
      };

      if (bookConfig.hasBookQuantities && item.book_quantities) {
        bookConfig.bookQuantityFields.forEach((field) => {
          processedItem["book_quantities." + field.key] = 
            item.book_quantities[field.key] || 0;
        });
      }

      processedItem.actions = (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleView(item)}
            className="p-1 text-green-700 rounded"
            title="View Details"
          >
            <FaEye size={14} />
          </button>
          {/* {canEdit && ( */}
            <button
              onClick={() => handleEdit(item, data.indexOf(item))}
              className="p-1 text-blue-500 rounded"
              title="Edit/Add Parcel ID"
            >
              <FaEdit size={14} />
            </button>
          {/* )} */}
          {/* {canDelete && ( */}
            <button
              onClick={() => handleDelete(data.indexOf(item))}
              className="p-1 text-red-500 rounded"
              title="Delete Order"
            >
              <FaTrash size={14} />
            </button>
          {/* )} */}
        </div>
      );

      return processedItem;
    });
  };

  if (isLogin === null) return null;
  if (!isLogin) return null;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="flex-1">
          <div className="p-8 mt-20">
            <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
                Error
              </h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-anek bg-white dark:bg-gray-900 dark:text-gray-200 transition-colors duration-200">
      <div className="flex-1 transition-all duration-300">
        <Header
          totalCopies={calculateTotalCopies(filteredData)}
          filterDeliveryType={filters.deliveryType}
          setFilterDeliveryType={(value) => setFilters({...filters, deliveryType: value})}
          filteredRecords={filteredRecords}
          data={filteredData}
          title={bookName + " Book Orders"}
          onFilterClick={() => setIsFilterPanelOpen(true)}
          activeFilterCount={getActiveFilterCount()}
        />

        {/* Status notification */}
        {updateStatus && (
          <div
            className={"fixed top-20 right-4 p-3 rounded shadow-md z-50 " + (
              updateStatus.type === "success"
                ? "bg-green-700 text-green-100"
                : updateStatus.type === "error"
                ? "bg-red-800 text-red-200"
                : "bg-blue-100 text-blue-800"
            )}
          >
            {updateStatus.type === "loading" && (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent inline-block mr-2"></div>
            )}
            {updateStatus.type === "success" && (
              <FaCheck className="inline-block mr-2" size={14} />
            )}
            {updateStatus.type === "error" && (
              <FaTimes className="inline-block mr-2" size={14} />
            )}
            {updateStatus.message}
          </div>
        )}

        {/* Filter Panel - keeping existing code */}
        {isFilterPanelOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 font-sans bg-opacity-50 z-40 transition-opacity duration-300"
              onClick={() => setIsFilterPanelOpen(false)}
            />
            
            <div className={"fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out " + (
              isFilterPanelOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
              {/* Filter panel content remains the same as original */}
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

                 {/* Filter Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {/* Delivery Type */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Delivery Type
                    </label>
                    <select
                      value={filters.deliveryType}
                      onChange={(e) => setFilters({...filters, deliveryType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="parcelId">Parcel</option>
                      <option value="courierId">Courier</option>
                      <option value="handtohand">Hand to Hand</option>
                      <option value="unassigned">Unassigned</option>
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
                          onChange={(e) => setFilters({...filters, minCopies: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Max"
                          min="0"
                          value={filters.maxCopies}
                          onChange={(e) => setFilters({...filters, maxCopies: e.target.value ? parseInt(e.target.value) : ""})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name Search */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Search by Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name..."
                      value={filters.searchName}
                      onChange={(e) => setFilters({...filters, searchName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Mobile Search */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Search by Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="Enter mobile number..."
                      value={filters.searchMobile}
                      onChange={(e) => setFilters({...filters, searchMobile: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city..."
                      value={filters.city}
                      onChange={(e) => setFilters({...filters, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="Enter state..."
                      value={filters.state}
                      onChange={(e) => setFilters({...filters, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pincode..."
                      value={filters.pincode}
                      onChange={(e) => setFilters({...filters, pincode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                          onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Results Summary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Results: <span className="font-bold">{filteredRecords}</span> orders
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Total Copies: <span className="font-bold">{calculateTotalCopies(filteredData)}</span>
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

        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full mt-24 sm:mt-20 px-2 sm:px-4">
            <TableUI
              data={prepareDataWithActions()}
              loading={loading}
              filteredRecords={filteredRecords}
              totalCopies={calculateTotalCopies(filteredData)}
              columns={tableColumns}
              extraData={extraDataColumns}
              bookName={bookName}
              onMarkDelivered={handleMarkAsDelivered}
            />
          </div>
        )}

               {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn bg-white dark:bg-gray-900/40 dark:text-gray-200">
            <div className="rounded-sm font-anek p-6 w-full max-w-md animate-scaleIn bg-gray-100 dark:bg-gray-800 dark:text-gray-200 shadow-lg border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Parcel Information</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-full"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="mb-4">
                <label
                  className="block text-sm font-bold mb-2"
                  htmlFor="deliveryType"
                >
                  Delivery Type
                </label>
                <select
                  id="deliveryType"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="bg-white dark:bg-gray-900 dark:text-gray-200 shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="parcelId">Parcel ID</option>
                  <option value="courierId">Courier ID</option>
                  <option value="handtohand">Hand to Hand</option>
                </select>
              </div>

              {deliveryType !== "handtohand" && (
                <div className="mb-4">
                  <label
                    className="block text-sm font-bold mb-2"
                    htmlFor="parcelId"
                  >
                    {deliveryType === "parcelId"
                      ? "Parcel Tracking ID"
                      : "Courier ID"}
                  </label>
                  <input
                    id="parcelId"
                    type="text"
                    value={parcelId}
                    onChange={(e) => setParcelId(e.target.value)}
                    className="bg-white dark:bg-gray-900 dark:text-gray-200 shadow appearance-none border placeholder:text-sm rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder={
                      deliveryType === "parcelId"
                        ? "Enter parcel tracking ID"
                        : "Enter courier ID"
                    }
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="bg-red-700 hover:bg-red-800 text-gray-200 text-sm font-bold py-1 px-4 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveParcelId}
                  className="bg-green-600 hover:bg-green-700 text-sm text-white font-bold py-1 px-4 rounded-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewModalOpen && (
          <div className="bg-white dark:bg-gray-900/40 dark:text-gray-200 fixed inset-0 text-sm bg-opacity-50 flex font-anek items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-200 border dark:bg-gray-800 dark:text-gray-200 rounded-lg p-6 w-full max-w-md animate-scaleIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-1 rounded-full"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="mb-4 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="col-span-3">
                    <p className="text-sm">Name</p>
                    <p className="font-medium">
                      {currentViewItem?.["नाम"]}{" "}
                      {currentViewItem?.["उपनाम"] || ""}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm">Mobile Number</p>
                    <p className="font-medium">
                      {currentViewItem?.["मोबाइल नंबर"]}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm">City</p>
                    <p className="font-medium">{currentViewItem?.["शहर"]}</p>
                  </div>
                  
                  {bookConfig.hasBookQuantities && (
                    <div className="col-span-3">
                      <p className="text-sm font-semibold mb-1">Book Quantities</p>
                      {bookConfig.bookQuantityFields.map((field) => (
                        <div key={field.key} className="flex justify-between text-sm mb-1">
                          <span>{field.label}:</span>
                          <span className="font-medium">
                            {currentViewItem?.book_quantities?.[field.key] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {bookConfig.hasCopies && (
                    <div className="col-span-3">
                      <p className="text-sm">Copies</p>
                      <p className="font-medium">{currentViewItem?.["નકલ"] || currentViewItem?.["नकल"]}</p>
                    </div>
                  )}
                  
                  <div className="col-span-3">
                    <p className="text-sm">Address</p>
                    <p className="font-medium">{currentViewItem?.["એડ્રેસ"]}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm">Pincode</p>
                    <p className="font-medium">
                      {currentViewItem?.["पिनकोड"]}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm">State</p>
                    <p className="font-medium">{currentViewItem?.["राज्य"]}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm">Parcel ID</p>
                    <p className="font-medium">
                      {currentViewItem?.parcelId ? (
                        <span className="text-xs font-medium py-1 px-2 rounded-sm">
                          {currentViewItem.parcelId}
                        </span>
                      ) : (
                        <span>Not assigned</span>
                      )}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm">Order Date</p>
                    <p className="font-medium">
                      {currentViewItem?.timestamp &&
                        `${new Date(
                          currentViewItem.timestamp
                        ).toLocaleDateString("en-IN")} 
                ${new Date(currentViewItem.timestamp).toLocaleTimeString(
                  "en-IN"
                )}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2">
                <div className="flex-grow">
                  {copyStatus && (
                    <span className="text-sm text-green-600">{copyStatus}</span>
                  )}
                </div>
                <button
                  onClick={handleCopyDetails}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold py-1 px-4 text-sm"
                >
                  Copy Details
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="bg-red-700 hover:bg-red-800 rounded-sm text-gray-200 font-bold py-1 px-4 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && (
          <div className="bg-white dark:bg-gray-900/40 dark:text-gray-200 fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-200 border dark:bg-gray-800 dark:text-gray-200 rounded-sm font-anek p-6 w-full max-w-md animate-scaleIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p>
                  Are you sure you want to delete this order? This action cannot
                  be undone.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-1 px-4 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1 px-4 rounded-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{"\
        @keyframes fadeIn {\
          from { opacity: 0; }\
          to { opacity: 1; }\
        }\
        \
        @keyframes scaleIn {\
          from { \
            opacity: 0;\
            transform: scale(0.95);\
          }\
          to { \
            opacity: 1;\
            transform: scale(1);\
          }\
        }\
        \
        .animate-fadeIn {\
          animation: fadeIn 0.2s ease-out;\
        }\
        \
        .animate-scaleIn {\
          animation: scaleIn 0.2s ease-out;\
        }\
      "}</style>
    </div>
  );
};

export default DynamicBookOrderPage;