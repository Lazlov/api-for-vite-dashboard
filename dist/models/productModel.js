import { Schema, model } from "mongoose";
const productSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: false, default: 0 },
    quantity: { type: Number, required: false, default: 0 },
    status: {
        type: String,
        required: true,
        enum: ["active", "inactive", "archived"],
    },
}, { timestamps: true });
const Product = model("Product", productSchema);
export default Product;
