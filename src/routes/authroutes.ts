import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authcontroller";
import { uploadMiddleware, handleUpload } from "../uploadcontroller";
import { verifyToken } from "../middleware/expressAuth";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/upload", verifyToken, uploadMiddleware, handleUpload);

export default router;