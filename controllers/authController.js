const User = require("../models/user");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

//Register a user => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res) => {
    const {name, email, password} = req.body;

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 300,
        height: 300,
        gravity: "auto",
        crop: "thumb",
        quality: "auto",
        resource_type: "image",
        format: "webp",
    });

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url,
        },
    });

    sendToken(user, 200, res);
});

//Login User => /a/i/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const {email, password} = req.body;
    //Checks if email and password is entered by the user
    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }
    //Finding user in database
    const user = await User.findOne({email}).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }
    //checks if password is correct or not
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

//Forgot Password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        return next(new ErrorHandler("There is no user with that email", 404));
    }
    //Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave: false});

    //create reset password url
    const resetUrl = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/password/reset/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a request to: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email and your password will remain unchanged.`;
    try {
        await sendEmail({
            email: user.email,
            subject: "Buynow Password Reset",
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});
        console.log(error.message);
        return next(new ErrorHandler(error.message, 500));
    }
});

//Reset Password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    //Hash URL Token
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()},
    });
    if (!user) {
        return next(
            new ErrorHandler(
                "Password reset token is invalid or has been expired",
                400
            )
        );
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    //Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res);
});

//Get Logged in User => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user,
    });
});

//Update password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    //Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword);
    if (!isMatched) {
        return next(new ErrorHandler("Password is incorrect", 400));
    }
    user.password = req.body.password;
    await user.save();
    sendToken(user, 200, res);
});

//Update profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    };
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
        user,
    });
});

//Logout User => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

//Admin Routes

//Get all users =>/api/v1/admin/users
exports.allusers = catchAsyncErrors(async (req, res) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users,
    });
});

//Get user details =>/api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const users = await User.findById(req.params.id);
    if (!users) {
        return next(new ErrorHandler(`User not found ${req.params.id}`, 400));
    }
    res.status(200).json({
        success: true,
        users,
    });
});

//Update user profile => /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
        user,
    });
});

//delete user =>/api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found ${req.params.id}`, 400));
    }
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await user.deleteOne();
    res.status(200).json({
        success: true,
    });
});
