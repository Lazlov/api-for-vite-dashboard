import Product from "../models/productModel.js";
import { Request, Response } from "express";
import mongoose from "mongoose";

const getProducts = async (req: Request, res: Response) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.status(200).json(products);
};

const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Can't find product" });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ error: "Can't find product" });
  }
  res.status(200).json(product);
};

const createProduct = async (req: Request, res: Response) => {
  const { name, price, quantity, status } = req.body;
  try {
    const product = await Product.create({ name, price, quantity, status });
    console.log(product);
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Can't find product" });
  }

  const product = await Product.findOneAndDelete({ _id: id });

  if (!product) {
    return res.status(404).json({ error: "Can't find product" });
  }
  res.status(200).json(product);
};

const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await Product.findOneAndUpdate({ _id: id }, { ...req.body });
  if (!product) {
    return res.status(404).json({ error: "Can't find product" });
  }
  res.status(200).json(product);
};

export const productController = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
