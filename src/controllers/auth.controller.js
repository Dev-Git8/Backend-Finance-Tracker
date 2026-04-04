import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/db.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const userAlreadyExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (userAlreadyExists) {
      return res.status(400).json({ message: "user already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

   
    

    const token = jwt.sign({
        id:user._id
    },config.JWT_SECRET,
    {expiresIn:"1h"}
) 
 return res.status(201).json(
        { message: "user registered successfully", 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
             },
             token:token
        });


  } catch (error) {

    console.error("Registration error:", error);
    return res.status(500).json(
        { message: "Internal server error" }
    );
  }
}