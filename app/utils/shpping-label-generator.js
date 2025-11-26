import * as pdfMake from "pdfmake/build/pdfmake";

export const generateShippingLabelsPDF = async (data, title) => {
  console.log(data, "data label");
  try {
    // Load fonts and logo
    const gujaratiFontPath = "/AnekGujarati-Regular.ttf";
    const hindiFontPath = "/Karma-Regular.ttf";
    const logoPath = "/logo.png";

    const [gujaratiFontResponse, hindiFontResponse, logoResponse] = await Promise.all([
      fetch(gujaratiFontPath),
      fetch(hindiFontPath),
      fetch(logoPath),
    ]);

    const [gujaratiFontBuffer, hindiFontBuffer, logoBuffer] = await Promise.all([
      gujaratiFontResponse.arrayBuffer(),
      hindiFontResponse.arrayBuffer(),
      logoResponse.arrayBuffer(),
    ]);

    const gujaratiFontBase64 = arrayBufferToBase64(gujaratiFontBuffer);
    const hindiFontBase64 = arrayBufferToBase64(hindiFontBuffer);
    const logoBase64 = arrayBufferToBase64(logoBuffer);
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;

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
    const labelsPerPage = 7;
    const labelHeight = 50;

    for (let i = 0; i < data.length; i += labelsPerPage) {
      const pageLabels = [];
      const tableBody = [];

      for (let row = 0; row < labelsPerPage; row++) {
        const index = i + row;
        if (index >= data.length) break;

        const item = data[index];
        const copies = item["નકલ"] || 1;
        const registrationId = item.registrationId || `TM_${new Date(item.timestamp).getTime()}`;

        // Format address: remove newlines and trim
        const addressRaw = item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] || "";
        const address = addressRaw.replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();

        // Capitalize title
        const formattedTitle = title ? title.charAt(0).toUpperCase() + title.slice(1) : "";

        // Receiver information with vertical centering
        const receiverInfo = {
          stack: [
            {
              stack: [
                {
                  text: detectScript(item["नाम"] + " " + item["उपनाम"]) === "devanagari"
                    ? { text: `${item["नाम"]} ${item["उपनाम"]}`, font: "NotoSansDevanagari" }
                    : { text: `${item["नाम"]} ${item["उपनाम"]}`, font: "AnekGujarati" },
                  bold: true,
                  fontSize: 10
                },
                {
                  text: detectScript(address) === "devanagari"
                    ? {
                      text: address,
                      font: "NotoSansDevanagari"
                    }
                    : {
                      text: address,
                      font: "AnekGujarati"
                    },
                  fontSize: 9,
                  margin: [0, 2, 0, 2]
                },
                {
                  text: detectScript(item["शहर"]) === "devanagari"
                    ? { text: `${item["शहर"]} - Pin: ${item["पिनकोड"]}, Mo: ${item["मोबाइल नंबर"]}`, font: "NotoSansDevanagari" }
                    : { text: `${item["शहर"]} - Pin: ${item["पिनकोड"]}, Mo: ${item["मोबाइल नंबर"]}`, font: "AnekGujarati" },
                  fontSize: 9
                },
                { text: `${registrationId}`, fontSize: 12, bold: true, alignment: 'left', margin: [0, 2, 0, 0] }
              ],
              margin: [0, 20, 0, 0] // Top margin to center vertically
            }
          ],
          margin: [0, 0, 0, 0]
        };

        // Sender information with Logo Watermark (Centered)
        const senderInfo = {
          stack: [
            // Logo centered and behind text (simulated with negative margin)
            {
              image: logoDataUrl,
              width: 50,
              opacity: 0.1,
              alignment: 'center',
              margin: [0, 0, 0, 0]
            },
            {
              stack: [
                { text: "From:", fontSize: 10, bold: true },
                { text: "Adhyatm Parivar, Adhyatm Bhavan, 3rd Floor", fontSize: 8, bold: true },
                { text: "Anand Shravak Aradhana Bhavan, Shanti Vardhak Jain Sangh, Near Sanjeev Kumar Auditorium, Pal, Surat - 395009", fontSize: 8 },
                { text: "Contact: 7676769600", fontSize: 8 },
                { text: `${formattedTitle} - ${copies}`, fontSize: 12, bold: true, alignment: 'right', margin: [0, 2, 0, 0] }
              ],
              margin: [0, -50, 0, 0] // Pull text up to overlap with image
            }
          ],
          margin: [0, 0, 0, 0]
        };

        tableBody.push([{
          stack: [
            {
              table: {
                widths: ['60%', '40%'],
                heights: labelHeight - 10,
                body: [[receiverInfo, senderInfo]]
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: '#000',
                vLineColor: '#000',
                paddingLeft: () => 2,
                paddingRight: () => 2,
                paddingTop: () => 2,
                paddingBottom: () => 2,
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
      pageMargins: [10, 5, 10, 5],
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