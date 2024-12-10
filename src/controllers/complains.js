const Complains = require("../models/complains"); // Adjust path as per your project structure
const User = require("../models/user"); // Adjust path as per your project structure

// Create a new complain
exports.createComplain = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Get the user ID from the authorization header
    const token = req.headers.authorization.split(" ")[1];

    const user = await User.findOne({
      where: { token },
    });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required." });
    }

    const complain = await Complains.create({
      title,
      description,
      userId: user.id,
    });

    res
      .status(201)
      .json({ message: "Complain created successfully.", complain });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create complain.", error: error.message });
  }
};

// Get all complains
exports.getAllComplains = async (req, res) => {
  const { page, size } = req.query;
  try {
    const limit = Number.parseInt(size);
    const offset = (Number.parseInt(page) - 1) * limit;
    const complains = await Complains.findAll({
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "phone"],
        },
      ],
    });
    const count = await Complains.count(); // Get total number of products
    const numOfPages = Math.ceil(count / limit); // Calculate number of pages

    res.status(200).json({ count, pages: numOfPages, result: complains });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch complains.", error: error.message });
  }
};

// Get a single complain by ID
exports.getComplainById = async (req, res) => {
  try {
    const { id } = req.params;

    const complain = await Complains.findByPk(id, { include: User });

    if (!complain) {
      return res.status(404).json({ message: "Complain not found." });
    }

    res.status(200).json({ complain });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch complain.", error: error.message });
  }
};

// Delete a complain
exports.deleteComplain = async (req, res) => {
  const { id } = req.params;
  try {
    const complain = await Complains.findByPk(id);

    if (!complain) {
      return res.status(404).json({ message: "Complain not found." });
    }

    await complain.destroy();

    res.status(200).json({ message: "Complain deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete complain.", error: error.message });
  }
};
