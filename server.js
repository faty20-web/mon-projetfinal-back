const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));



// 🔹 Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err);
    process.exit(1); // Quitter l'application en cas d'échec
  }
};
connectDB();

// 🔹 Modèle Produit
const ProductSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    qty: { type: Number, required: true },
    prix: { type: Number, required: true },
    categorie: { 
      type: String,
      enum: ['jouet','vetement','chaussure','accessoire'], 
      required: true
    },
    image: { type: String ,required: true}, // Champ image optionnel
    estPopulaire: { type: Boolean, default: true },
   
  },
  { timestamps: true } // Ajoute createdAt et updatedAt automatiquement
);
const Product = mongoose.model("Product", ProductSchema);

// 🔹 Modèle Utilisateur
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String },
  password: String,
  role: { type: String, default: "user" },
});
const User = mongoose.model("User", UserSchema);

// 🔹 Middleware d'authentification admin
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Accès interdit" });

    req.user = decoded; // Ajoute l'utilisateur décodé dans la requête
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

// 🔹 Configuration de l'upload des images
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  },
});
const upload = multer({ storage });

// 🔹 Servir les images
app.use("/uploads", express.static("uploads"));

// 🔹 Route de recherche
app.get("/search", async (req, res) => {
  const query = req.query.q;
  console.log("🔍 Requête reçue :", query);

  if (!query || query.trim() === "") {
    return res.json([]);
  }

  try {
    const cleanedQuery = query.trim().replace(/[^\w\s]/gi, "");
    console.log("🔍 Requête nettoyée : ", cleanedQuery);

    const results = await Product.find({
      nom: { $regex: new RegExp(cleanedQuery, "i") },
    });

    console.log("✅ Résultats trouvés dans MongoDB :", results);
    res.json(results);
  } catch (error) {
    console.error("❌ Erreur MongoDB :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Récupérer les produits populaires

// 🔹 Récupérer les nouveaux produits

// 🔹 Lire tous les produits
app.get("/produits", async (req, res) => {
  try {
    const produits = await Product.find();
    res.json(produits);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des produits" });
  }
});
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID invalide (pas un ObjectId)' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }
    res.json(product);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// 🔹 Récupérer les produits par catégorie
app.get("/api/produits", async (req, res) => {
  const { categorie } = req.query;

  try {
    let query = {};
    if (categorie) {
      query.categorie = categorie;
    }

    const produits = await Product.find(query);
    res.json(produits);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Créer un produit avec image
app.post("/produits", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { nom, qty, prix, categorie, estPopulaire, estNouveau } = req.body;
    const image = req.file ? req.file.filename : undefined; // Ne pas envoyer `null`

    const newProduct = new Product({
      nom,
      qty,
      prix,
      categorie,
      image,
      estPopulaire: estPopulaire === "true",  // Assurez-vous que c'est un booléen
         // Assurez-vous que c'est un booléen
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du produit" });
  }
});
app.post("/register", async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Cet utilisateur existe déjà" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    // Générer un token JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Utilisateur enregistré avec succès",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// 🔹 Connexion utilisateur
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    console.log("Utilisateur trouvé :", user);  // Affichage du user pour débogage

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Mot de passe comparé :", isMatch); // Affichage du résultat de la comparaison

    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// 🔹 Mettre à jour un produit
app.put("/produits/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { nom, qty, prix, categorie } = req.body;
    const image = req.file ? req.file.filename : req.body.image; // Maintenir l'image existante si aucune nouvelle n'est fournie

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { nom, qty, prix, categorie, image },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du produit" });
  }
});

// 🔹 Supprimer un produit
app.delete("/produits/:id", verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produit supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du produit" });
  }
});
app.get('/api/produits/sans-accessoire', async (req, res) => {
  try {
    // $ne signifie "not equal" dans MongoDB
    const produits = await Product.find({ categorie: { $ne: "accessoire" } });
    res.json(produits);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des produits" });
  }
});


// 🔹 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
