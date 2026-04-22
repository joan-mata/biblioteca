import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export class AuthService {
  static async registerUser(email: string, password: string) {
    if (!email || !password) {
      throw new Error("Email y contraseña requeridos");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("El usuario ya existe");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "admin", // Default for first version
      },
    });

    return { id: user.id, email: user.email };
  }

  static async validateCredentials(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
