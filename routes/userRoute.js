const express = require("express");
const { loginController,  logoutController, googleAuthController,  signup, verifyAccount, resendOTP, forgetPassword, resetPassword } = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", isAuthenticated, verifyAccount)
router.post("/resend-otp",isAuthenticated,resendOTP)
router.post("/login", loginController);
router.post("/logout", logoutController);
// router.post("/google-auth", googleAuthController);
router.post("/forget-password",forgetPassword);
router.post('/reset-password',resetPassword)



module.exports = router;
