const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");


const multerStorage = multer.memoryStorage(); // Store uploaded files in memory as Buffer objects

const multerFilter = (req, file, cb) => {
  // Check if the uploaded file is an image
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // Accept the file
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false); // Reject the file
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}); // Configure multer to store uploaded files in the 'uploads' directory

exports.uploadUserPhoto = upload.single("photo"); // Middleware to handle single file upload with field name 'photo'

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // If no file is uploaded, proceed to the next middleware
  if (!req.file) return next();

  // Generate a unique filename for the uploaded image
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}
exports.updateMe = catchAsync(async (req, res, next) => {
    //1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route is not for password updates. Please use /updateMyPassword.", 400)
        );
    }
    //2) Filtered out unwanted fields from the update data
    const filteredBody = filterObj(req.body, "name", "email");
    // If a photo was uploaded, add the filename to the filtered body
      if (req.file) filterdBody.photo = req.file.filename;
    //3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
});
exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined! Please use /signup instead",
    });
}
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
