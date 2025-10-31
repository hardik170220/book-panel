// shipping-label-generator.js
import * as pdfMake from "pdfmake/build/pdfmake";

export const generateShippingLabelsPDF = async (data,title) => {
  try {
    // Load fonts
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

   
    // Generate content for shipping labels
    const content = [];
    const labelsPerPage = 9;
    const labelHeight = 100;

    for (let i = 0; i < data.length; i += labelsPerPage) {
      const pageLabels = [];
      const tableBody = [];

      for (let row = 0; row < labelsPerPage; row++) {
        const index = i + row;
        if (index >= data.length) break;

        const item = data[index];
        
        // Receiver information
        const receiverInfo = {
          stack: [
            {
              text: detectScript(item["नाम"] + " " + item["उपनाम"]) === "devanagari" 
                ? { text: `${item["नाम"]} ${item["उपनाम"]}`, font: "NotoSansDevanagari" }
                : { text: `${item["नाम"]} ${item["उपनाम"]}`, font: "AnekGujarati" },
              bold: true,
              fontSize: 10
            },
            {
              text: detectScript(item["એડ્રેસ/एड्रेस"]) === "devanagari"
                ? { 
                    text: item["એડ્રેસ/एड्रेस"],
                      // .replace(/\n/g, ', ')
                      // .replace(/,+/g, ', ')
                      // .trim(), 
                    font: "NotoSansDevanagari" 
                  }
                : { 
                    text: item["એડ્રેસ/एड्रेस"],
                      // .replace(/\n/g, ', ')
                      // .replace(/,+/g, ', ')
                      // .trim(),
                    font: "AnekGujarati" 
                  },
              fontSize: 9
            },
            {
              text: detectScript(item["शहर"]) === "devanagari"
                ? { text: item["शहर"], font: "NotoSansDevanagari" }
                : { text: item["शहर"], font: "AnekGujarati" },
              fontSize: 8
            },
            {
              text: `Gujarat - Pin: ${item["पिनकोड"]}, Mobile: ${item["मोबाइल नंबर"]}`,
              fontSize: 8
            },
            { text: `TM_${new Date(item.timestamp).getTime()}`, fontSize: 8, alignment: 'left' }
          ],
          margin: [2, 2, 2, 2]
        };

        // Sender information
        const senderInfo = {
          stack: [
            { text: "From:", fontSize: 10, bold: true },
            { text: "Adhyatm Parivar, Adhyatm Bhavan, 3rd Floor", fontSize: 8, bold: true },
            { text: "Anand Shravak Aradhana Bhavan, Shanti Vardhak Jain Sangh, Near Sanjeev Kumar Auditorium, Pal, Surat - 395009", fontSize: 8 },
            { text: "Contact: 7676769600", fontSize: 8 },
            { text: `udyanmantri-${item.displayCopies}`, fontSize: 8, alignment: 'right' }
          ],
          margin: [2, 2, 2, 2]
        };

        tableBody.push([{
          stack: [
            {
              table: {
                widths: ['60%', '40%'],
                heights: labelHeight - 20,
                body: [[receiverInfo, senderInfo]]
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: '#000',
                vLineColor: '#000',
              }
            }
          ],
          margin: [0, 0, 0, 0]
        }]);
      }

      pageLabels.push({
        table: {
          widths: ['*'],
          body: tableBody
        },
        layout: 'noBorders'
      });

      content.push(pageLabels);
      
      if (i + labelsPerPage < data.length) {
        content.push({ text: '', pageBreak: 'after' });
      }
    }

    // Define the PDF document
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [25,0],
      content: content,
      defaultStyle: {
        font: "AnekGujarati"
      }
    };

    // Create and download the PDF
    const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);
    pdfDoc.download(`${title}_shipping_labels.pdf`);
  } catch (error) {
    console.error("Error generating shipping labels:", error);
    throw error;
  }
};

// Utility function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ""));
};

// Utility function to detect script
const detectScript = (text) => {
  if (!text) return "latin";
  const devanagariPattern = /[\u0900-\u097F]/;
  const gujaratiPattern = /[\u0A80-\u0AFF]/;
  return devanagariPattern.test(text) ? "devanagari" :
         gujaratiPattern.test(text) ? "gujarati" : "latin";
};