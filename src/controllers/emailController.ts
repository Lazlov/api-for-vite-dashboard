import User from "../models/userModel";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { Resend } from "resend";
import { Request, Response } from "express";

dotenv.config();

const secret = process.env.SECRET_KEY;

const resentKey = process.env.RESENT_KEY;

const resend = new Resend(resentKey);

const emailToken = (email: any) => {
  const payload = { email: email, isEmailVerificationToken: true };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "75m" });
  }
};

const generateAccessToken = (id: any, email: any, roles: any, isVerified: any) => {
  const payload = { id, email, roles, isVerified };

  if (secret) {
    return jwt.sign(payload, secret, { expiresIn: "24h" }); 
  }
};

const activateUser = async (req: Request, res: Response) => {
  const { link } = req.params;

  if (!link) {
    return res.status(400).json({ error: "Activation link is missing" });
  }

  const token = link.replace(/~/g, ".");
  if (!secret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    
    if (!decoded.email) {
      return res.status(400).json({ error: "Email not found in token" });
    }

    const { email } = decoded;
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true } // Returns the updated document
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(
      user._id,
      user.email,
      user.roles,
      true
    );
    console.log(accessToken)
    return res.status(200).json(accessToken);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(400).json({ error: "Invalid token" });
      } else if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      console.error("Activation error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

const resendActivationToken = async (req: Request, res: Response) => {
  const { link } = req.params;
  const token = link.replace(/~/g, ".");

  try {
    const decoded = jwt.decode(token);
    console.log(token, decoded);

    if (!decoded || typeof decoded === "string") {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    const { email } = decoded as JwtPayload;

    const generateEmailToken = emailToken(email);

    if (!generateEmailToken) {
      return res
        .status(500)
        .json({ error: "Failed to generate new email token" });
    }

    // Replace dots with hyphens in the token because react router acting like dot is a new route
    const newToken = generateEmailToken.replace(/\./g, "~");

    const verificationLink = `http://localhost:3000/d/activate/${newToken}`;

    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",

      // to: [email],
      to: email, // Replace with the actual recipient: email
      subject: "Email Verification",
      html: `<a href="${verificationLink}">Verify your email</a>`,
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

export const emailController = {
  activateUser,
  resendActivationToken,
};
