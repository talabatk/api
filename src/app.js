const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const sequelize = require("./util/database");
const { Server } = require("socket.io");
const http = require("node:http");
const cors = require("cors");
const cron = require("node-cron");
const { configDotenv } = require("dotenv");
const { upload } = require("./middlewares/upload");
const {
  morganMiddlewareImmediate,
  morganMiddleware,
} = require("./middlewares/morgan");
const morganBody = require("morgan-body");
const Logger = require("./util/logger");

configDotenv();

const app = express();

const server = http.createServer(app);

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morganMiddlewareImmediate);
morganBody(app, {
  stream: {
    // @ts-expect-error Fix later
    write: (message) => Logger.info(message.replace(/\n$/, "")),
  },
  maxBodyLength: 200,
  immediateReqLog: true,
  // theme: "lightened",
  noColors: true,
  prettify: false,
});
app.use(morganMiddleware);

app.use(
  upload.fields([
    { name: "image", maxCount: 3 },
    { name: "cover", maxCount: 1 },
  ])
);

app.use("/uploads", express.static("uploads"));
app.use("/logs", express.static("logs"));

app.options("*", cors()); // include before other routes

app.use(cors());

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // or a specific frontend origin
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("ping", () => {
      console.log("📡 Received ping from client");
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      console.warn("❌ Disconnected:", reason);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};

initSocket(server); // ✅ Important!

//---------models---------------------------------
const User = require("./models/user");
const Admin = require("./models/admin");
const AdminRole = require("./models/adminRole");
const Delivery = require("./models/delivery");
const Vendor = require("./models/vendor");
const Category = require("./models/category");
const Slider = require("./models/slider");
const Product = require("./models/product");
const ProductImage = require("./models/productImage");
const UserFavoriteProduct = require("./models/UserFavoriteproduct");
const UserFavoriteVendor = require("./models/userFavoriteVendors");
const Area = require("./models/area");
const DeliveryCost = require("./models/delivery_cost");
const OptionGroup = require("./models/optionGroup");
const Option = require("./models/option");
const Cart = require("./models/cart");
const CartProduct = require("./models/cartProduct");
const VendorCategory = require("./models/VendorCategory");
const VendorCategories = require("./models/VendorCategories");
const CartProductOption = require("./models/cartProductOption");
const Order = require("./models/order");
const Notification = require("./models/notifications");
const Complains = require("./models/complains");
const Alert = require("./models/alert");
const Otp = require("./models/otps");
const OrderTimeLine = require("./models/orderTimeLine");
const Message = require("./models/messages");
//--------routes------------------------------
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const deliveryRoutes = require("./routes/delivery");
const vendorRoutes = require("./routes/vendor");
const notificationsRouts = require("./routes/notification");
const categoryRoutes = require("./routes/category");
const sliderRoutes = require("./routes/slider");
const productRoutes = require("./routes/product");
const favoriteRoutes = require("./routes/favorite");
const areaRoutes = require("./routes/area");
const alertRoutes = require("./routes/alert");
const deliverCostRoutes = require("./routes/deliverCosts");
const optionGroupRoutes = require("./routes/optionsGroup");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const complainRoutes = require("./routes/complains");
const VendorCategoryRoutes = require("./routes/vendorCategory");
const messageRoutes = require("./routes/message");

//--------relations---------------------------

//assign admin to user profile
User.hasOne(Admin);
Admin.belongsTo(User);

//assign admin to user profile
User.hasOne(Delivery);
Delivery.belongsTo(User);

//assign Cart  to user profile
User.hasOne(Cart);
Cart.belongsTo(User);

User.hasMany(Complains);
Complains.belongsTo(User);

User.hasMany(Message);
Message.belongsTo(User);

//assign cart product to user cart
Cart.hasMany(CartProduct);
CartProduct.belongsTo(Cart);

//assign cart product to user order
Order.hasMany(CartProduct);
CartProduct.belongsTo(Order);

Area.hasMany(Order);
Order.belongsTo(Area);

Order.hasMany(OrderTimeLine);
OrderTimeLine.belongsTo(Order);

// define associations between cartProduct and Option
Vendor.hasMany(Order);
Order.belongsTo(Vendor);

VendorCategory.belongsToMany(Vendor, { through: VendorCategories });
Vendor.belongsToMany(VendorCategory, { through: VendorCategories });
//assign cart product to user order
User.hasMany(Order);
Order.belongsTo(User);

Delivery.hasMany(Order, { foreignKey: "deliveryId" });
Order.belongsTo(Delivery, { foreignKey: "deliveryId", targetKey: "userId" });

Product.hasMany(CartProduct);
CartProduct.belongsTo(Product);

// define associations between cartProduct and Option
CartProduct.belongsToMany(Option, { through: CartProductOption });
Option.belongsToMany(CartProduct, { through: CartProductOption });

//assign roles to admin profile
Admin.hasOne(AdminRole);
AdminRole.belongsTo(Admin);

User.hasOne(Vendor);
Vendor.belongsTo(User);

Product.hasMany(Slider);
Slider.belongsTo(Product);

Product.hasMany(OptionGroup);
OptionGroup.belongsTo(Product);

Product.hasMany(ProductImage);
ProductImage.belongsTo(Product);

Product.hasMany(UserFavoriteProduct);
UserFavoriteProduct.belongsTo(Product);

User.hasMany(UserFavoriteVendor, {
  foreignKey: "vendorId",
});
UserFavoriteVendor.belongsTo(User, {
  foreignKey: "vendorId",
});

User.hasMany(Product, {
  foreignKey: "vendorId",
});
Product.belongsTo(User, {
  foreignKey: "vendorId",
});

Category.hasMany(Product);
Product.belongsTo(Category);

User.hasMany(Slider, {
  foreignKey: "vendorId",
});
Slider.belongsTo(User, {
  foreignKey: "vendorId",
});

// define associations between the models
User.hasMany(Notification);
Notification.belongsTo(User);

// define associations between vendor and area
User.belongsToMany(Area, { through: DeliveryCost });
Area.belongsToMany(User, { through: DeliveryCost });

OptionGroup.hasMany(Option);
Option.belongsTo(OptionGroup);

//routes=====================
app.use("/user", userRoutes);

app.use("/admin", adminRoutes);

app.use("/delivery", deliveryRoutes);

app.use("/vendor", vendorRoutes);

app.use("/api", notificationsRouts);

app.use("/api", categoryRoutes);

app.use("/api", alertRoutes);

app.use("/api", VendorCategoryRoutes);

app.use("/api", sliderRoutes);

app.use("/api", productRoutes);

app.use("/api", favoriteRoutes);

app.use("/api", areaRoutes);

app.use("/api", deliverCostRoutes);

app.use("/api", optionGroupRoutes);

app.use("/api", cartRoutes);

app.use("/api", orderRoutes);

app.use("/api", complainRoutes);

app.use("/api", messageRoutes);

app.route("/").get((_req, res) => {
  // #swagger.ignore = true
  res.send("<h1>Hello, World! 🌍 [From Root]</h1>");
});

app.route("/api").get((_req, res) => {
  // #swagger.ignore = true
  res.send("<h1>Hello, World! 🌍 [From API]</h1>");
});

app.all("*", (req, _res, next) => {
  // #swagger.ignore = true
  // Logger.error(`Can't find ${req.originalUrl} on this server!`);
  next(new Error(`Can't find ${req.originalUrl} on this server!`));
});

// Global Error Handler

app.use((err, _req, res, _next) => {
  // #swagger.ignore = true
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  res.status(err.statusCode).json({ message: err.message });
  Logger.error(err);
});

// cron job to delete old notifications

cron.schedule("0 0 * * *", async () => {
  // Call your function to delete old notifications here
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3);
    cutoffDate.setHours(0, 0, 0, 0); // Set to 00:00:00

    // Perform the deletion
    const deletedCount = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate.toISOString(), // Compare with the calculated cutoff date
        },
      },
    });
    console.log(`Deleted ${deletedCount} old notifications`);
  } catch (error) {
    console.error("Error in cron job:", error);

    Logger.error(error);
  }
});

const address = `http://localhost:${process.env.PORT}`;

sequelize
  .sync()
  .then((result) => {
    server.listen(process.env.PORT || 5000, () => {
      console.info(
        "------------------------------------------------------------------------------------------\n"
      );
      Logger.debug(`Starting APP On -> ${address}`);
    });
  })
  .catch((err) => {
    Logger.error(err);
  });

process.on("uncaughtException", (err) => {
  // console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  // console.log(err.name, "\n", err.message);
  Logger.error("💥 UNCAUGHT EXCEPTION! 💥 Shutting down... 💥");
  Logger.error(`${err.name}\n${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  // console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  // console.log(err.name, err.message);
  Logger.error("💥 UNHANDLED REJECTION! 💥 Shutting down... 💥");
  Logger.error(`${err.name}\n${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
