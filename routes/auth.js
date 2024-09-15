const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updatePassword,
  updateProfile,
  allusers,
  getUserDetails,
  updateUser,
  deleteUser,
} = require("../controllers/authController");

const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/me").get(isAuthenticated, getUserProfile);
router.route("/password/update").put(isAuthenticated, updatePassword);
router.route("/me/update").put(isAuthenticated, updateProfile);

router
  .route("/admin/users")
  .get(isAuthenticated, authorizeRoles("admin"), allusers);
router
  .route("/admin/user/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getUserDetails)
  .put(isAuthenticated, authorizeRoles("admin"), updateUser)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteUser);

module.exports = router;
