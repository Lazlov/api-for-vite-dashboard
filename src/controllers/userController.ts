import mongoose from "mongoose";
import User from "../models/userModel.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import * as jwt from "jsonwebtoken";
import { Resend } from "resend";

dotenv.config();
const secret = process.env.SECRET_KEY;
const resentKey = process.env.RESENT_KEY;
const emailDomain = process.env.EMAIL_DOMAIN

const resend = new Resend(resentKey);

const emailToken = (email: string) => {
  const payload = { email: email, isEmailVerificationToken: true };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "75m" });
  }
};

const getUsers = async (req: Request, res: Response) => {
  const users = await User.find({});
  return res.status(200).json(users);
};

const createUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(req.body)
  const candidate = await User.findOne({ email });
  if (candidate) {
    return res
      .status(404)
      .json({ error: `User with email ${email} already exists` });
  }

  try {
    const generateEmailToken = emailToken(email);

    if (!generateEmailToken) {
      return res.status(500).json({ error: "Failed to generate email token." });
    }

    // Encode the token
    const token = generateEmailToken.replace(/\./g, "~");

    const verificationLink = `http://localhost:3000/d/activate/${token}`;
    const { data, error } = await resend.emails.send({
      from: `Registration <noreply@${emailDomain}>`,
      to: email,
      subject: "Email Verification",
      html: `<a href="${verificationLink}">Verify your email</a>`,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    const hashedPassword = await bcrypt.hash(password, 3);
    console.log(req.body)
    const user = await User.create({
      email,
      password: hashedPassword,
      roles: ["user"],
      isVerified: false,
    });

    res.status(201).json({ data, user });
  } catch (error) {
    console.log(error)
    res.status(400).json({ error });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Can't find user" });
  }

  const user = await User.findOneAndDelete({ _id: id });

  if (!user) {
    return res.status(404).json({ error: "Can't find user" });
  }
  res.status(200).json(user);
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findOneAndUpdate({ _id: id }, { ...req.body });
  if (!user) {
    return res.status(404).json({ error: "Can't find user" });
  }
  res.status(200).json(user);
};

export const userController = { createUser, getUsers, deleteUser, updateUser };
