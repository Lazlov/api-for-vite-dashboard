import { Schema, model } from "mongoose";

interface IUser {
  email: string;
  password: string;
  passwordResetToken?: string;
  isVerified: boolean;
  roles: string[];
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    roles: [{ type: String, default: "user" }],
    isVerified: { type: Boolean, default: false },
  },
  { strict: true }
);

const User = model("User", userSchema);

export default User;
