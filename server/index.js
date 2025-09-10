import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Bitacora from "./models/Bitacora.js";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import BitSequence from "./models/BitSequence.js";
import Monitoreo from "./models/TipoMonitoreo.js";
import Client from "./models/Cliente.js";
import EventType from "./models/EventType.js";
import Role from "./models/Role.js";
import ClientSequence from "./models/ClientSequence.js";
import Destino from "./models/Destino.js";
import Origen from "./models/Origen.js";
import Operador from "./models/Operador.js";
import Inactividad from "./models/Inactividad.js";
import session from "express-session";
import nodemailer from "nodemailer";
import crypto from "crypto";
import Auditoria from "./models/Auditoria.js";
import LineaTransporte from "./models/LineaTransporte.js";
import OrigenSequence from "./models/OrigenSequence.js";
import DestinoSequence from "./models/DestinoSequence.js";
import TipoMonitoreoSequence from "./models/TipoMonitoreoSequence.js";
import ClienteSequence from "./models/ClienteSequence.js";
import EventTypeSequence from "./models/EventTypeSequence.js";
import LineaTransporteSequence from "./models/LineaTransporteSequence.js";
import OperadorSequence from "./models/OperadorSequence.js";
import { auditCreation, auditUpdate, auditDeletion } from "./auditoriaUtils.js";
import { convertToUpperCase } from "./utils/textUtils.js";

// Helper function to get next sequence number for Origen
const getNextOrigenSequence = async () => {
  const sequence = await OrigenSequence.findByIdAndUpdate(
    "origenSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper function to get next sequence number for Destino
const getNextDestinoSequence = async () => {
  const sequence = await DestinoSequence.findByIdAndUpdate(
    "destinoSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper function to decrement Origen sequence
const decrementOrigenSequence = async () => {
  const sequence = await OrigenSequence.findByIdAndUpdate(
    "origenSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper function to decrement Destino sequence
const decrementDestinoSequence = async () => {
  const sequence = await DestinoSequence.findByIdAndUpdate(
    "destinoSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper functions for TipoMonitoreo sequence
const getNextTipoMonitoreoSequence = async () => {
  const sequence = await TipoMonitoreoSequence.findByIdAndUpdate(
    "tipoMonitoreoSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

const decrementTipoMonitoreoSequence = async () => {
  const sequence = await TipoMonitoreoSequence.findByIdAndUpdate(
    "tipoMonitoreoSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper functions for Cliente sequence
const getNextClienteSequence = async () => {
  const sequence = await ClienteSequence.findByIdAndUpdate(
    "clienteSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

const decrementClienteSequence = async () => {
  const sequence = await ClienteSequence.findByIdAndUpdate(
    "clienteSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper functions for EventType sequence
const getNextEventTypeSequence = async () => {
  const sequence = await EventTypeSequence.findByIdAndUpdate(
    "eventTypeSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

const decrementEventTypeSequence = async () => {
  const sequence = await EventTypeSequence.findByIdAndUpdate(
    "eventTypeSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper functions for LineaTransporte sequence
const getNextLineaTransporteSequence = async () => {
  const sequence = await LineaTransporteSequence.findByIdAndUpdate(
    "lineaTransporteSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

const decrementLineaTransporteSequence = async () => {
  const sequence = await LineaTransporteSequence.findByIdAndUpdate(
    "lineaTransporteSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

// Helper functions for Operador sequence
const getNextOperadorSequence = async () => {
  const sequence = await OperadorSequence.findByIdAndUpdate(
    "operadorSequence",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

const decrementOperadorSequence = async () => {
  const sequence = await OperadorSequence.findByIdAndUpdate(
    "operadorSequence",
    { $inc: { seq: -1 } },
    { new: true, upsert: true }
  );
  return sequence.seq;
};

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Cambio de contraseña",
    html: `<p>Se ha solicitado un cambio de contraseña. Click <a href="${resetUrl}"> aqui</a> para cambiar su contraseña. Si no solicitó este cambio, favor de hacer caso omiso.</p>`,
  };

  return transporter.sendMail(mailOptions);
};

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;

//midleware
const allowedOrigins = [
  "https://intacsep.spotynet.com", // Production
  "http://localhost:5173", // Development,
  "https://stg-app-intacsep.spotynet.com", //Staging
  "https://www.stg-app-intacsep.spotynet.com",
  "http://44.212.70.126", //AWS stg
  "https://intacsep.ilbento.com", //AWS test
  "https://www.intacsep.spotynet.com", //AWS PROD
  "https://www.stg-intacsep.spotynet.com", //AWS STG
  "https://stg-intacsep.spotynet.com", //AWS STG
  "https://bitacora.intacsep.com.mx",
  "https://stg-intacsep.onrender.com",
  "http://bitacora-intacsep.s3-website-us-east-1.amazonaws.com",
  "https://intacsep-stg.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Replace with your actual secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }, // Set to true if using HTTPS
  })
);

//Create Custom Middleware to retreive Token Data
app.use((req, res, next) => {
  // Skip requests for login, logout, and refresh_token
  if (
    req.path === "/login" ||
    req.path === "/logout" ||
    req.path === "/refresh_token" ||
    req.path === "/register" ||
    req.path === "/request-reset-password" ||
    req.path === "/reset-password" ||
    (req.method === "GET" && req.path == "/")
  ) {
    return next();
  }

  const token = req.cookies.access_token; // Retrieve token after the path check

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET); // Verify the token
    req.session.user = data.user; // Store user data in session
  } catch (e) {
    console.error(e);
    req.session.user = null;
    return res.status(401).json({ message: "Unauthorized: Invalid token" }); // Return response on error
  }

  next(); // Proceed to the next middleware
});

//mongoose connection
mongoose.connect(process.env.MONGO_URI);

app.get("/", (req, res) => {
  res.send(`Node.js versionn: ${process.version}`);
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("User Does Not Exist");
    }

    // Compare passwords
    const checkPwd = await bcrypt.compare(password, user.password);
    if (!checkPwd) {
      throw new Error("Incorrect Password");
    }

    // Remove Password from return object
    const publicUser = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };

    // Create Access Token
    const accessToken = jwt.sign({ user: publicUser }, JWT_SECRET, {
      expiresIn: "60m",
    });

    // Create Refresh Token
    const refreshToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET_REFRESH, {
      expiresIn: "5d",
    });

    // Save tokens in cookies
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "None", // or "Lax" depending on your needs
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "None", // or "Lax" depending on your needs
      secure: process.env.NODE_ENV === "production",
    });

    user.refresh_token = refreshToken;
    await user.save();

    res.json({ user: publicUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName } = req.body;

    //   Check if user already exists
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      throw new Error("Email Already Registered");
    }

    //hash Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //newUser
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    });
    await newUser.save();
    res.status(200).json({ id: newUser.id });
  } catch (e) {
    res.status(401).json({ message: `${e}` });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.status(200).send("Successful");
});

app.post("/request-reset-password", async (req, res) => {
  const { email } = req.body;
  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "User not found" });

  // Create a reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordToken = jwt.sign({ id: user._id, token: resetToken }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // Send email

  await sendPasswordResetEmail(email, resetPasswordToken);
  res.status(200).send({ message: "Password reset email sent" });
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.send("Password has been reset");
  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
});

app.post("/protected", (req, res) => {
  const { user } = req.session;

  if (!user) return res.send("Access Denied").status(401);
  res.json({ user: user }).status(200);
});

app.post("/refresh_token", async (req, res) => {
  //create new access token
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) return res.status(403).json({ message: "No Token Refreshed" });

    const data = jwt.verify(refresh_token, JWT_SECRET_REFRESH);
    //Check if user exists
    const user = await User.findById(data.id);
    if (!user) throw new Error("username does not exists");

    //Remove Password from return object
    const publicUser = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };

    const newAccessToken = jwt.sign({ user: publicUser }, JWT_SECRET, {
      expiresIn: "15m",
    });

    //save tokens in cookie
    res.clearCookie("access_token");
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Access Token Refreshed", token: newAccessToken });
  } catch (e) {
    res.status(403).json({ message: "No Token Refreshed" });
  }
});

app.get("/user", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (e) {
    console.log(e);
  }
});

app.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ email: id });
    res.status(200).json(user);
  } catch (e) {
    console.log(e);
  }
});

app.post("/user/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  if (data.password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    await User.updateOne({ email: id }, { password: hashedPassword });
  }

  try {
    const userToUpdate = await User.updateOne(
      { email: id },
      {
        name: data.name,
        username: data.username,
        phone: data.phone,
        address: {
          city: data.city,
          street: data.street,
          unit: data.unit,
          zip: data.zipCode,
        },
      }
    );

    console.log(userToUpdate);
    res.status(200).json({ message: "User Updated" });
  } catch (e) {
    console.log(e);
    res.json({ message: "User NOT Updated" });
  }
});

app.patch("/user/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await User.updateOne(
      { email: id },
      {
        admin: updates.admin,
      }
    );
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.patch("/profile/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.deleteOne({ email: id });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// app.get("/bitacoras", async (req, res) => {
//   try {
//     const bitacoras = await Bitacora.find();
//     res.status(200).json(bitacoras);
//   } catch (e) {
//     console.error("Error fetching  bitácoras:", e);
//     res.status(500).json({error: "An error occurred while fetching past bitácoras."});
//   }
// });

app.get("/bitacoras", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    const operador = req.query.operador;
    const statusFilter = req.query.statusFilter;
    const creationDateFilter = req.query.creationDateFilter;
    const clienteFilter = req.query.clienteFilter;
    const monitoreoFilter = req.query.monitoreoFilter;
    const operadorFilter = req.query.operadorFilter;
    const idFilter = req.query.idFilter;
    const sortField = req.query.sortField || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const allowedClients = req.query.allowed_clients; // Nuevo parámetro para filtrar por permisos de cliente

    const query = {};

    // Exclude soft deleted bitacoras
    query.deleted = { $ne: true };

    // Apply client permissions filtering FIRST (most restrictive)
    if (allowedClients) {
      const clientsList = allowedClients.split(',').map(c => c.trim().toUpperCase());
      query.cliente = { $in: clientsList };
    }

    // Build query based on filters
    if (operador) query.operador = operador;
    if (statusFilter) query.status = statusFilter;
    if (clienteFilter) {
      // Si ya hay filtro de clientes permitidos, hacer intersección
      if (query.cliente && query.cliente.$in) {
        const filteredClients = query.cliente.$in.filter(c =>
          c.toUpperCase().includes(clienteFilter.toUpperCase())
        );
        query.cliente = { $in: filteredClients };
      } else {
        query.cliente = { $regex: clienteFilter, $options: "i" };
      }
    }
    if (monitoreoFilter) query.monitoreo = { $regex: monitoreoFilter, $options: "i" };
    if (operadorFilter) query.operador = { $regex: operadorFilter, $options: "i" };
    if (idFilter) query.bitacora_id = { $regex: idFilter, $options: "i" };
    if (creationDateFilter) {
      const startDate = new Date(creationDateFilter);
      const endDate = new Date(creationDateFilter);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

    const totalItems = await Bitacora.countDocuments(query);
    const bitacoras = await Bitacora.find(query).sort(sortObj).skip(skip).limit(limit);

    res.status(200).json({
      bitacoras,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (e) {
    console.error("Error fetching bitacoras:", e);
    res.status(500).json({ error: "An error occurred while fetching bitacoras." });
  }
});

// Endpoint para descargar todas las bitácoras de un cliente específico (sin paginación)
app.get("/bitacoras/download/:clienteName", async (req, res) => {
  try {
    const { clienteName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador } = req.query;

    // Build query filters (same as pagination endpoint)
    let query = {
      cliente: decodeURIComponent(clienteName),
      deleted: { $ne: true }
    };

    // Add date range filter if provided
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Add transport line filter if provided
    if (lineaTransporte && lineaTransporte !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'transportes.lineaTransporte': lineaTransporte }
        ]
      });
    }

    // Add operator filter if provided
    if (operador && operador !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'transportes.operador': operador }
        ]
      });
    }

    // Get ALL bitacoras for this client (no pagination for download) using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo = null, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      totalCount: formattedBitacoras.length,
      cliente: decodeURIComponent(clienteName)
    });
  } catch (error) {
    console.error("Error fetching all bitacoras for download:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for download" });
  }
});

// Endpoint para obtener bitácoras por cliente específico
app.get("/bitacoras/by-client/:clienteName", async (req, res) => {
  try {
    const { clienteName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador } = req.query;

    // Build query filters
    let query = {
      cliente: decodeURIComponent(clienteName),
      deleted: { $ne: true } // Exclude soft deleted bitacoras
    };

    // Add date range filter if provided
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Add transport line filter
    if (lineaTransporte && lineaTransporte !== 'all') {
      query.$or = [
        { linea_transporte: lineaTransporte },
        { 'transportes.lineaTransporte': lineaTransporte }
      ];
    }

    // Add operator filter
    if (operador && operador !== 'all') {
      // If there's already an $or filter, we need to combine with $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { operador: operador },
              { 'transportes.operador': operador }
            ]
          }
        ];
        delete query.$or;
      } else {
        query.$or = [
          { operador: operador },
          { 'transportes.operador': operador }
        ];
      }
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Bitacora.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get bitacoras for this client with detailed information using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo = null, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching bitacoras by client:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for client" });
  }
});

// Endpoint para obtener bitácoras por usuario específico
app.get("/bitacoras/by-user/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador, page = 1, limit = 20 } = req.query;

    // Construir query base
    let query = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro por usuario
    if (userName && userName !== 'all') {
      query.$or = [
        { operador: decodeURIComponent(userName) },
        { 'transportes.operador': decodeURIComponent(userName) }
      ];
    }

    // Filtros adicionales
    if (fechaDesde) {
      query.createdAt = { ...query.createdAt, $gte: new Date(fechaDesde) };
    }
    if (fechaHasta) {
      query.createdAt = { ...query.createdAt, $lte: new Date(fechaHasta + 'T23:59:59.999Z') };
    }
    if (lineaTransporte && lineaTransporte !== 'all') {
      query['transportes.lineaTransporte'] = decodeURIComponent(lineaTransporte);
    }
    if (operador && operador !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { operador: decodeURIComponent(operador) },
          { 'transportes.operador': decodeURIComponent(operador) }
        ]
      });
    }

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Bitacora.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get bitacoras for this user with detailed information using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching bitacoras by user:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for user" });
  }
});

// Endpoint para descargar todas las bitácoras de un usuario
app.get("/bitacoras/download-user/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador } = req.query;

    // Construir query base
    let query = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro por usuario
    if (userName && userName !== 'all') {
      query.$or = [
        { operador: decodeURIComponent(userName) },
        { 'transportes.operador': decodeURIComponent(userName) }
      ];
    }

    // Filtros adicionales
    if (fechaDesde) {
      query.createdAt = { ...query.createdAt, $gte: new Date(fechaDesde) };
    }
    if (fechaHasta) {
      query.createdAt = { ...query.createdAt, $lte: new Date(fechaHasta + 'T23:59:59.999Z') };
    }
    if (lineaTransporte && lineaTransporte !== 'all') {
      query['transportes.lineaTransporte'] = decodeURIComponent(lineaTransporte);
    }
    if (operador && operador !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { operador: decodeURIComponent(operador) },
          { 'transportes.operador': decodeURIComponent(operador) }
        ]
      });
    }

    // Get ALL bitacoras for this user (no pagination for download) using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      totalCount: formattedBitacoras.length,
      usuario: decodeURIComponent(userName)
    });
  } catch (error) {
    console.error("Error fetching all bitacoras for user download:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for user download" });
  }
});

app.post("/bitacora", async (req, res) => {
  // Import validation utilities
  const { validateAndConvertObjectIds } = await import('./utils/validationUtils.js');

  // Validate and convert ObjectIds first
  const objectIdValidation = validateAndConvertObjectIds(req.body, ['origen', 'destino']);

  if (objectIdValidation.errors.length > 0) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: objectIdValidation.errors
    });
  }

  // Convertir campos de texto a mayúsculas antes de procesar
  const excludeFields = ['status', 'inicioMonitoreo', 'finalMonitoreo', 'telefono', '_id', 'createdAt', 'updatedAt', 'bitacora_id', 'capacidad', 'gpsUnits', 'origen', 'destino'];
  const data = convertToUpperCase(objectIdValidation.data, excludeFields);

  try {
    const sequence = await BitSequence.findOneAndUpdate(
      { name: "bitacora_id" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    const sequenceNumber = sequence.sequence_value.toString().padStart(6, "0");

    const newItem = new Bitacora({
      bitacora_id: sequenceNumber,
      folio_servicio: data.folio_servicio,
      linea_transporte: data.linea_transporte,
      destino: data.destino,
      origen: data.origen,
      monitoreo: data.monitoreo,
      cliente: data.cliente,
      enlace: data.enlace,
      id_acceso: data.id_acceso,
      contra_acceso: data.contra_acceso,
      remolque: {
        eco: data.remolque?.eco,
        placa: data.remolque?.placa,
        color: data.remolque?.color,
        capacidad: data.remolque?.capacidad,
        sello: data.remolque?.sello,
      },
      tracto: {
        eco: data.tracto?.eco,
        placa: data.tracto?.placa,
        marca: data.tracto?.marca,
        modelo: data.tracto?.modelo,
        color: data.tracto?.color,
        tipo: data.tracto?.tipo,
      },
      operador: data.operador,
      telefono: data.telefono,
      inicioMonitoreo: data.inicioMonitoreo ? new Date(data.inicioMonitoreo) : null,
      finalMonitoreo: data.finalMonitoreo ? new Date(data.finalMonitoreo) : null,
      status: data.status || "creada",
      eventos: data.eventos || [],

      // 🆕 Inject only if it's custodia física
      ...((data.monitoreo === "Custodia fisica" || data.monitoreo === "CUSTODIA FISICA" || data.monitoreo?.toLowerCase() === "custodia fisica") && {
        custodia: {
          custodio1_nombre: data.custodia?.custodio1_nombre,
          custodio1_telefono: data.custodia?.custodio1_telefono,
          custodio2_nombre: data.custodia?.custodio2_nombre,
          custodio2_telefono: data.custodia?.custodio2_telefono,
          placa: data.custodia?.placa,
          modelo: data.custodia?.modelo,
          color: data.custodia?.color,
          marca: data.custodia?.marca,
        },
      }),
    });

    await newItem.save();
    await auditCreation({ newData: newItem.toObject(), modelId: newItem._id, user: req.session.user || {}, seccion: "Bitacora" });

    // Use aggregation to resolve origen and destino names in the response
    const resolvedBitacora = await Bitacora.aggregate([
      {
        $match: {
          _id: newItem._id,
          deleted: { $ne: true }
        }
      },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origen: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: { $arrayElemAt: ['$origenInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$origenInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$origenInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          },
          destino: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: { $arrayElemAt: ['$destinoInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$destinoInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$destinoInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          }
        }
      },
      // Remove the lookup arrays to clean up the response
      {
        $project: {
          origenInfoById: 0,
          origenInfoByName: 0,
          destinoInfoById: 0,
          destinoInfoByName: 0,
          origenForLookup: 0,
          destinoForLookup: 0
        }
      }
    ]);

    res.status(201).send(resolvedBitacora[0]);
  } catch (err) {
    console.error("Error creating bitacora:", err);
    res.status(500).send("Error creating bitacora");
  }
});

// Get deleted bitacoras (for admin purposes)
app.get("/bitacoras/deleted", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Only show deleted bitacoras
    const query = { deleted: true };

    // Build sort object
    const sortObj = { deleted_at: -1 }; // Most recently deleted first

    const totalItems = await Bitacora.countDocuments(query);
    const deletedBitacoras = await Bitacora.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      bitacoras: deletedBitacoras,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (e) {
    console.error("Error fetching deleted bitacoras:", e);
    res.status(500).json({ error: "An error occurred while fetching deleted bitacoras." });
  }
});

app.get("/bitacora/:id", async (req, res) => {
  try {
    // Use aggregation to resolve origen and destino names
    const bitacoras = await Bitacora.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          deleted: { $ne: true }
        }
      },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origen: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: { $arrayElemAt: ['$origenInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$origenInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$origenInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          },
          destino: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: { $arrayElemAt: ['$destinoInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$destinoInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$destinoInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          }
        }
      },
      // Remove the lookup arrays to clean up the response
      {
        $project: {
          origenInfoById: 0,
          origenInfoByName: 0,
          destinoInfoById: 0,
          destinoInfoByName: 0,
          origenForLookup: 0,
          destinoForLookup: 0
        }
      }
    ]);

    if (bitacoras.length === 0) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    res.json(bitacoras[0]);
  } catch (error) {
    console.error("Error fetching bitacora:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/bitacora/:id/event", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, registrado_por, frecuencia, transportes } = req.body;

  console.log(transportes);

  try {
    // Find the bitacora by its ID (exclude deleted)
    const bitacora = await Bitacora.findOne({
      _id: id,
      deleted: { $ne: true }
    });
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    // ── 1) Flag the *previous* event, if any ──
    const lastIdx = bitacora.eventos.length - 1;
    if (lastIdx >= 0) {
      const prev = bitacora.eventos[lastIdx];
      const elapsed = Date.now() - new Date(prev.createdAt).getTime();
      const windowMs = (prev.frecuencia || 0) * 60000;
      // was the timer met before we added a new event?
      prev.isFrecuenciaMet = elapsed <= windowMs;
      bitacora.markModified("eventos");
    }

    // Create a new event
    const newEvent = {
      nombre,
      descripcion,
      registrado_por,
      frecuencia,
      transportes,
    };

    // Add the new event to the bitacora's eventos array
    bitacora.eventos.push(newEvent);

    // Save the updated bitacora
    await bitacora.save();

    // Respond with the updated bitacora
    res.status(200).json(bitacora);
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Update Bitacora
app.patch("/bitacora/:id", async (req, res) => {
  const { id } = req.params;

  // Convertir campos de texto a mayúsculas antes de procesar
  const excludeFields = ['status', 'inicioMonitoreo', 'finalMonitoreo', 'telefono', '_id', 'createdAt', 'updatedAt', 'bitacora_id', 'capacidad', 'gpsUnits'];
  const updatedData = convertToUpperCase(req.body, excludeFields);
  console.log(updatedData);

  try {
    const bitacora = await Bitacora.findOne({
      _id: id,
      deleted: { $ne: true }
    });
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    // Update the existing bitacora with the new data
    Object.assign(bitacora, updatedData);

    const updatedBitacora = await bitacora.save();
    await auditUpdate({ oldData: bitacora.toObject(), newData: updatedData, modelId: id, user: req.session.user || {}, seccion: "Bitacora" });

    // Use aggregation to resolve origen and destino names in the response
    const resolvedBitacora = await Bitacora.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          deleted: { $ne: true }
        }
      },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origen: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: { $arrayElemAt: ['$origenInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$origenInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$origenInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          },
          destino: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: { $arrayElemAt: ['$destinoInfoById.nombre', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$destinoInfoByName' }, 0] },
                  then: { $arrayElemAt: ['$destinoInfoByName.nombre', 0] },
                  else: 'Ubicación no encontrada'
                }
              }
            }
          }
        }
      },
      // Remove the lookup arrays to clean up the response
      {
        $project: {
          origenInfoById: 0,
          origenInfoByName: 0,
          destinoInfoById: 0,
          destinoInfoByName: 0,
          origenForLookup: 0,
          destinoForLookup: 0
        }
      }
    ]);

    res.json(resolvedBitacora[0]);
  } catch (error) {
    console.error("Error updating bitacora:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Add trasnportes
app.post("/bitacoras/:id/transportes", async (req, res) => {
  try {
    const bitacoraId = req.params.id;
    const { id, tracto, remolque, operador, lineaTransporte, telefono, gpsUnits } = req.body;

    // Find the bitacora by ID (exclude deleted)
    const bitacora = await Bitacora.findOne({
      _id: bitacoraId,
      deleted: { $ne: true }
    });
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    // Create a new Transporte object
    const newTransporte = {
      id,
      tracto,
      remolque,
      lineaTransporte,
      operador,
      telefono,
      gpsUnits: gpsUnits || [], // Incluir gpsUnits, por defecto array vacío
    };

    // Add the new Transporte to the bitacora's transportes array
    bitacora.transportes.push(newTransporte);

    // Save the updated bitacora
    await bitacora.save();

    // Return the updated bitacora
    res.status(200).json(bitacora);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Endpoint to start a bitacora
app.patch("/bitacora/:id/start", async (req, res) => {
  try {
    const bitacora = await Bitacora.findOne({
      _id: req.params.id,
      deleted: { $ne: true }
    });
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    const date = new Date();
    bitacora.iniciada = true;
    bitacora.inicioMonitoreo = date;
    await bitacora.save();

    res.json(bitacora);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to finish a bitacora
app.patch("/bitacora/:id/finish", async (req, res) => {
  try {
    const bitacora = await Bitacora.findOne({
      _id: req.params.id,
      deleted: { $ne: true }
    });
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }
    const date = new Date();
    bitacora.activa = false;
    bitacora.finalMonitoreo = date;
    await bitacora.save();

    res.json(bitacora);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/bitacora/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bitacora = await Bitacora.findOne({
      _id: id,
      deleted: { $ne: true }
    });
    if (!bitacora) return res.status(404).json({ message: "Bitacora not found" });

    bitacora.status = status;
    await bitacora.save();

    res.json(bitacora);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/bitacora/:id/edited", async (req, res) => {
  try {
    const { id } = req.params;
    const { edited } = req.body;

    const bitacora = await Bitacora.findOne({
      _id: id,
      deleted: { $ne: true }
    });
    if (!bitacora) return res.status(404).json({ message: "Bitacora not found" });

    bitacora.edited = edited;
    await bitacora.save();

    res.json(bitacora);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Soft delete bitacora - mark as deleted instead of removing
app.delete("/bitacora/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const bitacora = await Bitacora.findById(id);
    if (!bitacora) {
      return res.status(404).json({ message: "Bitacora not found" });
    }

    if (bitacora.deleted) {
      return res.status(400).json({ message: "Bitacora already deleted" });
    }

    // Store the original data for audit
    const oldData = bitacora.toObject();

    // Mark as deleted instead of removing
    bitacora.deleted = true;
    bitacora.deleted_at = new Date();
    bitacora.deleted_by = user ? `${user.firstName} ${user.lastName}` : 'Unknown';

    await bitacora.save();

    // Create audit record for deletion
    await auditDeletion({
      oldData,
      modelId: id,
      user: user || {},
      seccion: "Bitacora"
    });

    res.status(200).json({
      message: "Bitacora marked as deleted successfully",
      bitacora: {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        deleted: bitacora.deleted,
        deleted_at: bitacora.deleted_at,
        deleted_by: bitacora.deleted_by
      }
    });
  } catch (error) {
    console.error("Error soft deleting bitacora:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Restore a soft deleted bitacora
app.patch("/bitacora/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const bitacora = await Bitacora.findOne({
      _id: id,
      deleted: true
    });

    if (!bitacora) {
      return res.status(404).json({ message: "Deleted bitacora not found" });
    }

    // Store the data before restoration for audit
    const oldData = bitacora.toObject();

    // Restore the bitacora
    bitacora.deleted = false;
    bitacora.deleted_at = undefined;
    bitacora.deleted_by = undefined;

    await bitacora.save();

    // Create audit record for restoration
    await auditUpdate({
      oldData,
      newData: { deleted: false },
      modelId: id,
      user: user || {},
      seccion: "Bitacora"
    });

    res.status(200).json({
      message: "Bitacora restored successfully",
      bitacora: {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        deleted: bitacora.deleted
      }
    });
  } catch (error) {
    console.error("Error restoring bitacora:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Monitoreos
app.get("/monitoreos", async (req, res) => {
  try {
    const monitoreos = await Monitoreo.find();
    res.status(200).json(monitoreos);
  } catch (error) {
    console.error("Error fetching monitoreos:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Edit an existing origen
app.put("/monitoreos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoMonitoreo } = req.body;
    const updatedMonitoreo = await Monitoreo.findByIdAndUpdate(id, { tipoMonitoreo }, { new: true });
    res.json(updatedMonitoreo);
  } catch (e) {
    res.status(500).json({ message: "Failed to edit origen", error: e.message });
  }
});

app.delete("/monitoreos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMonitoreo = await Monitoreo.findByIdAndDelete(id);
    if (!deletedMonitoreo) {
      return res.status(404).json({ message: "Monitoreo not found" });
    }

    // Decrement the sequence counter
    await decrementTipoMonitoreoSequence();

    await auditDeletion({ oldData: deletedMonitoreo.toObject(), modelId: id, user: req.session.user || {}, seccion: "Monitoreo" });
    res.status(200).json({ message: "Monitoreo deleted successfully" });
  } catch (error) {
    console.error("Error deleting monitoreo:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/monitoreos", async (req, res) => {
  const { tipoMonitoreo } = req.body;
  if (!tipoMonitoreo) {
    return res.status(400).json({ message: "Tipo de monitoreo is required" });
  }

  try {
    // Get next sequence number
    const numericId = await getNextTipoMonitoreoSequence();

    const newMonitoreo = new Monitoreo({ tipoMonitoreo, numericId });
    const savedMonitoreo = await newMonitoreo.save();
    await auditCreation({ newData: savedMonitoreo.toObject(), modelId: savedMonitoreo._id, user: req.session.user || {}, seccion: "Monitoreo" });
    res.status(201).json(savedMonitoreo);
  } catch (error) {
    console.error("Error creating monitoreo:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//USERS
// GET users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//CREATE users
app.post("/users", async (req, res) => {
  const { email, password, firstName, lastName, phone, countryKey, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email Already Registered" });
    }

    // Hash Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create and save the new user
    const newUser = new User({
      email,
      password: hashedPassword, // Ensure this matches your schema
      firstName,
      lastName,
      phone,
      countryKey,
      role,
    });

    await newUser.save();
    await auditCreation({ newData: newUser.toObject(), modelId: newUser._id, user: req.session.user || {}, seccion: "Usuario" });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /users/:id
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    await auditDeletion({ oldData: deletedUser.toObject(), modelId: id, user: req.session.user || {}, seccion: "Usuario" });
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//UPDATE user
app.put("/users/:id", async (req, res) => {
  const { password, firstName, lastName, phone, role } = req.body;

  try {
    const prevUser = await User.findById(req.params.id);
    if (!prevUser) return res.status(404).json({ message: "User not found" });
    const oldData = prevUser.toObject();
    const updateData = { firstName, lastName, phone, role };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    await auditUpdate({ oldData, newData: updateData, modelId: req.params.id, user: req.session.user || {}, seccion: "Usuario" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user); // <-- Return updated user (not "SAVED")
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//CLIENTS
// Get all clients
app.get("/clients", async (req, res) => {
  try {
    // Get user from session
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get role permissions
    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    let clients;

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);
      clients = await Client.find({
        $or: [
          { razon_social: { $in: allowedClientNames } },
          { name: { $in: allowedClientNames } }
        ]
      });
    } else {
      // User has access to all clients
      clients = await Client.find();
    }

    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new client
app.post("/clients", async (req, res) => {
  try {
    // Get next sequence number
    const numericId = await getNextClienteSequence();

    // Add numericId to request body and convert to uppercase
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const clientData = { ...convertToUpperCase(req.body, excludeFields), numericId };

    // Create new client with ID_Cliente
    const client = new Client(clientData);
    const newClient = await client.save();
    await auditCreation({ newData: newClient.toObject(), modelId: newClient._id, user: req.session.user || {}, seccion: "Cliente" });
    res.status(201).json(newClient);
  } catch (error) {
    // Handle errors
    res.status(400).json({ message: error.message });
  }
});

// Update a client
app.put("/clients/:id", async (req, res) => {
  try {
    const prevClient = await Client.findById(req.params.id);
    if (!prevClient) return res.status(404).json({ message: "Client not found" });
    const oldData = prevClient.toObject();

    // Convertir campos de texto a mayúsculas antes de actualizar
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, uppercaseData, { new: true });
    await auditUpdate({ oldData, newData: req.body, modelId: req.params.id, user: req.session.user || {}, seccion: "Cliente" });
    res.json(updatedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a client
app.delete("/clients/:id", async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Decrement the sequence counter
    await decrementClienteSequence();

    await auditDeletion({ oldData: deletedClient.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Cliente" });
    res.json({ message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//EVENTS
app.get("/event_types", async (req, res) => {
  try {
    const eventsTypes = await EventType.find();
    res.json(eventsTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Create a new evenType
app.put("/event_types/:id", async (req, res) => {
  const { evento, categoria, calificacion } = req.body;

  try {
    const prevEvent = await EventType.findById(req.params.id);
    if (!prevEvent) return res.status(404).json({ message: "Event not found" });
    const oldData = prevEvent.toObject();
    const updatedEvent = await EventType.findByIdAndUpdate(
      req.params.id,
      { evento, categoria, calificacion },
      { new: true }
    );
    await auditUpdate({ oldData, newData: { evento, categoria, calificacion }, modelId: req.params.id, user: req.session.user || {}, seccion: "Evento" });

    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.post("/event_types", async (req, res) => {
  const { evento, categoria, calificacion } = req.body;

  try {
    const existingEventType = await EventType.findOne({
      evento: new RegExp(`^${evento}$`, "i"),
      categoria: new RegExp(`^${categoria}$`, "i"),
      calificacion: new RegExp(`^${calificacion}$`, "i"),
    });

    if (existingEventType) {
      return res.status(409).json({ message: "Event type already exists" });
    }

    // Get next sequence number
    const numericId = await getNextEventTypeSequence();

    const newEvent = new EventType({ evento, categoria, calificacion, numericId });
    const saved = await newEvent.save();
    await auditCreation({ newData: saved.toObject(), modelId: saved._id, user: req.session.user || {}, seccion: "Evento" });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.delete("/event_types/:id", async (req, res) => {
  try {
    const deletedEvent = await EventType.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });

    // Decrement the sequence counter
    await decrementEventTypeSequence();

    await auditDeletion({ oldData: deletedEvent.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Evento" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//ROLES
app.get("/roles", async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// POST a new role
app.post("/roles", async (req, res) => {
  try {
    const role = new Role(req.body);
    const newRole = await role.save();
    await auditCreation({ newData: newRole.toObject(), modelId: newRole._id, user: req.session.user || {}, seccion: "Rol" });
    res.status(201).json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(400).json({ message: error.message });
  }
});


// PUT update a role
app.put("/roles/:id", async (req, res) => {
  try {
    const prevRole = await Role.findById(req.params.id);
    if (!prevRole) return res.status(404).json({ message: "Role not found" });
    const oldData = prevRole.toObject();
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    await auditUpdate({ oldData, newData: req.body, modelId: req.params.id, user: req.session.user || {}, seccion: "Rol" });

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(400).json({ message: error.message });
  }
});


app.get("/roles/:roleName", async (req, res) => {
  try {
    const roleName = req.params.roleName;
    const role = await Role.findOne({ name: roleName });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE a role
app.delete("/roles/:id", async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) return res.status(404).json({ message: "Role not found" });
    await auditDeletion({ oldData: deletedRole.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Rol" });
    res.json({ message: "Role deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ENDPOINTS PARA PERMISOS DE CLIENTES POR ROL

// GET clientes permitidos para un rol específico
app.get("/roles/:roleId/allowed-clients", async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      client_access: role.client_access,
      allowed_clients: role.allowed_clients || []
    });
  } catch (error) {
    console.error("Error fetching allowed clients:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT actualizar permisos de clientes para un rol
app.put("/roles/:roleId/allowed-clients", async (req, res) => {
  try {
    const { client_access, allowed_clients } = req.body;

    // Validar que client_access sea válido
    if (!['all', 'specific'].includes(client_access)) {
      return res.status(400).json({ message: "client_access must be 'all' or 'specific'" });
    }

    // Si es 'specific', validar que se proporcionen clientes
    if (client_access === 'specific' && (!allowed_clients || allowed_clients.length === 0)) {
      return res.status(400).json({ message: "When client_access is 'specific', allowed_clients must be provided" });
    }

    const prevRole = await Role.findById(req.params.roleId);
    if (!prevRole) return res.status(404).json({ message: "Role not found" });

    const oldData = prevRole.toObject();

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.roleId,
      {
        client_access: client_access,
        allowed_clients: client_access === 'all' ? [] : allowed_clients
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await auditUpdate({
      oldData,
      newData: { client_access, allowed_clients },
      modelId: req.params.roleId,
      user: req.session.user || {},
      seccion: "Rol - Permisos de Clientes"
    });

    res.json(updatedRole);
  } catch (error) {
    console.error("Error updating allowed clients:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET clientes filtrados según permisos del usuario actual
app.get("/clients/filtered", async (req, res) => {
  try {
    const userRole = req.session?.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: "User role not found" });
    }

    // Buscar el rol del usuario
    const role = await Role.findOne({ name: userRole });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    let clients;

    if (role.client_access === 'all') {
      // Si tiene acceso a todos los clientes, devolver todos
      clients = await Client.find().sort({ razon_social: 1 });
    } else if (role.client_access === 'specific') {
      // Si tiene acceso a clientes específicos, filtrar por los permitidos
      const allowedClientIds = role.allowed_clients.map(ac => ac.client_id);
      clients = await Client.find({
        _id: { $in: allowedClientIds }
      }).sort({ razon_social: 1 });
    } else {
      // Fallback: no devolver ningún cliente
      clients = [];
    }

    res.json(clients);
  } catch (error) {
    console.error("Error fetching filtered clients:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//ORIGENES
// Fetch all origenes
app.get("/origenes", async (req, res) => {
  try {
    const { cliente } = req.query;
    let query = {};

    // If cliente filter is provided, filter by cliente
    if (cliente && cliente !== "all") {
      query.cliente = cliente;
    }

    const origenes = await Origen.find(query);
    res.json(origenes);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch origenes", error: e.message });
  }
});

// Create a new origen
app.post("/origenes", async (req, res) => {
  try {
    // Convertir campos de texto a mayúsculas
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);
    const { estado, municipio: cliente, nombre } = uppercaseData;

    // Get next sequence number
    const numericId = await getNextOrigenSequence();

    const newOrigen = new Origen({ estado, cliente, nombre, numericId });
    const savedOrigen = await newOrigen.save();
    await auditCreation({ newData: savedOrigen.toObject(), modelId: savedOrigen._id, user: req.session.user || {}, seccion: "Origen" });
    res.status(201).json(savedOrigen);
  } catch (e) {
    res.status(500).json({ message: "Failed to create origen", error: e.message });
  }
});


// Edit an existing origen
app.put("/origenes/:id", async (req, res) => {
  try {
    const prevOrigen = await Origen.findById(req.params.id);
    if (!prevOrigen) return res.status(404).json({ message: "Origen not found" });
    const oldData = prevOrigen.toObject();

    // Convertir campos de texto a mayúsculas, excluyendo numericId
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);
    const { estado, municipio: cliente, nombre } = uppercaseData;

    const updatedOrigen = await Origen.findByIdAndUpdate(
      req.params.id,
      { estado, cliente, nombre },
      { new: true }
    );
    await auditUpdate({ oldData, newData: { estado, cliente, nombre }, modelId: req.params.id, user: req.session.user || {}, seccion: "Origen" });
    res.json(updatedOrigen);
  } catch (e) {
    res.status(500).json({ message: "Failed to edit origen", error: e.message });
  }
});


// Delete an origen
app.delete("/origenes/:id", async (req, res) => {
  try {
    const deletedOrigen = await Origen.findByIdAndDelete(req.params.id);
    if (!deletedOrigen) return res.status(404).json({ message: "Origen not found" });

    // Decrement the sequence counter
    await decrementOrigenSequence();

    await auditDeletion({ oldData: deletedOrigen.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Origen" });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ message: "Failed to delete origen", error: e.message });
  }
});

//DESTINOS
app.get("/destinos", async (req, res) => {
  try {
    const { cliente } = req.query;
    let query = {};

    // If cliente filter is provided, filter by cliente
    if (cliente && cliente !== "all") {
      query.cliente = cliente;
    }

    const destinos = await Destino.find(query);
    res.status(200).json(destinos);
  } catch (e) {
    res.status(500).json({ message: "Error fetching destinos", error: e.message });
  }
});

// Create a new destino
app.post("/destinos", async (req, res) => {
  try {
    // Convertir campos de texto a mayúsculas
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);
    const { estado, municipio: cliente, nombre } = uppercaseData;

    // Get next sequence number
    const numericId = await getNextDestinoSequence();

    const newDestino = new Destino({ estado, cliente, nombre, numericId });
    const savedDestino = await newDestino.save();
    await auditCreation({ newData: savedDestino.toObject(), modelId: savedDestino._id, user: req.session.user || {}, seccion: "Destino" });
    res.status(201).json(savedDestino);
  } catch (e) {
    res.status(500).json({ message: "Error creating destino", error: e.message });
  }
});


// Edit a destino
app.put("/destinos/:id", async (req, res) => {
  try {
    const prevDestino = await Destino.findById(req.params.id);
    if (!prevDestino) return res.status(404).json({ message: "Destino not found" });
    const oldData = prevDestino.toObject();

    // Convertir campos de texto a mayúsculas, excluyendo numericId
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);
    const { estado, municipio: cliente, nombre } = uppercaseData;

    const updatedDestino = await Destino.findByIdAndUpdate(
      req.params.id,
      { estado, cliente, nombre },
      { new: true }
    );
    await auditUpdate({ oldData, newData: { estado, cliente, nombre }, modelId: req.params.id, user: req.session.user || {}, seccion: "Destino" });
    res.status(200).json(updatedDestino);
  } catch (e) {
    res.status(500).json({ message: "Error updating destino", error: e.message });
  }
});


// Delete a destino
app.delete("/destinos/:id", async (req, res) => {
  try {
    const deletedDestino = await Destino.findByIdAndDelete(req.params.id);
    if (!deletedDestino) return res.status(404).json({ message: "Destino not found" });

    // Decrement the sequence counter
    await decrementDestinoSequence();

    await auditDeletion({ oldData: deletedDestino.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Destino" });
    res.status(200).json({ message: "Destino deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: "Error deleting destino", error: e.message });
  }
});

//OPERADORES
// Get all operadores
app.get("/operadores", async (req, res) => {
  try {
    const { lineaTransporte } = req.query;
    let query = {};

    // If lineaTransporte filter is provided, filter by lineaTransporte
    if (lineaTransporte && lineaTransporte !== "all") {
      query.lineaTransporte = lineaTransporte;
    }

    const operadores = await Operador.find(query);
    res.status(200).json(operadores);
  } catch (e) {
    res.status(500).json({ message: "Error fetching operadores", error: e.message });
  }
});

// Get available operators from bitacoras
app.get("/operadores-bitacoras", async (req, res) => {
  try {
    const operadores = await Bitacora.aggregate([
      { $match: { deleted: { $ne: true } } }, // Exclude deleted bitacoras
      // Solo obtener operadores del campo principal bitacora.operador
      {
        $group: {
          _id: '$operador',
          nombre: { $first: '$operador' }
        }
      },
      {
        $match: {
          nombre: { $ne: null, $ne: '' }
        }
      },
      { $sort: { nombre: 1 } },
      {
        $project: {
          _id: 1,
          nombre: 1
        }
      }
    ]);

    res.status(200).json(operadores);
  } catch (e) {
    res.status(500).json({ message: "Error fetching operadores from bitacoras", error: e.message });
  }
});

// Get available transport lines from bitacoras
app.get("/lineas-transporte-bitacoras", async (req, res) => {
  try {
    const lineasTransporte = await Bitacora.aggregate([
      { $match: { deleted: { $ne: true } } }, // Exclude deleted bitacoras
      // Solo obtener líneas de transporte del array transportes
      { $unwind: '$transportes' },
      {
        $addFields: {
          'transportes.lineaTransporte': {
            $cond: {
              if: {
                $or: [
                  { $eq: ['$transportes.lineaTransporte', null] },
                  { $eq: ['$transportes.lineaTransporte', ''] },
                  { $eq: ['$transportes.lineaTransporte', undefined] }
                ]
              },
              then: 'N/A',
              else: '$transportes.lineaTransporte'
            }
          }
        }
      },
      {
        $group: {
          _id: '$transportes.lineaTransporte',
          nombre: { $first: '$transportes.lineaTransporte' }
        }
      },
      { $sort: { nombre: 1 } },
      {
        $project: {
          _id: 1,
          nombre: 1
        }
      }
    ]);

    res.status(200).json(lineasTransporte);
  } catch (e) {
    res.status(500).json({ message: "Error fetching transport lines from bitacoras", error: e.message });
  }
});

// LINEAS DE TRANSPORTE
// Get all lineas de transporte
app.get("/lineas-transporte", async (req, res) => {
  try {
    const { cliente } = req.query;
    let query = {};

    // If cliente filter is provided, filter by cliente
    if (cliente && cliente !== "all") {
      query.cliente = cliente;
    }

    const lineasTransporte = await LineaTransporte.find(query);
    res.json(lineasTransporte);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new linea de transporte
app.post("/lineas-transporte", async (req, res) => {
  try {
    // Get next sequence number
    const numericId = await getNextLineaTransporteSequence();

    const lineaTransporte = new LineaTransporte({ ...req.body, numericId });
    const newLineaTransporte = await lineaTransporte.save();
    await auditCreation({ newData: newLineaTransporte.toObject(), modelId: newLineaTransporte._id, user: req.session.user || {}, seccion: "LineaTransporte" });
    res.status(201).json(newLineaTransporte);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a linea de transporte
app.put("/lineas-transporte/:id", async (req, res) => {
  try {
    const prevLineaTransporte = await LineaTransporte.findById(req.params.id);
    if (!prevLineaTransporte) return res.status(404).json({ message: "Linea de transporte not found" });
    const oldData = prevLineaTransporte.toObject();
    const updatedLineaTransporte = await LineaTransporte.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await auditUpdate({ oldData, newData: req.body, modelId: req.params.id, user: req.session.user || {}, seccion: "LineaTransporte" });
    res.json(updatedLineaTransporte);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a linea de transporte
app.delete("/lineas-transporte/:id", async (req, res) => {
  try {
    const deletedLineaTransporte = await LineaTransporte.findByIdAndDelete(req.params.id);
    if (!deletedLineaTransporte) {
      return res.status(404).json({ message: "Linea de transporte not found" });
    }

    // Decrement the sequence counter
    await decrementLineaTransporteSequence();

    await auditDeletion({ oldData: deletedLineaTransporte.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "LineaTransporte" });
    res.json({ message: "Linea de transporte deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new operador
app.post("/operadores", async (req, res) => {
  try {
    // Get next sequence number
    const numericId = await getNextOperadorSequence();

    // Convertir campos de texto a mayúsculas
    const excludeFields = ['_id', 'createdAt', 'updatedAt', 'telefono', 'numericId'];
    const uppercaseData = convertToUpperCase(req.body, excludeFields);
    const newOperador = new Operador({ ...uppercaseData, numericId });
    const savedOperador = await newOperador.save();
    await auditCreation({ newData: savedOperador.toObject(), modelId: savedOperador._id, user: req.session.user || {}, seccion: "Operador" });
    res.status(201).json(savedOperador);
  } catch (e) {
    res.status(500).json({ message: "Error creating operador", error: e.message });
  }
});

// Edit an operador
app.put("/operadores/:id", async (req, res) => {
  try {
    const prevOperador = await Operador.findById(req.params.id);
    if (!prevOperador) return res.status(404).json({ message: "Operador not found" });
    const oldData = prevOperador.toObject();
    const updatedOperador = await Operador.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    await auditUpdate({ oldData, newData: req.body, modelId: req.params.id, user: req.session.user || {}, seccion: "Operador" });
    res.status(200).json(updatedOperador);
  } catch (e) {
    res.status(500).json({ message: "Error updating operador", error: e.message });
  }
});

// Delete an operador
app.delete("/operadores/:id", async (req, res) => {
  try {
    const deletedOperador = await Operador.findByIdAndDelete(req.params.id);
    if (!deletedOperador) return res.status(404).json({ message: "Operador not found" });

    // Decrement the sequence counter
    await decrementOperadorSequence();

    await auditDeletion({ oldData: deletedOperador.toObject(), modelId: req.params.id, user: req.session.user || {}, seccion: "Operador" });
    res.status(200).json({ message: "Operador deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: "Error deleting operador", error: e.message });
  }
});

//Inactividad
app.get("/inactividad", async (req, res) => {
  try {
    const timeoutTime = await Inactividad.find({ name: "timeoutTime" });
    res.status(200).json(timeoutTime);
  } catch (e) {
    res.status(500).json({ message: "Error getting inactivity time", error: e.message });
  }
});

app.post("/inactividad", async (req, res) => {
  const { newTimeout } = req.body;

  try {
    const timeoutTime = await Inactividad.findOne({ name: "timeoutTime" });
    if (!timeoutTime) return res.status(404).json({ message: "Timeout not found" });

    timeoutTime.value = newTimeout;
    const newTimeoutTime = await timeoutTime.save();
    res.status(200).json(newTimeoutTime);
  } catch (e) {
    res.status(500).json({ message: "Error updating inactivity time", error: e.message });
  }
});

// [POST] Create a new auditoria document
app.post('/auditoria/bitacoras', async (req, res) => {
  try {
    const newAuditoria = new Auditoria(req.body);
    const saved = await newAuditoria.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('[POST /auditoria/bitacora] Error:', err);
    res.status(500).json({ error: 'Failed to create auditoria record' });
  }
});

// [GET] Fetch all auditoria documents
app.get('/auditoria/bitacoras', async (req, res) => {
  try {
    const auditorias = await Auditoria.find().sort({ createdAt: -1 });
    res.status(200).json(auditorias);
  } catch (err) {
    console.error('[GET /auditoria/bitacora] Error:', err);
    res.status(500).json({ error: 'Failed to fetch auditoria records' });
  }
});

// Endpoint para obtener bitácoras por ubicación específica
app.get("/bitacoras/by-location/:locationName", async (req, res) => {
  try {
    const { locationName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador, geoType, page = 1, limit = 20 } = req.query;

    // Construir query base
    let query = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro por ubicación (origen o destino) con matching case-insensitive
    if (locationName && locationName !== 'all') {
      const decodedLocationName = decodeURIComponent(locationName);
      if (geoType === 'origen') {
        // Para origen, necesitamos hacer matching case-insensitive con ObjectId
        // Primero intentamos encontrar el origen por nombre para obtener su _id
        const origenDoc = await Origen.findOne({
          nombre: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') }
        });

        if (origenDoc) {
          // Si encontramos el origen, buscamos bitácoras que coincidan con el _id (case-insensitive)
          query.$or = [
            { origen: origenDoc._id.toString() },
            { origen: { $regex: new RegExp(`^${origenDoc._id.toString()}$`, 'i') } },
            { 'origen.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        } else {
          // Si no encontramos el origen, buscamos por nombre (fallback)
          query.$or = [
            { origen: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } },
            { 'origen.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        }
      } else if (geoType === 'destino') {
        // Para destino, similar lógica
        const destinoDoc = await Destino.findOne({
          nombre: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') }
        });

        if (destinoDoc) {
          query.$or = [
            { destino: destinoDoc._id.toString() },
            { destino: { $regex: new RegExp(`^${destinoDoc._id.toString()}$`, 'i') } },
            { 'destino.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        } else {
          query.$or = [
            { destino: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } },
            { 'destino.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        }
      }
    }

    // Filtros adicionales
    if (fechaDesde) {
      query.createdAt = { ...query.createdAt, $gte: new Date(fechaDesde) };
    }
    if (fechaHasta) {
      query.createdAt = { ...query.createdAt, $lte: new Date(fechaHasta + 'T23:59:59.999Z') };
    }
    if (lineaTransporte && lineaTransporte !== 'all') {
      query['transportes.lineaTransporte'] = decodeURIComponent(lineaTransporte);
    }
    if (operador && operador !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { operador: decodeURIComponent(operador) },
          { 'transportes.operador': decodeURIComponent(operador) }
        ]
      });
    }

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Bitacora.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get bitacoras for this location with detailed information using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching bitacoras by location:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for location" });
  }
});

// Endpoint para descargar todas las bitácoras de una ubicación
app.get("/bitacoras/download-location/:locationName", async (req, res) => {
  try {
    const { locationName } = req.params;
    const { fechaDesde, fechaHasta, lineaTransporte, operador, geoType } = req.query;

    // Construir query base
    let query = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro por ubicación (origen o destino) con matching case-insensitive
    if (locationName && locationName !== 'all') {
      const decodedLocationName = decodeURIComponent(locationName);
      if (geoType === 'origen') {
        // Para origen, necesitamos hacer matching case-insensitive con ObjectId
        // Primero intentamos encontrar el origen por nombre para obtener su _id
        const origenDoc = await Origen.findOne({
          nombre: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') }
        });

        if (origenDoc) {
          // Si encontramos el origen, buscamos bitácoras que coincidan con el _id (case-insensitive)
          query.$or = [
            { origen: origenDoc._id.toString() },
            { origen: { $regex: new RegExp(`^${origenDoc._id.toString()}$`, 'i') } },
            { 'origen.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        } else {
          // Si no encontramos el origen, buscamos por nombre (fallback)
          query.$or = [
            { origen: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } },
            { 'origen.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        }
      } else if (geoType === 'destino') {
        // Para destino, similar lógica
        const destinoDoc = await Destino.findOne({
          nombre: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') }
        });

        if (destinoDoc) {
          query.$or = [
            { destino: destinoDoc._id.toString() },
            { destino: { $regex: new RegExp(`^${destinoDoc._id.toString()}$`, 'i') } },
            { 'destino.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        } else {
          query.$or = [
            { destino: { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } },
            { 'destino.nombre': { $regex: new RegExp(`^${decodedLocationName}$`, 'i') } }
          ];
        }
      }
    }

    // Filtros adicionales
    if (fechaDesde) {
      query.createdAt = { ...query.createdAt, $gte: new Date(fechaDesde) };
    }
    if (fechaHasta) {
      query.createdAt = { ...query.createdAt, $lte: new Date(fechaHasta + 'T23:59:59.999Z') };
    }
    if (lineaTransporte && lineaTransporte !== 'all') {
      query['transportes.lineaTransporte'] = decodeURIComponent(lineaTransporte);
    }
    if (operador && operador !== 'all') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { operador: decodeURIComponent(operador) },
          { 'transportes.operador': decodeURIComponent(operador) }
        ]
      });
    }

    // Get ALL bitacoras for this location (no pagination for download) using aggregation
    const bitacoras = await Bitacora.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      // Add fields to handle ObjectId conversion for lookups
      {
        $addFields: {
          origenForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$origen' }, 'string'] },
                  { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$origen' },
              else: '$origen'
            }
          },
          destinoForLookup: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$destino' }, 'string'] },
                  { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$destino' },
              else: '$destino'
            }
          }
        }
      },
      // Lookups with ObjectId conversion
      {
        $lookup: {
          from: 'origens',
          localField: 'origenForLookup',
          foreignField: '_id',
          as: 'origenInfoById'
        }
      },
      {
        $lookup: {
          from: 'origens',
          localField: 'origen',
          foreignField: 'nombre',
          as: 'origenInfoByName'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destinoForLookup',
          foreignField: '_id',
          as: 'destinoInfoById'
        }
      },
      {
        $lookup: {
          from: 'destinos',
          localField: 'destino',
          foreignField: 'nombre',
          as: 'destinoInfoByName'
        }
      },
      // Combine results - prefer _id match over nombre match
      {
        $addFields: {
          origenInfo: {
            $cond: {
              if: { $gt: [{ $size: '$origenInfoById' }, 0] },
              then: '$origenInfoById',
              else: '$origenInfoByName'
            }
          },
          destinoInfo: {
            $cond: {
              if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
              then: '$destinoInfoById',
              else: '$destinoInfoByName'
            }
          }
        }
      }
    ]);

    // Helper functions (same as in anomalias endpoint)
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    const getLocationName = (locationField, lookupInfo, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Format the data using the same helper functions as anomalias endpoint
    const formattedBitacoras = bitacoras.map(bitacora => {
      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        fechaCreacion: bitacora.createdAt,
        cliente: bitacora.cliente,
        tipoMonitoreo: bitacora.monitoreo,
        lineaTransporte: getTransportLines(bitacora.transportes),
        operadorTransporte: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        estado: bitacora.status,
        usuario: bitacora.operador || 'N/A'
      };
    });

    res.status(200).json({
      bitacoras: formattedBitacoras,
      totalCount: formattedBitacoras.length,
      ubicacion: decodeURIComponent(locationName)
    });
  } catch (error) {
    console.error("Error fetching all bitacoras for location download:", error);
    res.status(500).json({ error: "Failed to fetch bitacoras for location download" });
  }
});

// Dashboard Stats (for main dashboard)
app.get('/dashboard/stats', async (req, res) => {
  try {
    // Get user from session (already verified by middleware)
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get role permissions
    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Get filter parameters
    const {
      timeFilter = 'all',
      yearFilter = new Date().getFullYear(),
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Build time filter
    let timeFilterQuery = {};
    if (timeFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (timeFilter) {
        case 'today':
          timeFilterQuery = { createdAt: { $gte: startOfDay } };
          break;
        case 'week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          timeFilterQuery = { createdAt: { $gte: startOfWeek } };
          break;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          timeFilterQuery = { createdAt: { $gte: startOfMonth } };
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          timeFilterQuery = { createdAt: { $gte: startOfQuarter } };
          break;
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          timeFilterQuery = { createdAt: { $gte: startOfYear } };
          break;
      }
    }

    // Build filters based on user permissions
    let bitacoraFilter = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Add date range filter (priority over timeFilter and yearFilter)
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Add transport line filter
    if (lineaTransporte !== 'all') {
      // If we already have filters, we need to combine them properly
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        // Create a new $and filter to combine existing filters with transport line filter
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        // Add other existing filters
        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { linea_transporte: lineaTransporte },
              { 'transportes.lineaTransporte': lineaTransporte }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { linea_transporte: lineaTransporte },
          { 'transportes.lineaTransporte': lineaTransporte }
        ];
      }
    }

    // Add operator filter
    if (operador !== 'all') {
      // If we already have filters, we need to combine them properly
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        // Create a new $and filter to combine existing filters with operator filter
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        // Add other existing filters
        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: operador },
              { 'transportes.operador': operador }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: operador },
          { 'transportes.operador': operador }
        ];
      }
    }

    if (!role.bitacoras?.read_all) {
      // If user can't read all bitacoras, filter by their name
      const userFullName = `${user.firstName} ${user.lastName}`;
      // Only override operator filter if no specific operator is selected
      if (operador === 'all') {
        // If we already have filters, we need to combine them properly
        if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
          // Create a new $and filter to combine existing filters with user permission filter
          const existingFilters = {};
          if (bitacoraFilter.$or) {
            existingFilters.$or = bitacoraFilter.$or;
            delete bitacoraFilter.$or;
          }
          if (bitacoraFilter.$and) {
            existingFilters.$and = bitacoraFilter.$and;
            delete bitacoraFilter.$and;
          }

          // Add other existing filters
          Object.keys(bitacoraFilter).forEach(key => {
            if (key !== 'cliente' && key !== 'createdAt') {
              existingFilters[key] = bitacoraFilter[key];
              delete bitacoraFilter[key];
            }
          });

          bitacoraFilter.$and = [
            existingFilters,
            {
              $or: [
                { operador: userFullName },
                { 'transportes.operador': userFullName }
              ]
            }
          ];
        } else {
          bitacoraFilter.$or = [
            { operador: userFullName },
            { 'transportes.operador': userFullName }
          ];
        }
      }
    }

    // Add time/year filters - only if no date range filter is applied
    if (!fechaDesde || !fechaHasta) {
      if (yearFilter && yearFilter !== 'all') {
        // Si hay un año específico, usar solo ese año (ignorar otros filtros de tiempo)
        const startOfYear = new Date(parseInt(yearFilter), 0, 1);
        const endOfYear = new Date(parseInt(yearFilter), 11, 31, 23, 59, 59);
        bitacoraFilter.createdAt = {
          $gte: startOfYear,
          $lte: endOfYear
        };
      } else if (Object.keys(timeFilterQuery).length > 0) {
        // Solo usar filtros de tiempo si no hay año específico
        bitacoraFilter = { ...bitacoraFilter, ...timeFilterQuery };
      }
    }



    // Get bitacora statistics
    // For total cards, use January 2024 as default start date if no date filters are provided
    let totalCardsFilter = { ...bitacoraFilter };
    if (!fechaDesde || !fechaHasta || fechaDesde.trim() === '' || fechaHasta.trim() === '') {
      // Default to January 2024 for total cards when no date filters are provided
      const defaultStartDate = new Date('2024-01-01');
      const defaultEndDate = new Date(); // Current date

      totalCardsFilter.createdAt = {
        $gte: defaultStartDate,
        $lte: defaultEndDate
      };
    }

    let totalBitacoras = await Bitacora.countDocuments(totalCardsFilter);
    const nuevasBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: 'nueva' });
    const enProcesoBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: { $in: ['validada', 'iniciada'] } });
    const cerradasBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: { $in: ['cerrada', 'finalizada'] } });

    // Get user and client counts (only if user has permission)
    let totalUsers = 0;
    let totalClients = 0;

    if (role.usuarios?.read) {
      totalUsers = await User.countDocuments();
    }

    if (role.clientes?.read) {
      totalClients = await Client.countDocuments();
    }

    // Get recent activity (last 10 auditoria records)
    let recentActivity = [];
    try {
      recentActivity = await Auditoria.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('bitacora_id', 'bitacora_id')
        .lean();
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }

    const formattedActivity = recentActivity.map(activity => ({
      description: `${activity.tipo} - ${activity.seccion}`,
      icon: getActivityIcon(activity.tipo),
      color: getActivityColor(activity.tipo),
      timestamp: activity.createdAt
    }));

    // Get monthly data for the specified year or last 12 months
    let monthlyData = [];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    try {
      // Create a base filter that excludes date filters (we'll apply them month by month)
      let monthlyFilter = { ...bitacoraFilter };

      // Remove date filters from monthly filter since we'll apply them month by month
      if (monthlyFilter.createdAt) {
        delete monthlyFilter.createdAt;
      }

      // Check if date range filters are applied
      if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
        const startDate = new Date(fechaDesde);
        const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

        if (!isNaN(startDate) && !isNaN(endDate)) {
          // Generate monthly data only for the date range specified
          let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const endDateMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

          while (currentDate <= endDateMonth) {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

            // Make sure we don't go beyond the specified range
            const monthStart = startOfMonth < startDate ? startDate : startOfMonth;
            const monthEnd = endOfMonth > endDate ? endDate : endOfMonth;

            const monthCount = await Bitacora.countDocuments({
              ...monthlyFilter,
              createdAt: { $gte: monthStart, $lte: monthEnd }
            });

            monthlyData.push({
              month: months[currentDate.getMonth()],
              value: monthCount
            });

            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      } else if (yearFilter && yearFilter !== 'all') {
        // Si hay un año específico seleccionado, mostrar los 12 meses de ese año
        const selectedYear = parseInt(yearFilter);

        for (let i = 0; i < 12; i++) {
          const startOfMonth = new Date(selectedYear, i, 1);
          const endOfMonth = new Date(selectedYear, i + 1, 0, 23, 59, 59, 999);

          const monthCount = await Bitacora.countDocuments({
            ...monthlyFilter,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });

          monthlyData.push({
            month: months[i],
            value: monthCount
          });
        }
      } else {
        // Si no hay año específico, mostrar los últimos 12 meses
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

          const monthCount = await Bitacora.countDocuments({
            ...monthlyFilter,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });

          monthlyData.push({
            month: months[date.getMonth()],
            value: monthCount
          });
        }
      }

    } catch (error) {
      console.error('Error generating monthly data:', error);
      monthlyData = [];
    }

    // Ensure consistency between totalBitacoras and monthly data sum
    // When date filters are applied, the total should match the sum of monthly data
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const monthlySum = monthlyData.reduce((sum, month) => sum + month.value, 0);
      if (monthlySum !== totalBitacoras) {
        console.log(`⚠️ Inconsistency detected: totalBitacoras=${totalBitacoras}, monthlySum=${monthlySum}`);
        // Use the monthly sum as the source of truth for totalBitacoras when date filters are applied
        totalBitacoras = monthlySum;
      }
    }
    // Note: When no date filters are applied, totalBitacoras uses January 2024 default,
    // while monthly data shows last 12 months, so they may differ intentionally

    // Get status trends data
    const statusTrends = [
      {
        status: 'Activas',
        color: '#10b981',
        data: await Promise.all(months.map(async (month, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - index));
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const count = await Bitacora.countDocuments({
            ...bitacoraFilter,
            status: { $nin: ['cerrada', 'finalizada'] },
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });

          return { month, value: count };
        }))
      },
      {
        status: 'Completadas',
        color: '#3b82f6',
        data: await Promise.all(months.map(async (month, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - index));
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const count = await Bitacora.countDocuments({
            ...bitacoraFilter,
            status: { $in: ['cerrada', 'finalizada'] },
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });

          return { month, value: count };
        }))
      },
      {
        status: 'Pendientes',
        color: '#f59e0b',
        data: await Promise.all(months.map(async (month, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - index));
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const count = await Bitacora.countDocuments({
            ...bitacoraFilter,
            status: 'nueva',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });

          return { month, value: count };
        }))
      }
    ];

    // Get event distribution
    const eventDistribution = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      { $group: { _id: '$eventos.tipo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const eventColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
    const formattedEventDistribution = eventDistribution.map((event, index) => ({
      name: event._id || 'Sin especificar',
      count: event.count,
      color: eventColors[index % eventColors.length]
    }));

    // Get event categories statistics for pie chart (excluding "General")
    let eventCategoriesStats = [];
    try {
      // First, let's get all event types to understand the mapping
      const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
      console.log('Available event types:', eventTypes);

      // Get event names for each category
      const eventNamesByCategory = {};
      eventTypes.forEach(eventType => {
        if (!eventNamesByCategory[eventType.categoria]) {
          eventNamesByCategory[eventType.categoria] = [];
        }
        eventNamesByCategory[eventType.categoria].push(eventType.evento);
      });

      console.log('Event names by category:', eventNamesByCategory);

      // First, let's see how many bitacoras match our filter for event categories
      const matchingBitacorasForCategories = await Bitacora.find(bitacoraFilter).limit(5);
      console.log('Matching bitacoras for event categories (first 5):', matchingBitacorasForCategories.map(b => ({
        _id: b._id,
        bitacora_id: b.bitacora_id,
        operador: b.operador,
        eventos: b.eventos?.length || 0,
        eventNames: b.eventos?.map(e => e.nombre) || []
      })));

      // Now aggregate by event names that belong to our categories
      eventCategoriesStats = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$eventos' },
        {
          $match: {
            'eventos.nombre': {
              $in: eventTypes.map(et => et.evento)
            }
          }
        },
        {
          $lookup: {
            from: 'eventtypes',
            localField: 'eventos.nombre',
            foreignField: 'evento',
            as: 'eventTypeInfo'
          }
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$eventTypeInfo.categoria', 0] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      console.log('Raw event categories stats:', eventCategoriesStats);

      // Define colors for each category
      const categoryColors = {
        'ENA': '#3b82f6',  // Blue
        'FM': '#10b981',   // Green
        'ONC': '#f59e0b',  // Orange
        'DR': '#ef4444'    // Red
      };

      // Format the data with colors and ensure all categories are present
      const allCategories = ['ENA', 'FM', 'ONC', 'DR'];
      const formattedCategories = allCategories.map(category => {
        const found = eventCategoriesStats.find(stat => stat._id === category);
        return {
          categoria: category,
          count: found ? found.count : 0,
          color: categoryColors[category]
        };
      });

      eventCategoriesStats = formattedCategories;
      console.log('Formatted event categories stats:', eventCategoriesStats);
    } catch (error) {
      console.log('Error fetching event categories stats:', error);
      eventCategoriesStats = [];
    }

    // Get total bitacoras with anomalies count
    let totalBitacorasConAnomalias = 0;
    try {
      const totalBitacorasConAnomaliasResult = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$eventos' },
        {
          $lookup: {
            from: 'eventtypes',
            localField: 'eventos.nombre',
            foreignField: 'evento',
            as: 'eventTypeInfo'
          }
        },
        {
          $match: {
            'eventTypeInfo.categoria': { $ne: 'General' }
          }
        },
        // Group by bitacora ID to count unique bitacoras
        {
          $group: {
            _id: '$_id'
          }
        },
        {
          $count: 'total'
        }
      ]);

      totalBitacorasConAnomalias = totalBitacorasConAnomaliasResult.length > 0 ? totalBitacorasConAnomaliasResult[0].total : 0;
      console.log('Total bitacoras con anomalias:', totalBitacorasConAnomalias);
    } catch (error) {
      console.log('Error fetching total bitacoras con anomalias:', error);
      totalBitacorasConAnomalias = 0;
    }

    // Get geographic data
    const geoType = req.query.geoType || 'origen';
    let geographicData = [];
    try {
      console.log('=== DEBUG: Geographic Data Generation ===');
      console.log('geoType:', geoType);
      console.log('bitacoraFilter:', JSON.stringify(bitacoraFilter, null, 2));
      if (geoType === 'destino') {
        geographicData = await Bitacora.aggregate([
          { $match: bitacoraFilter },
          { $group: { _id: '$destino', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          // Add fields to handle ObjectId conversion for lookups
          {
            $addFields: {
              destinoForLookup: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: [{ $type: '$_id' }, 'string'] },
                      { $regexMatch: { input: '$_id', regex: '^[0-9a-fA-F]{24}$' } }
                    ]
                  },
                  then: { $toObjectId: '$_id' },
                  else: '$_id'
                }
              }
            }
          },
          // Lookups with ObjectId conversion
          {
            $lookup: {
              from: 'destinos',
              localField: 'destinoForLookup',
              foreignField: '_id',
              as: 'destinoInfoById'
            }
          },
          {
            $lookup: {
              from: 'destinos',
              localField: '_id',
              foreignField: 'nombre',
              as: 'destinoInfoByName'
            }
          },
          // Combine results - prefer _id match over nombre match
          {
            $addFields: {
              destinoInfo: {
                $cond: {
                  if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
                  then: '$destinoInfoById',
                  else: '$destinoInfoByName'
                }
              }
            }
          },
          {
            $project: {
              name: {
                $cond: {
                  if: { $gt: [{ $size: '$destinoInfo' }, 0] },
                  then: { $arrayElemAt: ['$destinoInfo.nombre', 0] },
                  else: '$_id'
                }
              },
              count: 1
            }
          }
        ]);
      } else {
        geographicData = await Bitacora.aggregate([
          { $match: bitacoraFilter },
          { $group: { _id: '$origen', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          // Add fields to handle ObjectId conversion for lookups
          {
            $addFields: {
              origenForLookup: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: [{ $type: '$_id' }, 'string'] },
                      { $regexMatch: { input: '$_id', regex: '^[0-9a-fA-F]{24}$' } }
                    ]
                  },
                  then: { $toObjectId: '$_id' },
                  else: '$_id'
                }
              }
            }
          },
          // Lookups with ObjectId conversion
          {
            $lookup: {
              from: 'origens',
              localField: 'origenForLookup',
              foreignField: '_id',
              as: 'origenInfoById'
            }
          },
          {
            $lookup: {
              from: 'origens',
              localField: '_id',
              foreignField: 'nombre',
              as: 'origenInfoByName'
            }
          },
          // Combine results - prefer _id match over nombre match
          {
            $addFields: {
              origenInfo: {
                $cond: {
                  if: { $gt: [{ $size: '$origenInfoById' }, 0] },
                  then: '$origenInfoById',
                  else: '$origenInfoByName'
                }
              }
            }
          },
          {
            $project: {
              name: {
                $cond: {
                  if: { $gt: [{ $size: '$origenInfo' }, 0] },
                  then: { $arrayElemAt: ['$origenInfo.nombre', 0] },
                  else: '$_id'
                }
              },
              count: 1
            }
          }
        ]);
      }

      console.log('Generated geographic data:', geographicData.length, 'items');
      console.log('Sample geographic data:', geographicData.slice(0, 3));
    } catch (error) {
      console.log('Error fetching geographic data:', error);
    }

    // Get operator efficiency
    let operatorEfficiency = [];
    try {
      operatorEfficiency = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        {
          $group: {
            _id: '$operador',
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $in: ['$status', ['cerrada', 'finalizada']] }, 1, 0] } }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: '$_id',
            total: 1,
            completed: 1,
            efficiency: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching operator efficiency:', error);
    }

    // Get tipos de monitoreo data
    let tiposMonitoreo = [];
    try {
      tiposMonitoreo = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $group: { _id: '$monitoreo', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $lookup: {
            from: 'monitoreos',
            localField: '_id',
            foreignField: 'tipoMonitoreo',
            as: 'tipoInfo'
          }
        },
        {
          $project: {
            nombre: {
              $cond: {
                if: { $gt: [{ $size: '$tipoInfo' }, 0] },
                then: { $arrayElemAt: ['$tipoInfo.tipoMonitoreo', 0] },
                else: '$_id'
              }
            },
            count: 1,
            color: { $arrayElemAt: ['$tipoInfo.color', 0] }
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching tipos de monitoreo:', error);
    }

    // Add colors to tipos de monitoreo if not present
    const tipoColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
    const formattedTiposMonitoreo = tiposMonitoreo.map((tipo, index) => ({
      ...tipo,
      color: tipoColors[index % tipoColors.length]
    }));

    // Get client performance
    let clientPerformance = [];
    try {
      clientPerformance = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        {
          $group: {
            _id: '$cliente',
            completed: { $sum: { $cond: [{ $in: ['$status', ['cerrada', 'finalizada']] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'nueva'] }, 1, 0] } }
          }
        },
        { $sort: { completed: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: 'razon_social',
            as: 'clientInfo'
          }
        },
        {
          $project: {
            name: {
              $cond: {
                if: { $gt: [{ $size: '$clientInfo' }, 0] },
                then: { $arrayElemAt: ['$clientInfo.razon_social', 0] },
                else: '$_id'
              }
            },
            completed: 1,
            pending: 1
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching client performance:', error);
    }

    // Get all clients
    let topClients = [];
    try {
      topClients = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $group: { _id: '$cliente', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: 'razon_social',
            as: 'clientInfo'
          }
        },
        {
          $project: {
            nombre: {
              $cond: {
                if: { $gt: [{ $size: '$clientInfo' }, 0] },
                then: { $arrayElemAt: ['$clientInfo.razon_social', 0] },
                else: '$_id'
              }
            },
            count: 1
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching all clients:', error);
    }

    // Get all operadores
    let topOperadores = [];
    try {
      topOperadores = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $group: { _id: '$operador', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $project: {
            name: '$_id',
            count: 1
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching all operadores:', error);
    }

    // Get all transport lines from transportes array
    let topLineasTransporte = [];
    try {
      topLineasTransporte = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$transportes' },
        {
          $addFields: {
            'transportes.lineaTransporte': {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$transportes.lineaTransporte', null] },
                    { $eq: ['$transportes.lineaTransporte', ''] },
                    { $eq: ['$transportes.lineaTransporte', undefined] }
                  ]
                },
                then: 'N/A',
                else: '$transportes.lineaTransporte'
              }
            }
          }
        },
        { $group: { _id: '$transportes.lineaTransporte', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $project: {
            nombre: '$_id',
            count: 1
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching all transport lines:', error);
    }

    // Get all transport operators
    let topOperadoresTransportes = [];
    try {
      topOperadoresTransportes = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$transportes' },
        {
          $addFields: {
            'transportes.operador': {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$transportes.operador', null] },
                    { $eq: ['$transportes.operador', ''] },
                    { $eq: ['$transportes.operador', undefined] }
                  ]
                },
                then: 'N/A',
                else: '$transportes.operador'
              }
            }
          }
        },
        { $group: { _id: '$transportes.operador', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $project: {
            nombre: '$_id',
            count: 1
          }
        }
      ]);
    } catch (error) {
      console.log('Error fetching all transport operators:', error);
    }

    res.status(200).json({
      totalBitacoras,
      nuevasBitacoras,
      enProcesoBitacoras,
      cerradasBitacoras,
      totalBitacorasConAnomalias,
      totalUsers,
      totalClients,
      recentActivity: formattedActivity,
      monthlyData,
      statusTrends,
      eventDistribution: formattedEventDistribution,
      eventCategoriesStats,
      geographicData,
      operatorEfficiency,
      clientPerformance,
      tiposMonitoreo: formattedTiposMonitoreo,
      topClients,
      topOperadores,
      topLineasTransporte,
      topOperadoresTransportes
    });

  } catch (err) {
    console.error('[GET /dashboard/stats] Error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Dashboard Stats for Anomalias Dashboard (without default time filters)
app.get('/dashboard/anomalias-stats', async (req, res) => {
  try {
    console.log('=== DEBUG: /dashboard/anomalias-stats ===');

    // Get user from session (already verified by middleware)
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get role permissions
    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Get filter parameters
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    console.log('Query params:', { clientFilter, fechaDesde, fechaHasta, lineaTransporte, operador });

    // Build filters based on user permissions
    let bitacoraFilter = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Add date range filter
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Note: lineaTransporte and operador filters are applied in the aggregation pipeline
    // after $unwind: '$eventos.transportes' to ensure correct nested field matching

    if (!role.bitacoras?.read_all) {
      // If user can't read all bitacoras, filter by their name
      const userFullName = `${user.firstName} ${user.lastName}`;
      // Only override operator filter if no specific operator is selected
      if (operador === 'all') {
        if (bitacoraFilter.$or || bitacoraFilter.$and) {
          // If we already have filters, create $and to combine them
          const existingFilters = {};
          if (bitacoraFilter.$or) {
            existingFilters.$or = bitacoraFilter.$or;
            delete bitacoraFilter.$or;
          }
          if (bitacoraFilter.$and) {
            existingFilters.$and = bitacoraFilter.$and;
            delete bitacoraFilter.$and;
          }

          bitacoraFilter.$and = [
            existingFilters,
            {
              $or: [
                { operador: userFullName },
                { 'transportes.operador': userFullName }
              ]
            }
          ];
        } else {
          bitacoraFilter.$or = [
            { operador: userFullName },
            { 'transportes.operador': userFullName }
          ];
        }
      }
    }

    // Get bitacora statistics
    // For total cards, use January 2024 as default start date if no date filters are provided
    let totalCardsFilter = { ...bitacoraFilter };
    if (!fechaDesde || !fechaHasta || fechaDesde.trim() === '' || fechaHasta.trim() === '') {
      // Default to January 2024 for total cards when no date filters are provided
      const defaultStartDate = new Date('2024-01-01');
      const defaultEndDate = new Date(); // Current date

      totalCardsFilter.createdAt = {
        $gte: defaultStartDate,
        $lte: defaultEndDate
      };
    }

    let totalBitacoras = await Bitacora.countDocuments(totalCardsFilter);
    const nuevasBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: 'nueva' });
    const enProcesoBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: { $in: ['validada', 'iniciada'] } });
    const cerradasBitacoras = await Bitacora.countDocuments({ ...totalCardsFilter, status: { $in: ['cerrada', 'finalizada'] } });

    // Get event categories statistics for pie chart (excluding "General")
    // Apply the same strict catalog validation as other anomaly endpoints
    let eventCategoriesStats = [];
    let totalBitacorasConAnomalias = 0;
    try {
      console.log('=== DEBUG: Starting eventCategoriesStats aggregation ===');
      console.log('bitacoraFilter for eventCategoriesStats:', JSON.stringify(bitacoraFilter, null, 2));

      // First, let's get all event types to understand the mapping
      const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
      console.log('Found eventTypes:', eventTypes.map(et => ({ evento: et.evento, categoria: et.categoria })));

      // First, get the total count of unique bitacoras with anomalies
      // This should count bitacoras that have at least one event with categoria != "general"
      // Apply the same filters as the bitacoras-anomalias endpoint
      const totalBitacorasConAnomaliasResult = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$eventos' },
        {
          $lookup: {
            from: 'eventtypes',
            localField: 'eventos.nombre',
            foreignField: 'evento',
            as: 'eventTypeInfo'
          }
        },
        {
          $match: {
            'eventTypeInfo.categoria': { $ne: 'General' }
          }
        },
        // Unwind the transportes array within each evento (same as bitacoras-anomalias endpoint)
        { $unwind: '$eventos.transportes' },
        // Apply transport line filter if specified (case-insensitive) - same as bitacoras-anomalias endpoint
        ...(lineaTransporte !== 'all' ? [{
          $match: {
            $expr: {
              $eq: [
                { $toLower: { $trim: { input: '$eventos.transportes.lineaTransporte' } } },
                { $toLower: { $trim: { input: lineaTransporte } } }
              ]
            }
          }
        }] : []),
        // Apply operator filter if specified (case-insensitive) - same as bitacoras-anomalias endpoint
        ...(operador !== 'all' ? [{
          $match: {
            $expr: {
              $eq: [
                { $toLower: { $trim: { input: '$eventos.transportes.operador' } } },
                { $toLower: { $trim: { input: operador } } }
              ]
            }
          }
        }] : []),
        // Group by bitacora ID to count unique bitacoras
        {
          $group: {
            _id: '$_id'
          }
        },
        {
          $count: 'total'
        }
      ]);

      totalBitacorasConAnomalias = totalBitacorasConAnomaliasResult.length > 0 ? totalBitacorasConAnomaliasResult[0].total : 0;

      // Now aggregate by event categories with full catalog validation
      eventCategoriesStats = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$eventos' },
        {
          $match: {
            'eventos.nombre': {
              $in: eventTypes.map(et => et.evento)
            }
          }
        },
        // Unwind the transportes array within each evento
        { $unwind: '$eventos.transportes' },
        // Verify that the transport line exists in the official catalog
        {
          $lookup: {
            from: 'lineatransportes',
            let: {
              lineaTransporte: '$eventos.transportes.lineaTransporte',
              cliente: '$cliente'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] },
                      { $eq: [{ $toLower: { $trim: { input: '$cliente' } } }, { $toLower: { $trim: { input: '$$cliente' } } }] }
                    ]
                  }
                }
              }
            ],
            as: 'lineaTransporteInfo'
          }
        },
        // Verify that the operator exists in the official catalog and is linked to the transport line
        {
          $lookup: {
            from: 'operadores',
            let: {
              operador: '$eventos.transportes.operador',
              lineaTransporte: '$eventos.transportes.lineaTransporte'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$operador' } } }] },
                      { $eq: [{ $toLower: { $trim: { input: '$lineaTransporte' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] }
                    ]
                  }
                }
              }
            ],
            as: 'operadorInfo'
          }
        },
        // Only include if both transport line and operator exist in the official catalog
        {
          $match: {
            $and: [
              { 'lineaTransporteInfo': { $ne: [] } },
              { 'operadorInfo': { $ne: [] } }
            ]
          }
        },
        {
          $lookup: {
            from: 'eventtypes',
            localField: 'eventos.nombre',
            foreignField: 'evento',
            as: 'eventTypeInfo'
          }
        },
        // Group by bitacora ID and category to count unique bitacoras per category
        {
          $group: {
            _id: {
              bitacoraId: '$_id',
              categoria: { $arrayElemAt: ['$eventTypeInfo.categoria', 0] }
            }
          }
        },
        // Now group by category to get the count of unique bitacoras per category
        {
          $group: {
            _id: '$_id.categoria',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      console.log('=== DEBUG: eventCategoriesStats aggregation completed ===');
      console.log('Raw eventCategoriesStats:', JSON.stringify(eventCategoriesStats, null, 2));

      // Define colors for each category
      const categoryColors = {
        'ENA': '#3b82f6',  // Blue
        'FM': '#10b981',   // Green
        'ONC': '#f59e0b',  // Orange
        'DR': '#ef4444'    // Red
      };

      // Format the data with colors and ensure all categories are present
      const allCategories = ['ENA', 'FM', 'ONC', 'DR'];
      const formattedCategories = allCategories.map(category => {
        const found = eventCategoriesStats.find(stat => stat._id === category);
        return {
          categoria: category,
          count: found ? found.count : 0,
          color: categoryColors[category]
        };
      });

      eventCategoriesStats = formattedCategories;
    } catch (error) {
      console.log('Error fetching event categories stats:', error);
      eventCategoriesStats = [];
    }

    const response = {
      totalBitacoras,
      nuevasBitacoras,
      enProcesoBitacoras,
      cerradasBitacoras,
      totalBitacorasConAnomalias,
      eventCategoriesStats
    };

    console.log('=== DEBUG: Final response for /dashboard/anomalias-stats ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    res.status(200).json(response);

  } catch (err) {
    console.error('[GET /dashboard/anomalias-stats] Error:', err);
    res.status(500).json({ error: 'Failed to fetch anomalias dashboard statistics' });
  }
});

// Helper functions for dashboard
function getActivityIcon(tipo) {
  const iconMap = {
    'CREATE': 'fa-plus',
    'UPDATE': 'fa-edit',
    'DELETE': 'fa-trash',
    'LOGIN': 'fa-sign-in-alt',
    'LOGOUT': 'fa-sign-out-alt'
  };
  return iconMap[tipo] || 'fa-info-circle';
}

function getActivityColor(tipo) {
  const colorMap = {
    'CREATE': 'success',
    'UPDATE': 'info',
    'DELETE': 'danger',
    'LOGIN': 'primary',
    'LOGOUT': 'secondary'
  };
  return colorMap[tipo] || 'muted';
}

// Additional dashboard endpoints for detailed data
app.get('/dashboard/monthly-trend', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findById(user.role);
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    const { yearFilter = new Date().getFullYear() } = req.query;

    // Build filters based on user permissions
    let bitacoraFilter = {};
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      bitacoraFilter.operador = userFullName;
    }

    // Add year filter
    if (yearFilter && yearFilter !== 'all') {
      const startOfYear = new Date(parseInt(yearFilter), 0, 1);
      const endOfYear = new Date(parseInt(yearFilter), 11, 31, 23, 59, 59);
      bitacoraFilter.createdAt = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(parseInt(yearFilter), i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthCount = await Bitacora.countDocuments({
        ...bitacoraFilter,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      monthlyData.push({
        month: months[i],
        value: monthCount
      });
    }

    res.status(200).json(monthlyData);
  } catch (err) {
    console.error('[GET /dashboard/monthly-trend] Error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly trend data' });
  }
});

app.get('/dashboard/status-distribution', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    const { timeFilter = 'all', yearFilter = new Date().getFullYear(), clientFilter = 'all' } = req.query;

    // Build time filter
    let timeFilterQuery = {};
    if (timeFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (timeFilter) {
        case 'today':
          timeFilterQuery = { createdAt: { $gte: startOfDay } };
          break;
        case 'week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          timeFilterQuery = { createdAt: { $gte: startOfWeek } };
          break;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          timeFilterQuery = { createdAt: { $gte: startOfMonth } };
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          timeFilterQuery = { createdAt: { $gte: startOfQuarter } };
          break;
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          timeFilterQuery = { createdAt: { $gte: startOfYear } };
          break;
      }
    }

    // Add year filter
    if (yearFilter) {
      const startOfYear = new Date(parseInt(yearFilter), 0, 1);
      const endOfYear = new Date(parseInt(yearFilter), 11, 31, 23, 59, 59);
      timeFilterQuery = {
        ...timeFilterQuery,
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }

    // Build filters based on user permissions
    let bitacoraFilter = { ...timeFilterQuery };

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      bitacoraFilter.operador = userFullName;
    }

    const statusDistribution = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusColors = {
      'nueva': '#10b981',
      'cerrada': '#3b82f6',
      'finalizada': '#3b82f6',
      'creada': '#f59e0b',
      'en_proceso': '#8b5cf6'
    };

    const formattedStatusDistribution = statusDistribution.map(status => ({
      status: status._id,
      count: status.count,
      color: statusColors[status._id] || '#64748b'
    }));

    res.status(200).json(formattedStatusDistribution);
  } catch (err) {
    console.error('[GET /dashboard/status-distribution] Error:', err);
    res.status(500).json({ error: 'Failed to fetch status distribution data' });
  }
});

app.get('/dashboard/event-types', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    const { timeFilter = 'all', yearFilter = new Date().getFullYear(), clientFilter = 'all' } = req.query;

    // Build time filter
    let timeFilterQuery = {};
    if (timeFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (timeFilter) {
        case 'today':
          timeFilterQuery = { createdAt: { $gte: startOfDay } };
          break;
        case 'week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          timeFilterQuery = { createdAt: { $gte: startOfWeek } };
          break;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          timeFilterQuery = { createdAt: { $gte: startOfMonth } };
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          timeFilterQuery = { createdAt: { $gte: startOfQuarter } };
          break;
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          timeFilterQuery = { createdAt: { $gte: startOfYear } };
          break;
      }
    }

    // Add year filter
    if (yearFilter && yearFilter !== 'all') {
      const startOfYear = new Date(parseInt(yearFilter), 0, 1);
      const endOfYear = new Date(parseInt(yearFilter), 11, 31, 23, 59, 59);
      timeFilterQuery = {
        ...timeFilterQuery,
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }

    // Build filters based on user permissions
    let bitacoraFilter = { ...timeFilterQuery };

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      bitacoraFilter.operador = userFullName;
    }

    const eventTypes = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      { $group: { _id: '$eventos.nombre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const eventColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];

    const formattedEventTypes = eventTypes.map((event, index) => ({
      name: event._id || 'Sin especificar',
      count: event.count,
      color: eventColors[index % eventColors.length]
    }));

    res.status(200).json(formattedEventTypes);
  } catch (err) {
    console.error('[GET /dashboard/event-types] Error:', err);
    res.status(500).json({ error: 'Failed to fetch event types data' });
  }
});

// Test endpoint for event categories
app.get('/test/event-categories', async (req, res) => {
  try {
    // Get all event types
    const eventTypes = await EventType.find();
    console.log('All event types:', eventTypes);

    // Get event types by category
    const eventTypesByCategory = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
    console.log('Event types by category:', eventTypesByCategory);

    // Get some bitacoras with events
    const bitacorasWithEvents = await Bitacora.find({ 'eventos.0': { $exists: true } }).limit(5);
    console.log('Bitacoras with events:', bitacorasWithEvents);

    res.json({
      allEventTypes: eventTypes,
      eventTypesByCategory: eventTypesByCategory,
      bitacorasWithEvents: bitacorasWithEvents
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener datos de eventos ONC para el gráfico de barras
app.get('/dashboard/onc-events', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = {};

    // Filtro de fechas
    console.log('ONC Date filter values:', { fechaDesde, fechaHasta, fechaDesdeType: typeof fechaDesde, fechaHastaType: typeof fechaHasta });

    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      console.log('ONC Parsed dates:', { startDate, endDate, startDateValid: !isNaN(startDate), endDateValid: !isNaN(endDate) });

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
        console.log('ONC Date filter applied:', bitacoraFilter.createdAt);
      }
    }

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Note: lineaTransporte and operador filters are applied in the aggregation pipeline
    // after $unwind: '$eventos.transportes' to ensure correct nested field matching



    // Debug: Log the filters being used for ONC events
    console.log('ONC events filters:', {
      clientFilter,
      fechaDesde,
      fechaHasta,
      lineaTransporte,
      operador,
      bitacoraFilter: JSON.stringify(bitacoraFilter, null, 2)
    });

    // Filtro de permisos de usuario para ONC events
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      // Always apply user permission filter, but if a specific operator is selected, 
      // make sure it matches the user's name
      if (operador !== 'all' && operador !== userFullName) {
        // If a specific operator is selected that doesn't match the user, return empty results
        console.log('ONC events: User does not have permission to view this operator, returning empty results');
        return res.status(200).json([]);
      }

      // If we already have filters, we need to combine them properly
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        // Create a new $and filter to combine existing filters with user permission filter
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        // Add other existing filters
        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: userFullName },
              { 'transportes.operador': userFullName }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: userFullName },
          { 'transportes.operador': userFullName }
        ];
      }
    }

    // Obtener todos los eventos de tipo ONC
    const oncEventTypes = await EventType.find({ categoria: 'ONC' });
    console.log('ONC Event types found:', oncEventTypes);

    // First, let's see how many bitacoras match our filter
    const matchingBitacoras = await Bitacora.find(bitacoraFilter).limit(5);
    console.log('Matching bitacoras for ONC events (first 5):', matchingBitacoras.map(b => ({
      _id: b._id,
      bitacora_id: b.bitacora_id,
      operador: b.operador,
      eventos: b.eventos?.length || 0
    })));

    // Obtener datos de eventos ONC de las bitácoras con catalog validation
    const oncEventsData = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      {
        $match: {
          'eventTypeInfo.categoria': 'ONC'
        }
      },
      // Unwind the transportes array within each evento
      { $unwind: '$eventos.transportes' },
      // Verify that the transport line exists in the official catalog
      {
        $lookup: {
          from: 'lineatransportes',
          let: {
            lineaTransporte: '$eventos.transportes.lineaTransporte',
            cliente: '$cliente'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] },
                    { $eq: [{ $toLower: { $trim: { input: '$cliente' } } }, { $toLower: { $trim: { input: '$$cliente' } } }] }
                  ]
                }
              }
            }
          ],
          as: 'lineaTransporteInfo'
        }
      },
      // Verify that the operator exists in the official catalog and is linked to the transport line
      {
        $lookup: {
          from: 'operadores',
          let: {
            operador: '$eventos.transportes.operador',
            lineaTransporte: '$eventos.transportes.lineaTransporte'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$operador' } } }] },
                    { $eq: [{ $toLower: { $trim: { input: '$lineaTransporte' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] }
                  ]
                }
              }
            }
          ],
          as: 'operadorInfo'
        }
      },
      // Only include if transport line exists in the official catalog (less restrictive)
      {
        $match: {
          'lineaTransporteInfo': { $ne: [] }
        }
      },
      // Apply transport line filter if specified
      ...(lineaTransporte !== 'all' ? [{
        $match: {
          $expr: {
            $eq: [
              { $toLower: { $trim: { input: '$eventos.transportes.lineaTransporte' } } },
              { $toLower: { $trim: { input: lineaTransporte } } }
            ]
          }
        }
      }] : []),
      // Apply operator filter if specified
      ...(operador !== 'all' ? [{
        $match: {
          $expr: {
            $eq: [
              { $toLower: { $trim: { input: '$eventos.transportes.operador' } } },
              { $toLower: { $trim: { input: operador } } }
            ]
          }
        }
      }] : []),
      {
        $group: {
          _id: '$eventos.nombre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('ONC Events data:', oncEventsData);

    // Debug logging
    console.log('[DEBUG] ONC events endpoint:', {
      clientFilter,
      lineaTransporte,
      operador,
      oncEventTypesCount: oncEventTypes.length,
      oncEventsDataCount: oncEventsData.length,
      oncEventTypes: oncEventTypes.map(et => et.evento),
      oncEventsDataRaw: oncEventsData.slice(0, 5)
    });

    // Función para generar iniciales del evento
    const getEventInitials = (eventName) => {
      // Obtener la parte antes del "/"
      const parts = eventName.split('/');
      if (parts.length === 0) {
        return eventName.substring(0, 3).toUpperCase();
      }

      const beforeSlash = parts[0].trim();

      // Dividir en palabras y obtener las iniciales
      const words = beforeSlash.split(' ').filter(word => word.length > 0);

      if (words.length === 0) {
        return eventName.substring(0, 3).toUpperCase();
      }

      // Generar iniciales basadas en el número de palabras
      let initials = '';
      if (words.length === 1) {
        // Si es 1 palabra, usar solo una letra
        initials = words[0].charAt(0).toUpperCase();
      } else if (words.length === 2) {
        // Si son 2 palabras, usar 2 letras
        initials = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
      } else if (words.length >= 3) {
        // Si son 3 o más palabras, usar 3 letras
        initials = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase() + words[2].charAt(0).toUpperCase();
      }

      return initials;
    };

    // Colores para las barras
    const barColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
      '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
    ];

    // Formatear datos para el gráfico
    const formattedData = oncEventTypes.map((eventType, index) => {
      const eventData = oncEventsData.find(data => data._id === eventType.evento);
      const count = eventData ? eventData.count : 0;

      return {
        eventName: eventType.evento,
        initials: getEventInitials(eventType.evento),
        count: count,
        color: barColors[index % barColors.length]
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('[GET /dashboard/onc-events] Error:', error);
    res.status(500).json({ error: 'Failed to fetch ONC events data' });
  }
});

// Endpoint para obtener bitácoras con anomalías
app.get('/dashboard/bitacoras-anomalias', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro de fechas
    console.log('Bitacoras Anomalias Date filter values:', { fechaDesde, fechaHasta, fechaDesdeType: typeof fechaDesde, fechaHastaType: typeof fechaHasta });

    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      console.log('Bitacoras Anomalias Parsed dates:', { startDate, endDate, startDateValid: !isNaN(startDate), endDateValid: !isNaN(endDate) });

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
        console.log('Bitacoras Anomalias Date filter applied:', bitacoraFilter.createdAt);
      }
    }

    // Note: lineaTransporte and operador filters are applied in the aggregation pipeline
    // after $unwind: '$eventos.transportes' to ensure correct nested field matching

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Filtro de permisos de usuario para bitacoras anomalias
    // NOTE: For the anomalies dashboard, we want to show ALL bitacoras with anomalies,
    // not just the ones where the current user is the operator
    // This allows users to see the complete picture of anomalies in the system
    /*
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      // Always apply user permission filter, but if a specific operator is selected, 
      // make sure it matches the user's name
      if (operador !== 'all' && operador !== userFullName) {
        // If a specific operator is selected that doesn't match the user, return empty results
        console.log('Bitacoras anomalias: User does not have permission to view this operator, returning empty results');
        return res.status(200).json([]);
      }

      // If we already have filters, we need to combine them properly
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        // Create a new $and filter to combine existing filters with user permission filter
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        // Add other existing filters
        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: userFullName },
              { 'transportes.operador': userFullName }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: userFullName },
          { 'transportes.operador': userFullName }
        ];
      }
    }
    */

    // Obtener bitácoras que tengan al menos un evento de categoría diferente a "General"
    console.log('Starting aggregation for bitacoras con anomalias...');
    console.log('Final bitacoraFilter:', JSON.stringify(bitacoraFilter, null, 2));
    console.log('Transport filters:', { lineaTransporte, operador });
    let bitacorasConAnomalias;
    try {
      console.log('=== DEBUG: /dashboard/bitacoras-anomalias ===');
      console.log('bitacoraFilter:', JSON.stringify(bitacoraFilter, null, 2));

      bitacorasConAnomalias = await Bitacora.aggregate([
        { $match: bitacoraFilter },
        { $unwind: '$eventos' },
        {
          $lookup: {
            from: 'eventtypes',
            localField: 'eventos.nombre',
            foreignField: 'evento',
            as: 'eventTypeInfo'
          }
        },
        {
          $match: {
            'eventTypeInfo.categoria': { $ne: 'General' }
          }
        },
        {
          $group: {
            _id: '$_id',
            bitacora_id: { $first: '$bitacora_id' },
            cliente: { $first: '$cliente' },
            linea_transporte: { $first: '$linea_transporte' },
            operador: { $first: '$operador' },
            origen: { $first: '$origen' },
            destino: { $first: '$destino' },
            status: { $first: '$status' },
            createdAt: { $first: '$createdAt' },
            transportes: { $first: '$transportes' },
            eventos: { $push: '$eventos' },
            eventTypes: { $push: '$eventTypeInfo' }
          }
        },
        // Apply transport line filter if specified (case-insensitive)
        ...(lineaTransporte !== 'all' ? [{
          $match: {
            $expr: {
              $in: [
                { $toLower: { $trim: { input: lineaTransporte } } },
                {
                  $map: {
                    input: '$transportes',
                    as: 'transporte',
                    in: { $toLower: { $trim: { input: '$$transporte.lineaTransporte' } } }
                  }
                }
              ]
            }
          }
        }] : []),
        // Apply operator filter if specified (case-insensitive)
        ...(operador !== 'all' ? [{
          $match: {
            $expr: {
              $in: [
                { $toLower: { $trim: { input: operador } } },
                {
                  $map: {
                    input: '$transportes',
                    as: 'transporte',
                    in: { $toLower: { $trim: { input: '$$transporte.operador' } } }
                  }
                }
              ]
            }
          }
        }] : []),
        // Add fields to handle ObjectId conversion for lookups
        {
          $addFields: {
            origenForLookup: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $type: '$origen' }, 'string'] },
                    { $regexMatch: { input: '$origen', regex: '^[0-9a-fA-F]{24}$' } }
                  ]
                },
                then: { $toObjectId: '$origen' },
                else: '$origen'
              }
            },
            destinoForLookup: {
              $cond: {
                if: {
                  $and: [
                    { $eq: [{ $type: '$destino' }, 'string'] },
                    { $regexMatch: { input: '$destino', regex: '^[0-9a-fA-F]{24}$' } }
                  ]
                },
                then: { $toObjectId: '$destino' },
                else: '$destino'
              }
            }
          }
        },
        // Lookups with ObjectId conversion
        {
          $lookup: {
            from: 'origens',
            localField: 'origenForLookup',
            foreignField: '_id',
            as: 'origenInfoById'
          }
        },
        {
          $lookup: {
            from: 'origens',
            localField: 'origen',
            foreignField: 'nombre',
            as: 'origenInfoByName'
          }
        },
        {
          $lookup: {
            from: 'destinos',
            localField: 'destinoForLookup',
            foreignField: '_id',
            as: 'destinoInfoById'
          }
        },
        {
          $lookup: {
            from: 'destinos',
            localField: 'destino',
            foreignField: 'nombre',
            as: 'destinoInfoByName'
          }
        },
        // Combine results - prefer _id match over nombre match
        {
          $addFields: {
            origenInfo: {
              $cond: {
                if: { $gt: [{ $size: '$origenInfoById' }, 0] },
                then: '$origenInfoById',
                else: '$origenInfoByName'
              }
            },
            destinoInfo: {
              $cond: {
                if: { $gt: [{ $size: '$destinoInfoById' }, 0] },
                then: '$destinoInfoById',
                else: '$destinoInfoByName'
              }
            }
          }
        },
        { $sort: { createdAt: -1 } }
      ]);

      console.log(`=== DEBUG: Aggregation completed. Found ${bitacorasConAnomalias.length} bitacoras with anomalies.`);

      if (bitacorasConAnomalias.length > 0) {
        console.log('First bitacora sample:', JSON.stringify(bitacorasConAnomalias[0], null, 2));
      }
    } catch (aggregationError) {
      console.error('Error in aggregation pipeline:', aggregationError);
      throw new Error(`Aggregation failed: ${aggregationError.message}`);
    }

    // Helper function to extract location name using lookup data
    const getLocationName = (locationField, lookupInfo, debugContext = '') => {
      // First, try to use lookup data if available
      if (lookupInfo && lookupInfo.length > 0) {
        const locationData = lookupInfo[0];
        const result = `${locationData.nombre}, ${locationData.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // Fallback to original field processing
      if (!locationField) {
        return 'N/A';
      }

      // If it's an object with nombre and estado properties
      if (typeof locationField === 'object' && locationField.nombre) {
        const result = `${locationField.nombre}, ${locationField.estado || ''}`.trim().replace(/,$/, '');
        return result;
      }

      // If it's a plain string and not an ObjectId
      if (typeof locationField === 'string' && !locationField.match(/^[0-9a-f]{24}$/i)) {
        return locationField;
      }

      // If it's an ObjectId string and no lookup data found
      return `ObjectId no resuelto: ${locationField}`;
    };

    // Helper function to extract safe field value (handles objects and ObjectIds)
    const getSafeFieldValue = (field) => {
      if (!field) return 'N/A';

      // If it's an object, try to extract a meaningful value
      if (typeof field === 'object') {
        // If it has a 'nombre' property, use that
        if (field.nombre) return field.nombre;
        // If it has a 'razon_social' property (for clients), use that
        if (field.razon_social) return field.razon_social;
        // Otherwise, convert to string
        return String(field);
      }

      // If it's already a string, return as is
      return field;
    };

    // Helper function to get transport lines from transportes array
    const getTransportLines = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const lines = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.lineaTransporte || transporte.lineaTransporte.trim() === '') {
            return 'N/A';
          }
          return transporte.lineaTransporte;
        })
        .filter((line, index, array) => array.indexOf(line) === index); // Remove duplicates

      return lines.length > 0 ? lines.join(', ') : 'N/A';
    };

    // Helper function to get transport operators from transportes array
    const getTransportOperators = (transportes) => {
      if (!transportes || !Array.isArray(transportes) || transportes.length === 0) {
        return 'N/A';
      }

      const operators = transportes
        .map(transporte => {
          // Convert null, undefined, or empty string to 'N/A'
          if (!transporte.operador || transporte.operador.trim() === '') {
            return 'N/A';
          }
          return transporte.operador;
        })
        .filter((operator, index, array) => array.indexOf(operator) === index); // Remove duplicates

      return operators.length > 0 ? operators.join(', ') : 'N/A';
    };

    // Formatear los datos para la respuesta
    const formattedBitacoras = bitacorasConAnomalias.map(bitacora => {
      // Obtener las categorías únicas de eventos para esta bitácora
      const categorias = [...new Set(bitacora.eventTypes.flat().map(et => et.categoria).filter(cat => cat && cat !== 'General'))];



      return {
        _id: bitacora._id,
        bitacora_id: bitacora.bitacora_id,
        cliente: getSafeFieldValue(bitacora.cliente),
        linea_transporte: getTransportLines(bitacora.transportes),
        operador: getTransportOperators(bitacora.transportes),
        origen: getLocationName(bitacora.origen, bitacora.origenInfo, 'ORIGEN'),
        destino: getLocationName(bitacora.destino, bitacora.destinoInfo, 'DESTINO'),
        status: getSafeFieldValue(bitacora.status),
        createdAt: bitacora.createdAt,
        categorias: categorias,
        totalEventos: bitacora.eventos.length
      };
    });

    console.log(`=== DEBUG: Final formatted data has ${formattedBitacoras.length} items`);
    if (formattedBitacoras.length > 0) {
      console.log('First formatted bitacora sample:', JSON.stringify(formattedBitacoras[0], null, 2));
    }

    res.status(200).json(formattedBitacoras);
  } catch (error) {
    console.error('[GET /dashboard/bitacoras-anomalias] Error:', error);
    res.status(500).json({ error: 'Failed to fetch bitacoras with anomalies' });
  }
});

// Endpoint para obtener estadísticas de anomalías por cliente
app.get('/dashboard/client-anomalias-stats', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = {};

    // Filtro de fechas
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Filtro de línea de transporte
    if (lineaTransporte !== 'all') {
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { linea_transporte: lineaTransporte },
              { 'transportes.lineaTransporte': lineaTransporte }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { linea_transporte: lineaTransporte },
          { 'transportes.lineaTransporte': lineaTransporte }
        ];
      }
    }

    // Filtro de operador
    if (operador !== 'all') {
      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: operador },
              { 'transportes.operador': operador }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: operador },
          { 'transportes.operador': operador }
        ];
      }
    }

    // Filtro de permisos de usuario
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      if (operador !== 'all' && operador !== userFullName) {
        return res.status(200).json([]);
      }

      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: userFullName },
              { 'transportes.operador': userFullName }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: userFullName },
          { 'transportes.operador': userFullName }
        ];
      }
    }

    // Obtener tipos de eventos para categorías
    const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
    const eventNamesByCategory = {};
    eventTypes.forEach(eventType => {
      if (!eventNamesByCategory[eventType.categoria]) {
        eventNamesByCategory[eventType.categoria] = [];
      }
      eventNamesByCategory[eventType.categoria].push(eventType.evento);
    });

    // Agregar filtro para bitácoras con anomalías
    const allEventNames = eventTypes.map(et => et.evento);
    bitacoraFilter['eventos.nombre'] = { $in: allEventNames };

    // Obtener estadísticas por cliente
    const clientStats = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      {
        $match: {
          'eventos.nombre': { $in: allEventNames }
        }
      },
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      {
        $group: {
          _id: '$cliente',
          anomalias: { $sum: 1 },
          bitacoras: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          cliente: '$_id',
          anomalias: 1,
          bitacoras: { $size: '$bitacoras' }
        }
      },
      { $sort: { anomalias: -1 } },
      { $limit: 10 }
    ]);

    // Formatear datos para el gráfico
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const formattedStats = clientStats.map((stat, index) => ({
      cliente: stat.cliente || 'Cliente no especificado',
      anomalias: stat.anomalias,
      bitacoras: stat.bitacoras,
      color: colors[index % colors.length]
    }));

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('[GET /dashboard/client-anomalias-stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch client anomalies statistics' });
  }
});

// Endpoint para obtener estadísticas de anomalías por línea de transporte
app.get('/dashboard/lineas-transporte-stats', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = {};

    // Filtro de fechas
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Note: lineaTransporte and operador filters are applied in the aggregation pipeline
    // after $unwind: '$eventos.transportes' to ensure correct nested field matching

    // Filtro de permisos de usuario
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      if (operador !== 'all' && operador !== userFullName) {
        return res.status(200).json([]);
      }

      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: userFullName },
              { 'transportes.operador': userFullName }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: userFullName },
          { 'transportes.operador': userFullName }
        ];
      }
    }

    // Obtener tipos de eventos para categorías
    const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
    const eventNamesByCategory = {};
    eventTypes.forEach(eventType => {
      if (!eventNamesByCategory[eventType.categoria]) {
        eventNamesByCategory[eventType.categoria] = [];
      }
      eventNamesByCategory[eventType.categoria].push(eventType.evento);
    });

    // Agregar filtro para bitácoras con anomalías
    const allEventNames = eventTypes.map(et => et.evento);
    bitacoraFilter['eventos.nombre'] = { $in: allEventNames };

    // Obtener líneas de transporte del modelo LineaTransporte
    let lineasTransporte = [];
    if (clientFilter !== 'all') {
      // Si hay un cliente específico seleccionado, obtener solo las líneas de ese cliente
      lineasTransporte = await LineaTransporte.find({ cliente: clientFilter }).select('nombre');
    } else {
      // Si no hay cliente seleccionado, obtener todas las líneas de transporte
      lineasTransporte = await LineaTransporte.find({}).select('nombre');
    }

    // Obtener estadísticas por línea de transporte usando la misma lógica que bitacoras-anomalias
    const transportLineStats = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      {
        $match: {
          'eventTypeInfo.categoria': { $ne: 'General' }
        }
      },
      {
        $group: {
          _id: '$_id',
          bitacora_id: { $first: '$bitacora_id' },
          cliente: { $first: '$cliente' },
          transportes: { $first: '$transportes' },
          eventos: { $push: '$eventos' },
          eventTypes: { $push: '$eventTypeInfo' }
        }
      },
      // Apply transport line filter if specified (case-insensitive)
      ...(lineaTransporte !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: lineaTransporte } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.lineaTransporte' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Apply operator filter if specified (case-insensitive)
      ...(operador !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: operador } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.operador' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Unwind transportes to get individual transport lines
      { $unwind: '$transportes' },
      // Filter out invalid transport lines
      {
        $match: {
          'transportes.lineaTransporte': {
            $exists: true,
            $ne: null,
            $ne: '',
            $ne: 'N/A'
          }
        }
      },
      {
        $group: {
          _id: {
            lineaTransporte: '$transportes.lineaTransporte',
            cliente: '$cliente'
          },
          anomalias: { $sum: 1 },
          bitacoras: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          lineaTransporte: '$_id.lineaTransporte',
          cliente: '$_id.cliente',
          anomalias: 1,
          bitacoras: { $size: '$bitacoras' }
        }
      },
      { $sort: { anomalias: -1 } }
    ]);

    // Filtrar solo las líneas de transporte que existen en el modelo LineaTransporte
    let filteredTransportLineStats = [];
    if (clientFilter !== 'all') {
      // Si hay un cliente específico seleccionado, filtrar por ese cliente
      filteredTransportLineStats = transportLineStats.filter(stat => {
        // Verificar que la estadística sea del cliente correcto
        const isCorrectClient = stat.cliente === clientFilter;
        // Verificar que la línea de transporte exista en el modelo LineaTransporte para este cliente
        // Comparación case-insensitive para evitar problemas de capitalización
        const lineaExists = lineasTransporte.some(lt =>
          lt.nombre && stat.lineaTransporte &&
          lt.nombre.toLowerCase().trim() === stat.lineaTransporte.toLowerCase().trim()
        );

        console.log('[DEBUG] Filtering stat:', {
          statLineaTransporte: stat.lineaTransporte,
          statCliente: stat.cliente,
          clientFilter,
          isCorrectClient,
          lineaExists,
          availableLineas: lineasTransporte.map(lt => lt.nombre),
          willInclude: isCorrectClient && lineaExists
        });

        return isCorrectClient && lineaExists;
      });
    } else {
      // Si no hay cliente seleccionado, mostrar todas las líneas de transporte que existen en el catálogo
      filteredTransportLineStats = transportLineStats.filter(stat => {
        // Verificar que la línea de transporte exista en el modelo LineaTransporte
        // Comparación case-insensitive para evitar problemas de capitalización
        const lineaExists = lineasTransporte.some(lt =>
          lt.nombre && stat.lineaTransporte &&
          lt.nombre.toLowerCase().trim() === stat.lineaTransporte.toLowerCase().trim()
        );

        return lineaExists;
      });
    }

    // Formatear datos para el gráfico
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const formattedStats = filteredTransportLineStats.map((stat, index) => ({
      lineaTransporte: stat.lineaTransporte || 'Línea no especificada',
      cliente: stat.cliente,
      anomalias: stat.anomalias,
      bitacoras: stat.bitacoras,
      color: colors[index % colors.length]
    }));

    // Debug logging
    console.log('[DEBUG] Transport lines endpoint:', {
      clientFilter,
      lineasTransporteCount: lineasTransporte.length,
      transportLineStatsCount: transportLineStats.length,
      filteredTransportLineStatsCount: filteredTransportLineStats.length,
      formattedStatsCount: formattedStats.length,
      lineasTransporteNames: lineasTransporte.map(lt => lt.nombre),
      transportLineStatsRaw: transportLineStats.slice(0, 5),
      formattedStats: formattedStats.slice(0, 3)
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('[GET /dashboard/lineas-transporte-stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch transport lines anomalies statistics' });
  }
});

// Endpoint para obtener estadísticas de anomalías por operador
app.get('/dashboard/operadores-stats', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = {};

    // Filtro de fechas
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Note: lineaTransporte and operador filters are applied in the aggregation pipeline
    // after $unwind: '$eventos.transportes' to ensure correct nested field matching

    // Filtro de permisos de usuario
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      if (operador !== 'all' && operador !== userFullName) {
        return res.status(200).json([]);
      }

      if (bitacoraFilter.$or || bitacoraFilter.$and || Object.keys(bitacoraFilter).some(key => key !== 'cliente' && key !== 'createdAt')) {
        const existingFilters = {};
        if (bitacoraFilter.$or) {
          existingFilters.$or = bitacoraFilter.$or;
          delete bitacoraFilter.$or;
        }
        if (bitacoraFilter.$and) {
          existingFilters.$and = bitacoraFilter.$and;
          delete bitacoraFilter.$and;
        }

        Object.keys(bitacoraFilter).forEach(key => {
          if (key !== 'cliente' && key !== 'createdAt') {
            existingFilters[key] = bitacoraFilter[key];
            delete bitacoraFilter[key];
          }
        });

        bitacoraFilter.$and = [
          existingFilters,
          {
            $or: [
              { operador: userFullName },
              { 'transportes.operador': userFullName }
            ]
          }
        ];
      } else {
        bitacoraFilter.$or = [
          { operador: userFullName },
          { 'transportes.operador': userFullName }
        ];
      }
    }

    // Obtener tipos de eventos para categorías
    const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
    const eventNamesByCategory = {};
    eventTypes.forEach(eventType => {
      if (!eventNamesByCategory[eventType.categoria]) {
        eventNamesByCategory[eventType.categoria] = [];
      }
      eventNamesByCategory[eventType.categoria].push(eventType.evento);
    });

    // Agregar filtro para bitácoras con anomalías
    const allEventNames = eventTypes.map(et => et.evento);
    bitacoraFilter['eventos.nombre'] = { $in: allEventNames };

    // Obtener operadores del modelo Operador
    let operadores = [];
    if (lineaTransporte !== 'all') {
      // Si hay una línea de transporte específica seleccionada, obtener solo los operadores de esa línea
      operadores = await Operador.find({ lineaTransporte: lineaTransporte }).select('nombre');
    } else if (clientFilter !== 'all') {
      // Si no hay línea de transporte seleccionada pero sí hay cliente, obtener todas las líneas del cliente
      const lineasDelCliente = await LineaTransporte.find({ cliente: clientFilter }).select('nombre');
      const nombresLineas = lineasDelCliente.map(lt => lt.nombre);
      operadores = await Operador.find({ lineaTransporte: { $in: nombresLineas } }).select('nombre');
    } else {
      // Si no hay filtros aplicados, obtener todos los operadores
      operadores = await Operador.find({}).select('nombre');
    }

    // Obtener estadísticas por operador usando la misma lógica que bitacoras-anomalias
    const operatorStats = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      {
        $match: {
          'eventTypeInfo.categoria': { $ne: 'General' }
        }
      },
      {
        $group: {
          _id: '$_id',
          bitacora_id: { $first: '$bitacora_id' },
          cliente: { $first: '$cliente' },
          transportes: { $first: '$transportes' },
          eventos: { $push: '$eventos' },
          eventTypes: { $push: '$eventTypeInfo' }
        }
      },
      // Apply transport line filter if specified (case-insensitive)
      ...(lineaTransporte !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: lineaTransporte } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.lineaTransporte' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Apply operator filter if specified (case-insensitive)
      ...(operador !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: operador } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.operador' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Unwind transportes to get individual operators
      { $unwind: '$transportes' },
      // Filter out invalid operators
      {
        $match: {
          'transportes.operador': {
            $exists: true,
            $ne: null,
            $ne: '',
            $ne: 'N/A'
          }
        }
      },
      {
        $group: {
          _id: {
            operador: '$transportes.operador',
            cliente: '$cliente',
            lineaTransporte: '$transportes.lineaTransporte'
          },
          anomalias: { $sum: 1 },
          bitacoras: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          operador: '$_id.operador',
          cliente: '$_id.cliente',
          lineaTransporte: '$_id.lineaTransporte',
          anomalias: 1,
          bitacoras: { $size: '$bitacoras' }
        }
      },
      { $sort: { anomalias: -1 } }
    ]);

    // Filtrar solo los operadores que existen en el modelo Operador
    let filteredOperatorStats = [];
    if (lineaTransporte !== 'all') {
      // Si hay una línea de transporte específica seleccionada, filtrar por esa línea
      filteredOperatorStats = operatorStats.filter(stat => {
        // Verificar que la estadística sea de la línea de transporte correcta
        const isCorrectLineaTransporte = stat.lineaTransporte === lineaTransporte;
        // Verificar que el operador exista en el modelo Operador para esta línea de transporte
        // Comparación case-insensitive para evitar problemas de capitalización
        const operadorExists = operadores.some(op =>
          op.nombre && stat.operador &&
          op.nombre.toLowerCase().trim() === stat.operador.toLowerCase().trim()
        );

        return isCorrectLineaTransporte && operadorExists;
      });
    } else if (clientFilter !== 'all') {
      // Si no hay línea de transporte seleccionada pero sí hay cliente, filtrar por operadores del cliente
      filteredOperatorStats = operatorStats.filter(stat => {
        // Verificar que la estadística sea del cliente correcto
        const isCorrectClient = stat.cliente === clientFilter;
        // Verificar que el operador exista en el modelo Operador para las líneas del cliente
        const operadorExists = operadores.some(op =>
          op.nombre && stat.operador &&
          op.nombre.toLowerCase().trim() === stat.operador.toLowerCase().trim()
        );

        return isCorrectClient && operadorExists;
      });
    } else {
      // Si no hay filtros aplicados, mostrar todos los operadores que existen en el catálogo
      filteredOperatorStats = operatorStats.filter(stat => {
        // Verificar que el operador exista en el modelo Operador
        // Comparación case-insensitive para evitar problemas de capitalización
        const operadorExists = operadores.some(op =>
          op.nombre && stat.operador &&
          op.nombre.toLowerCase().trim() === stat.operador.toLowerCase().trim()
        );

        return operadorExists;
      });
    }

    // Formatear datos para el gráfico
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const formattedStats = filteredOperatorStats.map((stat, index) => ({
      operador: stat.operador || 'Operador no especificado',
      cliente: stat.cliente,
      lineaTransporte: stat.lineaTransporte,
      anomalias: stat.anomalias,
      bitacoras: stat.bitacoras,
      color: colors[index % colors.length]
    }));

    // Debug logging
    console.log('[DEBUG] Operators endpoint:', {
      clientFilter,
      lineaTransporte,
      operadoresCount: operadores.length,
      operatorStatsCount: operatorStats.length,
      filteredOperatorStatsCount: filteredOperatorStats.length,
      formattedStatsCount: formattedStats.length,
      operadoresNames: operadores.map(op => op.nombre),
      operatorStatsRaw: operatorStats.slice(0, 5),
      formattedStats: formattedStats.slice(0, 3)
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('[GET /dashboard/operadores-stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch operators anomalies statistics' });
  }
});

// Endpoint para obtener estadísticas de anomalías por categoría de evento
app.get('/dashboard/event-categories-stats', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const role = await Role.findOne({ name: user.role });
    if (!role) {
      return res.status(401).json({ message: 'Role not found' });
    }

    // Obtener filtros de la query
    const {
      clientFilter = 'all',
      fechaDesde = '',
      fechaHasta = '',
      lineaTransporte = 'all',
      operador = 'all'
    } = req.query;

    // Construir filtros de bitácora
    let bitacoraFilter = { deleted: { $ne: true } }; // Exclude deleted bitacoras

    // Filtro de fechas
    if (fechaDesde && fechaHasta && fechaDesde.trim() !== '' && fechaHasta.trim() !== '') {
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta + 'T23:59:59.999Z');

      if (!isNaN(startDate) && !isNaN(endDate)) {
        bitacoraFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Apply client permissions based on role
    if (role.client_access === 'specific' && role.allowed_clients && role.allowed_clients.length > 0) {
      // User can only access specific clients
      const allowedClientNames = role.allowed_clients.map(ac => ac.client_name);

      if (clientFilter !== 'all') {
        // If a specific client is selected, verify it's in the allowed list
        if (!allowedClientNames.includes(clientFilter)) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
        bitacoraFilter.cliente = clientFilter;
      } else {
        // If no specific client is selected, filter by all allowed clients
        bitacoraFilter.cliente = { $in: allowedClientNames };
      }
    } else {
      // User has access to all clients
      if (clientFilter !== 'all') {
        bitacoraFilter.cliente = clientFilter;
      }
    }

    // Filtro de permisos de usuario
    if (!role.bitacoras?.read_all) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      if (operador !== 'all' && operador !== userFullName) {
        return res.status(200).json([]);
      }

      bitacoraFilter.$or = [
        { operador: userFullName },
        { 'transportes.operador': userFullName }
      ];
    }

    // Obtener tipos de eventos para categorías
    const eventTypes = await EventType.find({ categoria: { $in: ['ENA', 'ONC', 'DR', 'FM'] } });
    const allEventNames = eventTypes.map(et => et.evento);

    // Agregar filtro para bitácoras con anomalías
    bitacoraFilter['eventos.nombre'] = { $in: allEventNames };

    // Obtener estadísticas por categoría de evento usando la misma lógica que operadores
    const eventCategoryStats = await Bitacora.aggregate([
      { $match: bitacoraFilter },
      { $unwind: '$eventos' },
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      {
        $match: {
          'eventTypeInfo.categoria': { $ne: 'General' }
        }
      },
      {
        $group: {
          _id: '$_id',
          bitacora_id: { $first: '$bitacora_id' },
          cliente: { $first: '$cliente' },
          transportes: { $first: '$transportes' },
          eventos: { $push: '$eventos' },
          eventTypes: { $push: '$eventTypeInfo' }
        }
      },
      // Apply transport line filter if specified (case-insensitive)
      ...(lineaTransporte !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: lineaTransporte } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.lineaTransporte' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Apply operator filter if specified (case-insensitive)
      ...(operador !== 'all' ? [{
        $match: {
          $expr: {
            $in: [
              { $toLower: { $trim: { input: operador } } },
              {
                $map: {
                  input: '$transportes',
                  as: 'transporte',
                  in: { $toLower: { $trim: { input: '$$transporte.operador' } } }
                }
              }
            ]
          }
        }
      }] : []),
      // Unwind transportes to get individual operators
      { $unwind: '$transportes' },
      // Filter out invalid operators
      {
        $match: {
          'transportes.operador': { $exists: true, $ne: null, $ne: '' }
        }
      },
      // Verify that the transport line exists in the official catalog
      {
        $lookup: {
          from: 'lineatransportes',
          let: {
            lineaTransporte: '$transportes.lineaTransporte',
            cliente: '$cliente'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] },
                    { $eq: [{ $toLower: { $trim: { input: '$cliente' } } }, { $toLower: { $trim: { input: '$$cliente' } } }] }
                  ]
                }
              }
            }
          ],
          as: 'lineaTransporteInfo'
        }
      },
      // Verify that the operator exists in the official catalog and is linked to the transport line
      {
        $lookup: {
          from: 'operadores',
          let: {
            operador: '$transportes.operador',
            lineaTransporte: '$transportes.lineaTransporte'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toLower: { $trim: { input: '$nombre' } } }, { $toLower: { $trim: { input: '$$operador' } } }] },
                    { $eq: [{ $toLower: { $trim: { input: '$lineaTransporte' } } }, { $toLower: { $trim: { input: '$$lineaTransporte' } } }] }
                  ]
                }
              }
            }
          ],
          as: 'operadorInfo'
        }
      },
      // Only include if both transport line and operator exist in the official catalog
      {
        $match: {
          $and: [
            { 'lineaTransporteInfo': { $ne: [] } },
            { 'operadorInfo': { $ne: [] } }
          ]
        }
      },
      // Unwind eventos to get individual events
      { $unwind: '$eventos' },
      // Lookup event type info for each event
      {
        $lookup: {
          from: 'eventtypes',
          localField: 'eventos.nombre',
          foreignField: 'evento',
          as: 'eventTypeInfo'
        }
      },
      // Group by bitacora ID and category to count unique bitacoras per category
      {
        $group: {
          _id: {
            bitacoraId: '$_id',
            categoria: { $arrayElemAt: ['$eventTypeInfo.categoria', 0] }
          }
        }
      },
      // Now group by category to get the count of unique bitacoras per category
      {
        $group: {
          _id: '$_id.categoria',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Define colors for each category
    const categoryColors = {
      'ENA': '#3b82f6', // Blue
      'FM': '#10b981',  // Green
      'ONC': '#f59e0b', // Orange
      'DR': '#ef4444'   // Red
    };

    // Format the data with colors and ensure all categories are present
    const allCategories = ['ENA', 'FM', 'ONC', 'DR'];
    const formattedCategories = allCategories.map(category => {
      const found = eventCategoryStats.find(stat => stat._id === category);
      return {
        categoria: category,
        count: found ? found.count : 0,
        color: categoryColors[category]
      };
    });

    // Debug logging
    console.log('[DEBUG] Event categories endpoint:', {
      clientFilter,
      lineaTransporte,
      operador,
      eventCategoryStatsCount: eventCategoryStats.length,
      formattedCategoriesCount: formattedCategories.length,
      eventCategoryStatsRaw: eventCategoryStats,
      formattedCategories
    });

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error('[GET /dashboard/event-categories-stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch event categories statistics' });
  }
});

//start the server
app.listen(PORT, () => {
  console.log(`Server Running at ${PORT}`);
});
