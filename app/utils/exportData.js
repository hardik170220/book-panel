const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const ExcelJS = require("exceljs");

// Load the service account credentials
const serviceAccount = require('../../public/credential.json');

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function exportToExcel() {
  try {
    // Changed this line - using db.collection() instead of collection()
    const querySnapshot = await db.collection("mahabharat-bookorder").get();
    const allData = querySnapshot.docs.map(doc => doc.data());

    // Create a workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Book Orders");

    // Define columns
    worksheet.columns = [
      { header: "Sr. No.", key: "srNo", width: 5 },
      { header: "नाम", key: "name", width: 20 },
      { header: "मोबाइल नंबर", key: "mobile", width: 15 },
      { header: "शहर", key: "city", width: 15 },
      { header: "एड्रेस", key: "address", width: 30 },
      { header: "पिनकोड", key: "pincode", width: 10 },
      { header: "राज्य", key: "state", width: 15 },
      { header: "set/part-1", key: "set", width: 10 }
    ];

    // Add data rows
    allData.forEach((item, index) => {
      worksheet.addRow({
        srNo: index + 1,
        name: item["नाम"],
        mobile: item["मोबाइल नंबर"],
        city: item["शहर"],
        address: item["એડ્રેસ/एड्रेस"],
        pincode: item["पिनकोड"],
        state: item["राज्य"],
        set: item["set/part-1"]
      });
    });

    // Apply styles
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { size: 10 };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true 
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Page setup
    worksheet.pageSetup = {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    // Write to file
    const fileName = 'mahabharat_bookorders.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`Data exported to ${fileName}`);
  } catch (error) {
    console.error("Error exporting data to Excel:", error);
  }
}


// Usage
exportToExcel();