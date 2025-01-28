import User from "../models/userModel.js";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();
const secret = process.env.SECRET_KEY;

const resentKey = process.env.RESENT_KEY;

const resend = new Resend(resentKey);
const accessToken = (id: any, email: any, roles: any, isVerified: any) => {
  const payload = { id, email, roles, isVerified };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "24h" }); 
  }
};

const passwordToken = (_id: any) => {
  const payload = { id: _id };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "15m" });
  }
};

const refreshToken = (id: any) => {
  const payload = { id };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "30d" }); 
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ error: `User with email ${email} is not exists` });
  }
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: "Wrong password" });
  }

  const generateAccessToken = accessToken(
    user._id,
    user.email,
    user.roles,
    user.isVerified
  );
  const generateRefreshToken = refreshToken(user._id);

  res.cookie("jwt", generateRefreshToken, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 30 * 24 * 60 * 1000,
  });
  res.status(200).json(generateAccessToken);
};

const logoutUser = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); ///???
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.json({ mssg: "cookies cleared" });
};

const getRefreshToken = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    return res.status(403);
  }
  if (secret) {
    jwt.verify(
      refreshToken,
      secret,
      async (err: any, decoded: any) => {
        if (err) return res.status(403).json({ err: "error1" });
        const foundUser = await User.findOne({ _id: decoded.id });
        if (!foundUser) {
          return res.status(401).json({ mssg: "user is not logged in" });
        }

        const generateAccessToken = accessToken(
          foundUser._id,
          foundUser.email,
          foundUser.roles,
          foundUser.isVerified
        );
        res.status(200).json({generateAccessToken,email: foundUser.email});
      } // ??
    );
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const generatePasswordToken = passwordToken(user._id);

    if (!generatePasswordToken) {
      return res
        .status(500)
        .json({ error: "Failed to generate new email token" });
    }

    // Replace dots with hyphens in the token because react router acting like dot is a new route
    const newToken = generatePasswordToken.replace(/\./g, "~");

    const verificationLink = `http://localhost:3000/new-password/${newToken}`;

    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",

      // to: [email],
      to: email,
      subject: "Password change",
      html: `<a href="${verificationLink}">Change password link</a>`,
    });

    if (error) {
      return res.status(400).json({ error: "Failed to send the email" });
    }

    return res.status(200).json({ message: "Email resent successfully", data });
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const newPassword = (req: Request, res: Response) => {
  const { token } = req.params;
  const fixedToken = token.replace(/~/g, ".");
  const { password } = req.body;

  console.log(req.body, req.params);

  if (!secret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  jwt.verify(fixedToken, secret, async (err, decoded) => {
    if (err) {
      return res.status(404).json({ error: "Token expired or invalid" });
    }

    if (decoded && typeof decoded !== "string") {
      const { id } = decoded;

      if (!id) {
        return res.status(400).json({ error: "id not found in token" });
      }
      try {
        const hashedPassword = await bcrypt.hash(password, 3);
        console.log(hashedPassword);

        const user = await User.findOneAndUpdate(
          { id },
          { password: hashedPassword },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json("Password changed successfully");
      } catch (updateError) {
        //no body, wrong body payload etc
        return res.status(500).json({ error: "Internal server error" });
      }
    } else {
      return res.status(400).json({ error: "Invalid token payload" });
    }
  });
};

export const authController = {
  login,
  logoutUser,
  getRefreshToken,
  resetPassword,
  newPassword,
};
