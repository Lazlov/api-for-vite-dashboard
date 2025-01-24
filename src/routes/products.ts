import express from "express";
import { productController } from "../controllers/productController";

const router = express.Router();

const { getProducts, getProduct, createProduct, deleteProduct, updateProduct } =
  productController;

router.get("/", getProducts);

router.get("/:id", getProduct);

router.delete("/:id", deleteProduct);

router.patch("/:id", updateProduct);

router.post("/", createProduct);

export default router;
