// routes/adminRoutes.js
import express from "express";
import AdminController from "../controller/AdminController.js";

const router = express.Router();

router.post('/register', AdminController.registerAdmin);
router.post('/login', AdminController.loginAdmin);
router.get('/', AdminController.getAllAdmins);
router.get('/:id', AdminController.getAdminById);
router.put('/:id', AdminController.updateAdmin);
router.delete('/:id', AdminController.deleteAdmin);

export default router;
