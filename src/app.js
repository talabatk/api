const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const sequelize = require("./util/database");
const socketIO = require("socket.io");
const http = require("node:http");
const cors = require("cors");
const cron = require("node-cron");

//-------settings-----------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const app = express();

const server = http.createServer(app);

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
    upload.fields([
        { name: "image", maxCount: 3 },
        { name: "cover", maxCount: 1 }
    ])
);

app.use("/uploads", express.static("uploads"));

app.options("*", cors()); // include before other routes

app.use(cors());

const io = socketIO(server, {
    cors: "*"
});

io.on("connection", (socket) => {
    console.info("A user is connected");
    socket.on("message", (message) => {
        console.info(`message from ${socket.id} : ${message}`);
    });
    socket.on("disconnect", () => {
        console.info(`socket ${socket.id} disconnected`);
    });
});

module.exports = { io };

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
const VendorCategory = require("./models/vendorCategories");
const Area = require("./models/area");
const DeliveryCost = require("./models/delivery_cost");
const OptionGroup = require("./models/optionGroup");
const Option = require("./models/option");
const Cart = require("./models/cart");
const CartProduct = require("./models/cartProduct");
const CartProductOption = require("./models/cartProductOption");
const Order = require("./models/order");
const VendorOrder = require("./models/vendorOrders");
const Notification = require("./models/notifications");
//--------routes------------------------------
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const deliveryRoutes = require("./routes/delivery");
const vendorRoutes = require("./routes/vendor");
const notificationsRouts = require("./routes//notification");
const categoryRoutes = require("./routes/category");
const sliderRoutes = require("./routes/slider");
const productRoutes = require("./routes/product");
const favoriteRoutes = require("./routes/favorite");
const areaRoutes = require("./routes/area");
const deliverCostRoutes = require("./routes/deliverCosts");
const optionGroupRoutes = require("./routes/optionsGroup");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

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

//assign cart product to user cart
Cart.hasMany(CartProduct);
CartProduct.belongsTo(Cart);

//assign cart product to user order
Order.hasMany(CartProduct);
CartProduct.belongsTo(Order);

Area.hasMany(Order);
Order.belongsTo(Area);

// define associations between cartProduct and Option
Vendor.belongsToMany(Order, { through: VendorOrder });
Order.belongsToMany(Vendor, { through: VendorOrder });

//assign cart product to user order
User.hasMany(Order);
Order.belongsTo(User);

Delivery.hasMany(Order);
Order.belongsTo(Delivery);

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
    foreignKey: "vendorId"
});
UserFavoriteVendor.belongsTo(User, {
    foreignKey: "vendorId"
});

User.hasMany(Product, {
    foreignKey: "vendorId"
});
Product.belongsTo(User, {
    foreignKey: "vendorId"
});

Category.hasMany(Product);
Product.belongsTo(Category);

User.hasMany(Slider, {
    foreignKey: "vendorId"
});
Slider.belongsTo(User, {
    foreignKey: "vendorId"
});

// define associations between the models
User.hasMany(Notification);
Notification.belongsTo(User);

// define associations between vendor and category
User.belongsToMany(Category, { through: VendorCategory });
Category.belongsToMany(User, { through: VendorCategory });

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

app.use("/api", sliderRoutes);

app.use("/api", productRoutes);

app.use("/api", favoriteRoutes);

app.use("/api", areaRoutes);

app.use("/api", deliverCostRoutes);

app.use("/api", optionGroupRoutes);

app.use("/api", cartRoutes);

app.use("/api", orderRoutes);

cron.schedule("0 0 * * *", async () => {
    // Call your function to delete old notifications here
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 3);

        const deletedRows = await Notification.destroy({
            where: {
                created_at: {
                    [Op.lt]: cutoffDate
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
});

sequelize
    .sync()
    .then((result) => {
        server.listen(3000);
    })
    .catch((err) => {
        console.error(err);
    });
