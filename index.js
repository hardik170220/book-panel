exports.universalForm = onRequest(async (req, res) => {
    cors(req, res, async () => {
        try {
            // Extract form name from query parameter or body
            const formName = req.query.form || req.body.formName;

            if (!formName) {
                return res.status(400).json({
                    message: "Form name is required as 'form' query parameter or in request body",
                    receivedQuery: req.query,
                });
            }

            // Only POST requests allowed
            if (req.method !== 'POST') {
                return res.status(405).json({
                    message: "Method not allowed. Use POST.",
                });
            }

            const data = req.body;

            // Extract mobile number (support both English & Hindi)
            const mobile = data["मोबाइल नंबर"] || data["mobile"] || data["phone"];

            if (!mobile) {
                return res.status(400).json({
                    message: "Mobile number is required",
                });
            }

            const db = getFirestore();
            const collectionName = "bookorders";

            // 🔥 Add book name to booknames collection (ZERO READS)
            await db.collection("booknames")
                .doc(formName)
                .set(
                    {
                        name: formName,
                        updatedAt: new Date().toISOString(),
                    },
                    { merge: true } // ensures zero reads & non-destructive
                );

            // Check if user already registered for this book
            const existingQuery = await db
                .collection(collectionName)
                .where("mobile", "==", mobile)
                .where("bookName", "==", formName)
                .limit(1)
                .get();

            if (!existingQuery.empty) {
                const existingDoc = existingQuery.docs[0];
                return res.status(400).json({
                    message: "You have already registered for this book order.",
                    registrationId: existingDoc.data().registrationId,
                    documentId: existingDoc.id,
                });
            }

            // Generate registration ID using Firestore transaction
            const counterRef = db.collection('_counters').doc('registrationCounter');

            let registrationId;
            let documentId;

            await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);

                let currentCount = 1;
                if (counterDoc.exists) {
                    currentCount = (counterDoc.data().count || 0) + 1;
                }

                registrationId = `AP-${currentCount}`;

                // Update counter
                transaction.set(counterRef, { count: currentCount }, { merge: true });

                // Create new book order doc
                const newDocRef = db.collection(collectionName).doc();
                documentId = newDocRef.id;

                transaction.set(newDocRef, {
                    ...data,
                    mobile: mobile,
                    bookName: formName,
                    registrationId,
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString(),
                });
            });

            return res.status(200).json({
                message: `Book order for ${formName} submitted successfully!`,
                bookName: formName,
                collectionName,
                registrationId,
                documentId,
            });

        } catch (error) {
            console.error("Error in universalForm:", error);
            return res.status(500).json({
                message: "An error occurred while processing your request.",
                error: error.message,
            });
        }
    });
});


exports.backfillBookNames = onRequest(async (req, res) => {
    try {
        const db = getFirestore();

        // Step 1: Read all book orders
        const ordersSnapshot = await db.collection("bookorders").get();

        const bookSet = new Set();

        ordersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.bookName) {
                bookSet.add(data.bookName.trim());
            }
        });

        const uniqueBooks = Array.from(bookSet);

        // Step 2: Write each book to booknames collection (NO READS)
        const batch = db.batch();
        uniqueBooks.forEach(name => {
            const ref = db.collection("booknames").doc(name);
            batch.set(ref, {
                name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        });

        await batch.commit();

        return res.status(200).json({
            message: "Booknames backfilled successfully",
            totalBooksInserted: uniqueBooks.length,
            bookNames: uniqueBooks
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

exports.getBookOrders = onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const { bookName, pageSize = 50, lastDocId, lastTimestamp } = req.query;

        if (!bookName) {
            return res.status(400).json({
                error: "Book name is required",
            });
        }

        const db = getFirestore();
        const ordersCollection = db.collection("bookorders");

        // Parse pageSize as integer
        const limit = parseInt(pageSize) || 50;

        // Base query
        let ordersQuery = ordersCollection
            .where("bookName", "==", bookName)
            .orderBy("timestamp", "desc")
            .limit(limit);

        // If pagination parameters exist, start after the last document
        if (lastDocId && lastTimestamp) {
            const lastDoc = await ordersCollection.doc(lastDocId).get();
            if (lastDoc.exists) {
                ordersQuery = ordersQuery.startAfter(lastDoc);
            }
        }

        const orderSnapshot = await ordersQuery.get();

        if (orderSnapshot.empty) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
                hasMore: false,
                lastDocId: null,
                lastTimestamp: null,
            });
        }

        const formattedData = orderSnapshot.docs.map((doc) => {
            const item = doc.data();
            return {
                id: doc.id,
                registrationId: item.registrationId || "N/A",
                नाम: item["નામ"] || item["नाम"] || "N/A",
                उपनाम: item["ઉપનામ"] || item["उपनाम"] || "",
                "मोबाइल नंबर": item["મોબાઇલ નંબર"] || item["मोबाइल नंबर"] || "N/A",
                शहर: item["શહેર"] || item["शहर"] || "N/A",
                એડ્રેસ: item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] || item["एड्रेस"] || "N/A",
                पिनकोड: item["પિનકોડ"] || item["पिनकोड"] || "N/A",
                राज्य: item["રાજ્ય"] || item["राज्य"] || "N/A",
                parcelId: item.parcelId || "",
                deliveryType: item.deliveryType || (item.parcelId ? "parcelId" : ""),
                hasParcel: item.hasParcel || false,
                deliveredDate: item.deliveredDate || null,
                timestamp: item.timestamp?.toDate ? item.timestamp.toDate().toISOString() : item.timestamp,
                bookName: item.bookName,
                book_quantities: item.book_quantities || {},
                નકલ: item["નકલ"] || item["नकल"] || 1,
            };
        });

        // Get last document info for pagination
        const lastDoc = orderSnapshot.docs[orderSnapshot.docs.length - 1];
        const lastDocData = lastDoc.data();

        // Check if there are more documents
        const hasMore = orderSnapshot.docs.length === limit;

        res.status(200).json({
            success: true,
            data: formattedData,
            count: formattedData.length,
            hasMore: hasMore,
            lastDocId: lastDoc.id,
            lastTimestamp: lastDocData.timestamp?.toDate ? lastDocData.timestamp.toDate().toISOString() : lastDocData.timestamp,
        });

    } catch (error) {
        console.error("Error in getBookOrders function:", error);
        res.status(500).json({
            error: "Failed to fetch book orders: " + error.message,
        });
    }
});

exports.getBookOrdersCount = onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const { bookName } = req.query;

        if (!bookName) {
            return res.status(400).json({
                error: "Book name is required",
            });
        }

        const db = getFirestore();
        const ordersCollection = db.collection("bookorders");

        // Use count() for efficient counting without reading documents
        const countQuery = ordersCollection
            .where("bookName", "==", bookName)
            .count();

        const countSnapshot = await countQuery.get();
        const totalCount = countSnapshot.data().count;

        res.status(200).json({
            success: true,
            totalCount: totalCount,
        });

    } catch (error) {
        console.error("Error in getBookOrdersCount function:", error);
        res.status(500).json({
            error: "Failed to fetch count: " + error.message,
        });
    }
});


function formatDisplayName(bookName) {
    if (bookName.includes("calendar")) {
        return bookName.replace("calendar", "Panchang ");
    }

    return bookName
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

exports.updateDashboardData = onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            console.log("Starting dashboard data update...");
            const db = getFirestore();

            // ===== RATE LIMITING CHECK (2 HOURS) =====
            const rateLimitDoc = await db.collection("system").doc("rateLimits").get();
            const rateLimitData = rateLimitDoc.data();

            if (rateLimitData && rateLimitData.lastUpdateTimestamp) {
                const twoHoursInMs = 2 * 60 * 60 * 1000;
                const timeSinceLastUpdate = Date.now() - rateLimitData.lastUpdateTimestamp;

                if (timeSinceLastUpdate < twoHoursInMs) {
                    const remainingMinutes = Math.ceil((twoHoursInMs - timeSinceLastUpdate) / 60000);
                    return res.status(429).json({
                        success: false,
                        error: `Rate limit active. Please wait ${remainingMinutes} minutes before next update.`,
                        nextAvailableAt: new Date(rateLimitData.lastUpdateTimestamp + twoHoursInMs).toISOString()
                    });
                }
            }

            // ===== YOUR ORIGINAL LOGIC =====
            const bookordersCollection = db.collection("bookorders");
            const snapshot = await bookordersCollection.get();

            if (snapshot.size === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No orders found",
                    data: null
                });
            }

            console.log(`Processing ${snapshot.size} orders...`);
            const bookGroups = {};
            let totalRecentOrders = 0;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            snapshot.docs.forEach(doc => {
                const order = doc.data();
                const bookName = order.bookName || "Unknown";

                if (!bookGroups[bookName]) {
                    bookGroups[bookName] = {
                        displayName: formatDisplayName(bookName),
                        bookName,
                        total: 0,
                        shipped: 0,
                        pending: 0
                    };
                }

                bookGroups[bookName].total++;

                const isShipped = order.deliveredDate ||
                    (order.parcelId && order.parcelId.trim() !== "");
                if (isShipped) {
                    bookGroups[bookName].shipped++;
                } else {
                    bookGroups[bookName].pending++;
                }

                if (order.timestamp) {
                    const orderDate = new Date(order.timestamp);
                    if (orderDate >= sevenDaysAgo) {
                        totalRecentOrders++;
                    }
                }
            });

            const bookData = {};
            Object.entries(bookGroups).forEach(([bookName, data]) => {
                const id = bookName.replace(/[^a-zA-Z0-9]/g, "");
                bookData[id] = {
                    displayName: data.displayName,
                    collectionName: bookName,
                    total: data.total,
                    shipped: data.shipped,
                    pending: data.pending
                };
            });

            const totalOrders = Object.values(bookData).reduce(
                (sum, b) => sum + b.total,
                0
            );
            const totalShipped = Object.values(bookData).reduce(
                (sum, b) => sum + b.shipped,
                0
            );
            const totalPending = Object.values(bookData).reduce(
                (sum, b) => sum + b.pending,
                0
            );

            const fulfillmentRate = totalOrders > 0
                ? Math.round((totalShipped / totalOrders) * 100)
                : 0;
            const avgOrdersPerBook = totalOrders > 0
                ? Math.round(totalOrders / Object.keys(bookData).length)
                : 0;

            const dashboardData = {
                bookData,
                recentOrdersCount: totalRecentOrders,
                overallMetrics: {
                    totalOrders,
                    totalShipped,
                    totalPending,
                    fulfillmentRate,
                    avgOrdersPerBook,
                    totalBooks: Object.keys(bookData).length
                },
                updateTimestamp: Date.now()
            };

            await db.collection("dashboarddata")
                .doc("current")
                .set(dashboardData);

            // ===== UPDATE RATE LIMIT TIMESTAMP =====
            await db.collection("system")
                .doc("rateLimits")
                .set({
                    lastUpdateTimestamp: Date.now(),
                    lastUpdateDate: new Date().toISOString()
                }, { merge: true });

            console.log(
                `Dashboard data updated successfully. Processed ${Object.keys(bookData).length} books.`
            );

            return res.status(200).json({
                success: true,
                message: "Dashboard data updated successfully",
                data: {
                    booksProcessed: Object.keys(bookData).length,
                    totalOrders,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("Error updating dashboard data:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to update dashboard data: " + error.message
            });
        }
    });
});

exports.getDashboardData = onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const db = getFirestore();

            const dashboardDoc = await db
                .collection("dashboarddata")
                .doc("current")
                .get();

            if (!dashboardDoc.exists) {
                return res.status(200).json({
                    success: false,
                    message: "No dashboard data found. Please update dashboard first.",
                    data: null
                });
            }

            return res.status(200).json({
                success: true,
                message: "Dashboard data retrieved successfully",
                data: dashboardDoc.data()
            });

        } catch (error) {
            console.error("Error getting dashboard data:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to get dashboard data: " + error.message
            });
        }
    });
});


//8AM Scheduled Dashboard Update (err)

exports.scheduledDashboardUpdate = onSchedule(
    {
        schedule: "0 12 * * *",
        timeZone: "Asia/Kolkata",
        memory: "256MiB",
    },
    async (event) => {
        try {
            console.log("Running scheduled dashboard update at 8 AM...");
            const db = getFirestore();

            // Same logic as HTTP endpoint but without CORS and rate limiting
            const bookordersCollection = db.collection("bookorders");
            const snapshot = await bookordersCollection.get();

            if (snapshot.size === 0) {
                console.log("No orders found");
                return;
            }

            console.log(`Processing ${snapshot.size} orders...`);
            const bookGroups = {};
            let totalRecentOrders = 0;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            snapshot.docs.forEach(doc => {
                const order = doc.data();
                const bookName = order.bookName || "Unknown";

                if (!bookGroups[bookName]) {
                    bookGroups[bookName] = {
                        displayName: formatDisplayName(bookName),
                        bookName,
                        total: 0,
                        shipped: 0,
                        pending: 0
                    };
                }

                bookGroups[bookName].total++;

                const isShipped = order.deliveredDate ||
                    (order.parcelId && order.parcelId.trim() !== "");
                if (isShipped) {
                    bookGroups[bookName].shipped++;
                } else {
                    bookGroups[bookName].pending++;
                }

                if (order.timestamp) {
                    const orderDate = new Date(order.timestamp);
                    if (orderDate >= sevenDaysAgo) {
                        totalRecentOrders++;
                    }
                }
            });

            const bookData = {};
            Object.entries(bookGroups).forEach(([bookName, data]) => {
                const id = bookName.replace(/[^a-zA-Z0-9]/g, "");
                bookData[id] = {
                    displayName: data.displayName,
                    collectionName: bookName,
                    total: data.total,
                    shipped: data.shipped,
                    pending: data.pending
                };
            });

            const totalOrders = Object.values(bookData).reduce(
                (sum, b) => sum + b.total,
                0
            );
            const totalShipped = Object.values(bookData).reduce(
                (sum, b) => sum + b.shipped,
                0
            );
            const totalPending = Object.values(bookData).reduce(
                (sum, b) => sum + b.pending,
                0
            );

            const fulfillmentRate = totalOrders > 0
                ? Math.round((totalShipped / totalOrders) * 100)
                : 0;
            const avgOrdersPerBook = totalOrders > 0
                ? Math.round(totalOrders / Object.keys(bookData).length)
                : 0;

            const dashboardData = {
                bookData,
                recentOrdersCount: totalRecentOrders,
                overallMetrics: {
                    totalOrders,
                    totalShipped,
                    totalPending,
                    fulfillmentRate,
                    avgOrdersPerBook,
                    totalBooks: Object.keys(bookData).length
                },
                updateTimestamp: Date.now()
            };

            await db.collection("dashboarddata")
                .doc("current")
                .set(dashboardData);

            // Update rate limit for scheduled run too
            await db.collection("system")
                .doc("rateLimits")
                .set({
                    lastUpdateTimestamp: Date.now(),
                    lastUpdateDate: new Date().toISOString()
                }, { merge: true });

            console.log(`Scheduled update completed. Processed ${Object.keys(bookData).length} books.`);
        } catch (error) {
            console.error("Error in scheduled dashboard update:", error);
        }
    }
);