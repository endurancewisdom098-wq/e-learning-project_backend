import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../lib/jwt-secret";

export async function loginHandler(req: Request, res: Response) {
  try {
    const secret = getJwtSecret();
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET is not configured") {
      return res.status(500).json({ error: "Authentication is not configured." });
    }
    return res.status(500).json({ error: "Server error" });
  }
}