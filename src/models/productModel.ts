import { Schema, model } from "mongoose";

interface IProduct {
  name: string;
  price: number;
  quantity: number;
  status: "active" | "inactive" | "archived"; 
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: false, default: 0  },
    quantity: { type: Number, required: false, default: 0 }, 
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "archived"],
    },
  },
  { timestamps: true }
);

const Product = model<IProduct>("Product", productSchema);

export default Product;


