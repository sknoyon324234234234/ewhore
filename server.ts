import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { getDb, User } from "./src/db.ts";

import fs from "fs";
import AdmZip from "adm-zip";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER || 'support@ewhore.shop',
        pass: process.env.SMTP_PASS || '8w%MSe2mC7hEw%5'
    }
});

const sendOrderEmail = async (userEmail: string, userName: string, orderDetails: any, productDetails: any) => {
    try {
        let APP_URL = process.env.APP_URL || "https://ewhore.shop";
        if (APP_URL === "MY_APP_URL" || APP_URL === "http://localhost:3000") {
            APP_URL = "https://ewhore.shop";
        }

        const mainImage = productDetails.images && productDetails.images.length > 0 
            ? (productDetails.images[0].startsWith('http') ? productDetails.images[0] : `${APP_URL}${productDetails.images[0]}`) 
            : `${APP_URL}/web-app-manifest-192x192.png`;

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 30px; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900;">EWHORE SHOP</h1>
                <p style="color: #888; font-size: 14px;">Your Premium Content Delivered</p>
            </div>
            
            <div style="background-color: #111; border: 1px solid #333; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; font-size: 20px; border-bottom: 1px solid #333; padding-bottom: 15px;">Order Receipt</h2>
                <p style="color: #ccc;">Hi <strong>${userName}</strong>,</p>
                <p style="color: #ccc;">Thank you for your purchase! Your crypto payment has been successfully confirmed.</p>
                
                <div style="margin: 25px 0; text-align: center;">
                    <img src="${mainImage}" alt="${productDetails.name}" style="max-width: 200px; border-radius: 10px; border: 1px solid #333;" />
                    <h3 style="margin: 15px 0 5px 0;">${productDetails.name}</h3>
                    <p style="color: #4ade80; font-size: 18px; font-weight: bold; margin: 0;">$${orderDetails.price.toFixed(2)}</p>
                </div>

                <div style="background-color: #000; padding: 15px; border-radius: 10px; border: 1px solid #333; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Access Link</p>
                    <a href="${productDetails.accessLink}" style="display: block; background-color: #fff; color: #000; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Access Content Now</a>
                </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                <p>If you have any issues, please reply to this email or contact support.</p>
                <p>&copy; ${new Date().getFullYear()} Ewhore Shop. All rights reserved.</p>
            </div>
        </div>
        `;

        await transporter.sendMail({
            from: '"Ewhore Shop" <support@ewhore.shop>',
            to: userEmail,
            subject: `Receipt: Your order for ${productDetails.name} is complete!`,
            html: htmlTemplate
        });
        console.log(`Order email successfully sent to ${userEmail}`);
    } catch (error) {
        console.error('Failed to send order email:', error);
    }
};

// Helper function to save base64 images
const saveBase64Images = (images: string[]) => {
    const savedPaths: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const img of images) {
        if (img.startsWith('data:image/')) {
            const matches = img.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                fs.writeFileSync(path.join(uploadDir, filename), buffer);
                savedPaths.push(`/uploads/${filename}`);
            } else {
                savedPaths.push(img);
            }
        } else {
            savedPaths.push(img); // already a URL
        }
    }
    return savedPaths;
};

async function startServer() {
  const app = express();
  
  // VERY IMPORTANT FOR HOSTINGER/PROXIES
  // This tells Express to trust the X-Forwarded-For header from Hostinger's proxy
  // Without this, express-rate-limit will crash or block all users
  app.set("trust proxy", 1);

  const PORT = process.env.PORT || 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local dev / Vite compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false // CRITICAL: Allows Google Login popup to communicate with the main window
  }));
  
  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later"
  });
  app.use(limiter);

  // Performance Compression
  app.use(compression());
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  const db = await getDb();

  // Socket.io Real-time logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_chat", (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on("send_message", async (msg) => {
      await db.update(({ chats }) => chats.push({
        id: Math.random().toString(36).substring(7),
        userId: msg.userId,
        text: msg.text,
        isAdmin: msg.isAdmin,
        timestamp: new Date().toISOString()
      }));
      await db.write();
      
      if (msg.isAdmin) {
        io.to(`user_${msg.userId}`).emit("receive_message", msg);
      } else {
        io.emit("admin_message", msg); // Alert admins
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Routes
  app.get("/api/categories", async (req, res) => {
    res.json(db.data.categories || ['Course', 'Service']);
  });

  app.get("/api/products", async (req, res) => {
    const { userId } = req.query;
    let products = [...db.data.products];
    const user = db.data.users.find(u => u.id === userId);

    // Dynamic Pricing & Segmentation Logic
    if (user) {
        const totalSpent = db.data.orders
            .filter(o => o.userId === user.id && o.status === 'completed')
            .reduce((sum, o) => sum + o.price, 0);
        
        // Example: VIP Segment for users who spent > $100
        if (totalSpent > 100) {
            products = products.map(p => ({
                ...p,
                price: parseFloat((p.price * 0.9).toFixed(2)), // 10% auto-discount for VIPs
                isVipDiscount: true
            }));
        }
    }
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const product = db.data.products.find(p => String(p.id) === String(id));
    
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: "Product not found" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    const { userId } = req.query;
    if (userId) {
        return res.json(db.data.orders.filter(o => o.userId === userId));
    }
    res.json(db.data.orders);
  });
  app.get("/api/admin/users", async (req, res) => {
      // Add spending info to users list for analytics
      const usersWithStats = db.data.users.map(u => {
          const spent = db.data.orders
              .filter(o => o.userId === u.id && o.status === 'completed')
              .reduce((sum, o) => sum + o.price, 0);
          return { ...u, spent };
      });
      res.json(usersWithStats);
  });

  app.post("/api/auth/google", async (req, res) => {
    const { email, name, googleId, referralCode } = req.body;
    console.log("Google Login Attempt for:", email);
    
    let user = db.data.users.find(u => u.email === email);

    if (!user) {
      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        role: email === "sknoyon.a2core@gmail.com" ? "admin" : (email.includes("admin") ? "admin" : "user"),
        googleId,
        loyaltyPoints: 10, // Signup bonus
        referralCode: Math.random().toString(36).substring(7).toUpperCase(),
        referredBy: referralCode
      };
      
      // Bonus for referrer
      if (referralCode) {
          const referrer = db.data.users.find(u => u.referralCode === referralCode);
          if (referrer) {
              referrer.loyaltyPoints += 50;
          }
      }

      user = newUser;
      await db.update(({ users }) => users.push(newUser));
      await db.write();
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true }).json({ user, token });
  });

  app.post("/api/checkout", async (req, res) => {
    const { userId, items } = req.body;
    
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid items" });
    }

    let totalAmount = 0;
    let pendingOrders: any[] = [];
    let errors: string[] = [];
    const batchId = Math.random().toString(36).substring(2, 15);

    await db.update(data => {
        for (const productId of items) {
            const product = data.products.find(p => String(p.id) === String(productId));
            if (!product || product.inventoryCount <= 0) {
                errors.push(`Product ${productId} unavailable`);
                continue;
            }

            const price = product.price;
            totalAmount += price;

            const orderId = Math.random().toString(36).substring(7);
            const order = {
                id: orderId,
                userId,
                productId,
                price,
                status: "pending" as const,
                createdAt: new Date().toISOString(),
                accessLinkSnap: product.accessLink,
                batchId
            };

            data.orders.push(order);
            pendingOrders.push(order);
        }
    });
    await db.write();

    if (pendingOrders.length === 0) {
        return res.status(400).json({ error: "No valid items", errors });
    }

    try {
        let APP_URL = process.env.APP_URL || "https://ewhore.shop";
        if (APP_URL === "MY_APP_URL" || APP_URL === "http://localhost:3000") {
            APP_URL = "https://ewhore.shop";
        }
        
        const response = await fetch("https://api.nowpayments.io/v1/invoice", {
            method: "POST",
            headers: {
                "x-api-key": process.env.NOWPAYMENTS_API_KEY || "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                price_amount: parseFloat(totalAmount.toFixed(2)),
                price_currency: "usd",
                order_id: batchId,
                order_description: `Purchase of ${pendingOrders.length} items`,
                success_url: `${APP_URL}/profile#inventory`,
                cancel_url: `${APP_URL}/cart`
            })
        });

        const invoiceData = await response.json();
        
        if (!response.ok) {
            console.error("NowPayments Error:", invoiceData);
            return res.status(500).json({ error: "Payment gateway error" });
        }

        await db.update(data => {
            data.orders.filter(o => o.batchId === batchId).forEach(o => {
                o.invoiceId = invoiceData.id;
                o.paymentUrl = invoiceData.invoice_url;
            });
        });
        await db.write();

        res.json({ 
            success: true, 
            invoice_url: invoiceData.invoice_url,
            errors 
        });
    } catch (err) {
        console.error("Checkout Error:", err);
        res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Database Management routes
  app.get("/api/admin/database/export", async (req, res) => {
    try {
        const zip = new AdmZip();
        
        // Add JSON database (from current memory state to ensure it's 100% up to date)
        zip.addFile("database.json", Buffer.from(JSON.stringify(db.data, null, 2), "utf8"));
        
        // Add uploads directory if it exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadDir)) {
            zip.addLocalFolder(uploadDir, "uploads");
        }

        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="ewhore_backup_${new Date().toISOString().split('T')[0]}.zip"`);
        res.send(zipBuffer);
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Failed to export database" });
    }
  });

  app.post("/api/admin/database/import", express.raw({ type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'multipart/form-data', '*/*'], limit: '200mb' }), async (req, res) => {
    try {
        console.log("Importing database...");
        
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: "Invalid backup file: Body is empty or not a buffer." });
        }

        const zip = new AdmZip(req.body);
        const zipEntries = zip.getEntries();
        
        const dbEntry = zipEntries.find(e => e.entryName === 'database.json');
        if (!dbEntry) {
            return res.status(400).json({ error: "Invalid backup file: database.json is missing." });
        }
        
        const parsedData = JSON.parse(dbEntry.getData().toString("utf8"));
        if (!parsedData || !parsedData.users || !parsedData.products || !parsedData.orders || !parsedData.analytics) {
            return res.status(400).json({ error: "Invalid database format inside ZIP." });
        }
        
        // Extract images to uploads directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        zipEntries.forEach(entry => {
            if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
                const fileName = entry.entryName.replace('uploads/', '');
                fs.writeFileSync(path.join(uploadDir, fileName), entry.getData());
            }
        });
        
        // CRITICAL FIX: Update the GLOBAL in-memory database instance so the whole app sees it instantly
        db.data = parsedData;
        await db.write();
        
        console.log("Database imported successfully.");
        res.json({ message: "Database and images imported successfully" });
    } catch (error: any) {
        console.error("Import error:", error);
        res.status(500).json({ error: "Failed to import database: " + error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", (req, res) => {
    res.json(db.data.analytics);
  });

  app.post("/api/admin/categories", async (req, res) => {
    const { category } = req.body;
    if (category && !db.data.categories.includes(category)) {
      await db.update((data) => {
          data.categories.push(category);
      });
    }
    res.json({ success: true, categories: db.data.categories });
  });

  app.delete("/api/admin/categories/:name", async (req, res) => {
    const { name } = req.params;
    await db.update((data) => {
      data.categories = data.categories.filter(c => c !== name);
    });
    res.json({ success: true, categories: db.data.categories });
  });

  app.post("/api/admin/products", async (req, res) => {
    const newProduct = { 
        ...req.body, 
        id: Math.random().toString(36).substring(7),
        images: req.body.images ? saveBase64Images(req.body.images) : []
    };
    await db.update(({ products }) => products.push(newProduct));
    await db.write();
    res.json(newProduct);
  });

  app.put("/api/admin/products/:id", async (req, res) => {
    const { id } = req.params;
    const processedImages = req.body.images ? saveBase64Images(req.body.images) : [];

    await db.update(({ products, orders }) => {
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) {
          products[idx] = { ...products[idx], ...req.body, images: processedImages };
          // If access link changed, update it for all completed orders if user wants "update from everywhere"
          orders.filter(o => o.productId === id).forEach(o => {
              o.accessLinkSnap = products[idx].accessLink;
          });
      }
    });
    await db.write();
    res.json({ success: true });
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    const { id } = req.params;
    await db.update(({ products }) => {
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) {
        products.splice(idx, 1);
      }
    });
    await db.write();
    res.json({ success: true });
  });

  // Determine if we are in production
  // We are in production ONLY if the dist folder actually exists AND contains index.html
  let distPath = path.join(process.cwd(), "dist");
  let isProd = false;

  if (fs.existsSync(path.join(distPath, "index.html"))) {
      isProd = true;
  } else if (fs.existsSync(path.join(process.cwd(), "index.html"))) {
      const indexContent = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      // If root index.html doesn't contain src/main.tsx, it's a built file moved to root
      if (!indexContent.includes("src/main.tsx")) {
          distPath = process.cwd();
          isProd = true;
      }
  }

  if (!isProd) {
    console.log("Running in Development Mode (Vite)");
    // Vite middleware for local development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Serve public folder explicitly in dev mode to fix missing favicons
    app.use(express.static(path.join(process.cwd(), "public")));
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production Mode");
    // Serve static files in production
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Background polling for NowPayments invoices
  setInterval(async () => {
    try {
        const currentDb = await getDb();
        const now = new Date().getTime();
        
        // Auto-expire pending orders older than 60 minutes
        let expiredOrdersFound = false;
        await currentDb.update(dbData => {
            dbData.orders.forEach(o => {
                if (o.status === 'pending' && o.createdAt) {
                    const orderAge = now - new Date(o.createdAt).getTime();
                    if (orderAge > 60 * 60 * 1000) { // 60 minutes
                        o.status = 'expired';
                        expiredOrdersFound = true;
                    }
                }
            });
        });
        if (expiredOrdersFound) {
            await currentDb.write();
        }

        const pendingOrders = currentDb.data.orders.filter(o => o.status === 'pending' && o.invoiceId);
        const uniqueInvoiceIds = [...new Set(pendingOrders.map(o => o.invoiceId))].filter(Boolean);

        for (const invoiceId of uniqueInvoiceIds) {
            const res = await fetch(`https://api.nowpayments.io/v1/invoice/${invoiceId}`, {
                headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY || "" }
            });
            const data = await res.json();
            
            const status = data?.payment_status || data?.status;
            let isApproved = false;
            let isFailed = false;

            if (status) {
                const successStatuses = ['finished', 'confirmed', 'sending', 'overpaid'];
                if (successStatuses.includes(status)) {
                    isApproved = true;
                } else if (status === 'partially_paid') {
                    const priceAmount = Number(data.price_amount);
                    const actuallyPaidFiat = Number(data.actually_paid_fiat);
                    const actuallyPaid = Number(data.actually_paid);
                    const payAmount = Number(data.pay_amount);
                    
                    let paidUsd = 0;
                    if (!isNaN(actuallyPaidFiat) && actuallyPaidFiat > 0) {
                        paidUsd = actuallyPaidFiat;
                    } else if (!isNaN(actuallyPaid) && !isNaN(payAmount) && !isNaN(priceAmount) && payAmount > 0) {
                        paidUsd = (actuallyPaid / payAmount) * priceAmount;
                    }

                    // Approved if they paid within $0.50 of the price
                    if (paidUsd > 0 && paidUsd >= priceAmount - 0.50) {
                        isApproved = true;
                    }
                } else if (status === 'expired' || status === 'failed') {
                    isFailed = true;
                }
            }

            // Instantly grant product on success or acceptable partial payment
            if (isApproved) {
                let emailsToSend: { email: string, name: string, order: any, product: any }[] = [];

                await currentDb.update(dbData => {
                    const ordersToComplete = dbData.orders.filter(o => o.invoiceId === invoiceId && o.status === 'pending');
                    for (const order of ordersToComplete) {
                        order.status = 'completed';
                        const product = dbData.products.find(p => String(p.id) === String(order.productId));
                        if (product && product.inventoryCount > 0) {
                            product.inventoryCount -= 1;
                        }
                        dbData.analytics.totalOrders += 1;
                        dbData.analytics.totalRevenue += order.price;
                        const user = dbData.users.find(u => u.id === order.userId);
                        if (user) {
                            user.loyaltyPoints += Math.floor(order.price);
                            if (product) {
                                emailsToSend.push({ email: user.email, name: user.name, order, product });
                            }
                        }
                        io.emit("new_order", { orderId: order.id, productId: order.productId, name: product?.name });
                        io.emit("inventory_update", { productId: order.productId, inventoryCount: product?.inventoryCount });
                    }
                });
                await currentDb.write();

                // Send emails in background
                for (const emailData of emailsToSend) {
                    sendOrderEmail(emailData.email, emailData.name, emailData.order, emailData.product);
                }

            } else if (isFailed) {
                await currentDb.update(dbData => {
                    const ordersToFail = dbData.orders.filter(o => o.invoiceId === invoiceId && o.status === 'pending');
                    for (const order of ordersToFail) {
                        order.status = 'failed';
                    }
                });
                await currentDb.write();
            }
        }
    } catch (error) {
        console.error("Polling error:", error);
    }
  }, 60000); // Every 1 minute

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
