const express = require("express");

const multer = require("multer");

const bodyParser = require("body-parser");

const sequelize = require("./util/database");

const cors = require("cors");

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

//--------routes------------------------------
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const deliveryRoutes = require("./routes/delivery");
const vendorRoutes = require("./routes/vendor");
const Notification = require("./models/notifications");
const UserNotification = require("./models/userNotification");
const notificationsRouts = require("./routes//notification");
const categoryRoutes = require("./routes/category");
const sliderRoutes = require("./routes/slider");
const productRoutes = require("./routes/product");
const favoriteRoutes = require("./routes/favorite");

//--------relations---------------------------

//assign admin to user profile
User.hasOne(Admin);
Admin.belongsTo(User);

//assign admin to user profile
User.hasOne(Delivery);
Delivery.belongsTo(User);

//assign roles to admin profile
Admin.hasOne(AdminRole);
AdminRole.belongsTo(Admin);

User.hasOne(Vendor);
Vendor.belongsTo(User);

Product.hasMany(Slider);
Slider.belongsTo(Product);

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
User.belongsToMany(Notification, { through: UserNotification });
Notification.belongsToMany(User, { through: UserNotification });

//-------settings-----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const app = express();

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(upload.array("image"));

app.use("/uploads", express.static("uploads"));

app.options("*", cors()); // include before other routes

app.use(cors());

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

sequelize
  .sync()
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
