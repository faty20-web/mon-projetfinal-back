"use strict";

var express = require("express");

var mongoose = require("mongoose");

var bcrypt = require("bcrypt");

var jwt = require("jsonwebtoken");

var cors = require("cors");

var multer = require("multer");

var path = require("path");

require("dotenv").config();

var app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
})); // 🔹 Connexion à MongoDB

var connectDB = function connectDB() {
  return regeneratorRuntime.async(function connectDB$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }));

        case 3:
          console.log("✅ MongoDB connecté");
          _context.next = 10;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.error("❌ Erreur MongoDB :", _context.t0);
          process.exit(1); // Quitter l'application en cas d'échec

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
};

connectDB(); // 🔹 Modèle Produit

var ProductSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  categorie: {
    type: String,
    "enum": ['jouet', 'vetement', 'chaussure', 'accessoire'],
    required: true
  },
  image: {
    type: String,
    required: true
  },
  // Champ image optionnel
  estPopulaire: {
    type: Boolean,
    "default": true
  }
}, {
  timestamps: true
} // Ajoute createdAt et updatedAt automatiquement
);
var Product = mongoose.model("Product", ProductSchema); // 🔹 Modèle Utilisateur

var UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  phone: {
    type: String
  },
  password: String,
  role: {
    type: String,
    "default": "user"
  }
});
var User = mongoose.model("User", UserSchema); // 🔹 Middleware d'authentification admin

var verifyAdmin = function verifyAdmin(req, res, next) {
  var authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({
    error: "Token manquant"
  });
  var token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({
    error: "Token manquant"
  });

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({
      error: "Accès interdit"
    });
    req.user = decoded; // Ajoute l'utilisateur décodé dans la requête

    next();
  } catch (error) {
    res.status(401).json({
      error: "Token invalide ou expiré"
    });
  }
}; // 🔹 Configuration de l'upload des images


var storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  }
});
var upload = multer({
  storage: storage
}); // 🔹 Servir les images

app.use("/uploads", express["static"]("uploads")); // 🔹 Route de recherche

app.get("/search", function _callee(req, res) {
  var query, cleanedQuery, results;
  return regeneratorRuntime.async(function _callee$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          query = req.query.q;
          console.log("🔍 Requête reçue :", query);

          if (!(!query || query.trim() === "")) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.json([]));

        case 4:
          _context2.prev = 4;
          cleanedQuery = query.trim().replace(/[^\w\s]/gi, "");
          console.log("🔍 Requête nettoyée : ", cleanedQuery);
          _context2.next = 9;
          return regeneratorRuntime.awrap(Product.find({
            nom: {
              $regex: new RegExp(cleanedQuery, "i")
            }
          }));

        case 9:
          results = _context2.sent;
          console.log("✅ Résultats trouvés dans MongoDB :", results);
          res.json(results);
          _context2.next = 18;
          break;

        case 14:
          _context2.prev = 14;
          _context2.t0 = _context2["catch"](4);
          console.error("❌ Erreur MongoDB :", _context2.t0);
          res.status(500).json({
            error: "Erreur serveur"
          });

        case 18:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[4, 14]]);
}); // 🔹 Récupérer les produits populaires
// 🔹 Récupérer les nouveaux produits
// 🔹 Lire tous les produits

app.get("/produits", function _callee2(req, res) {
  var produits;
  return regeneratorRuntime.async(function _callee2$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(Product.find());

        case 3:
          produits = _context3.sent;
          res.json(produits);
          _context3.next = 10;
          break;

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          res.status(500).json({
            error: "Erreur lors de la récupération des produits"
          });

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.get("/api/products/:id", function _callee3(req, res) {
  var id, product;
  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          id = req.params.id;

          if (mongoose.Types.ObjectId.isValid(id)) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            message: 'ID invalide (pas un ObjectId)'
          }));

        case 3:
          _context4.prev = 3;
          _context4.next = 6;
          return regeneratorRuntime.awrap(Product.findById(req.params.id));

        case 6:
          product = _context4.sent;

          if (product) {
            _context4.next = 9;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            error: "Produit non trouvé"
          }));

        case 9:
          res.json(product);
          _context4.next = 16;
          break;

        case 12:
          _context4.prev = 12;
          _context4.t0 = _context4["catch"](3);
          console.error("❌ Erreur serveur :", _context4.t0);
          res.status(500).json({
            error: "Erreur serveur"
          });

        case 16:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[3, 12]]);
}); // 🔹 Récupérer les produits par catégorie

app.get("/api/produits", function _callee4(req, res) {
  var categorie, query, produits;
  return regeneratorRuntime.async(function _callee4$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          categorie = req.query.categorie;
          _context5.prev = 1;
          query = {};

          if (categorie) {
            query.categorie = categorie;
          }

          _context5.next = 6;
          return regeneratorRuntime.awrap(Product.find(query));

        case 6:
          produits = _context5.sent;
          res.json(produits);
          _context5.next = 14;
          break;

        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](1);
          console.error("❌ Erreur serveur :", _context5.t0);
          res.status(500).json({
            error: "Erreur serveur"
          });

        case 14:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // 🔹 Créer un produit avec image

app.post("/produits", verifyAdmin, upload.single("image"), function _callee5(req, res) {
  var _req$body, nom, qty, prix, categorie, estPopulaire, estNouveau, image, newProduct;

  return regeneratorRuntime.async(function _callee5$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _req$body = req.body, nom = _req$body.nom, qty = _req$body.qty, prix = _req$body.prix, categorie = _req$body.categorie, estPopulaire = _req$body.estPopulaire, estNouveau = _req$body.estNouveau;
          image = req.file ? req.file.filename : undefined; // Ne pas envoyer `null`

          newProduct = new Product({
            nom: nom,
            qty: qty,
            prix: prix,
            categorie: categorie,
            image: image,
            estPopulaire: estPopulaire === "true" // Assurez-vous que c'est un booléen
            // Assurez-vous que c'est un booléen

          });
          _context6.next = 6;
          return regeneratorRuntime.awrap(newProduct.save());

        case 6:
          res.status(201).json(newProduct);
          _context6.next = 13;
          break;

        case 9:
          _context6.prev = 9;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0);
          res.status(500).json({
            error: "Erreur lors de la création du produit"
          });

        case 13:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
app.post("/register", function _callee6(req, res) {
  var _req$body2, name, email, phone, password, confirmPassword, existingUser, hashedPassword, newUser, token;

  return regeneratorRuntime.async(function _callee6$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _req$body2 = req.body, name = _req$body2.name, email = _req$body2.email, phone = _req$body2.phone, password = _req$body2.password, confirmPassword = _req$body2.confirmPassword;

          if (!(!name || !email || !phone || !password || !confirmPassword)) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: "Tous les champs sont obligatoires"
          }));

        case 3:
          if (!(password !== confirmPassword)) {
            _context7.next = 5;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: "Les mots de passe ne correspondent pas"
          }));

        case 5:
          _context7.prev = 5;
          _context7.next = 8;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 8:
          existingUser = _context7.sent;

          if (!existingUser) {
            _context7.next = 11;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: "Cet utilisateur existe déjà"
          }));

        case 11:
          _context7.next = 13;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 13:
          hashedPassword = _context7.sent;
          // Créer un nouvel utilisateur
          newUser = new User({
            name: name,
            email: email,
            phone: phone,
            password: hashedPassword
          });
          _context7.next = 17;
          return regeneratorRuntime.awrap(newUser.save());

        case 17:
          // Générer un token JWT
          token = jwt.sign({
            id: newUser._id,
            role: newUser.role
          }, process.env.JWT_SECRET, {
            expiresIn: "1d"
          });
          res.status(201).json({
            message: "Utilisateur enregistré avec succès",
            user: {
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
              role: newUser.role
            },
            token: token
          });
          _context7.next = 25;
          break;

        case 21:
          _context7.prev = 21;
          _context7.t0 = _context7["catch"](5);
          console.error("Erreur lors de l'inscription :", _context7.t0);
          res.status(500).json({
            error: "Erreur serveur"
          });

        case 25:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[5, 21]]);
}); // 🔹 Connexion utilisateur

app.post("/login", function _callee7(req, res) {
  var _req$body3, email, password, user, isMatch, token;

  return regeneratorRuntime.async(function _callee7$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _req$body3 = req.body, email = _req$body3.email, password = _req$body3.password;
          _context8.prev = 1;
          _context8.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 4:
          user = _context8.sent;

          if (user) {
            _context8.next = 7;
            break;
          }

          return _context8.abrupt("return", res.status(404).json({
            error: "Utilisateur non trouvé"
          }));

        case 7:
          console.log("Utilisateur trouvé :", user); // Affichage du user pour débogage

          _context8.next = 10;
          return regeneratorRuntime.awrap(bcrypt.compare(password, user.password));

        case 10:
          isMatch = _context8.sent;
          console.log("Mot de passe comparé :", isMatch); // Affichage du résultat de la comparaison

          if (isMatch) {
            _context8.next = 14;
            break;
          }

          return _context8.abrupt("return", res.status(401).json({
            error: "Mot de passe incorrect"
          }));

        case 14:
          token = jwt.sign({
            id: user._id,
            role: user.role
          }, process.env.JWT_SECRET, {
            expiresIn: "1d"
          });
          res.json({
            message: "Connexion réussie",
            token: token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
          _context8.next = 22;
          break;

        case 18:
          _context8.prev = 18;
          _context8.t0 = _context8["catch"](1);
          console.error("❌ Erreur lors de la connexion :", _context8.t0);
          res.status(500).json({
            error: "Erreur serveur"
          });

        case 22:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[1, 18]]);
}); // 🔹 Mettre à jour un produit

app.put("/produits/:id", verifyAdmin, upload.single("image"), function _callee8(req, res) {
  var _req$body4, nom, qty, prix, categorie, image, updatedProduct;

  return regeneratorRuntime.async(function _callee8$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body4 = req.body, nom = _req$body4.nom, qty = _req$body4.qty, prix = _req$body4.prix, categorie = _req$body4.categorie;
          image = req.file ? req.file.filename : req.body.image; // Maintenir l'image existante si aucune nouvelle n'est fournie

          _context9.next = 5;
          return regeneratorRuntime.awrap(Product.findByIdAndUpdate(req.params.id, {
            nom: nom,
            qty: qty,
            prix: prix,
            categorie: categorie,
            image: image
          }, {
            "new": true
          }));

        case 5:
          updatedProduct = _context9.sent;
          res.json(updatedProduct);
          _context9.next = 12;
          break;

        case 9:
          _context9.prev = 9;
          _context9.t0 = _context9["catch"](0);
          res.status(500).json({
            error: "Erreur lors de la mise à jour du produit"
          });

        case 12:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // 🔹 Supprimer un produit

app["delete"]("/produits/:id", verifyAdmin, function _callee9(req, res) {
  return regeneratorRuntime.async(function _callee9$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _context10.next = 3;
          return regeneratorRuntime.awrap(Product.findByIdAndDelete(req.params.id));

        case 3:
          res.json({
            message: "Produit supprimé"
          });
          _context10.next = 9;
          break;

        case 6:
          _context10.prev = 6;
          _context10.t0 = _context10["catch"](0);
          res.status(500).json({
            error: "Erreur lors de la suppression du produit"
          });

        case 9:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 6]]);
});
app.get('/api/produits/sans-accessoire', function _callee10(req, res) {
  var produits;
  return regeneratorRuntime.async(function _callee10$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          _context11.next = 3;
          return regeneratorRuntime.awrap(Product.find({
            categorie: {
              $ne: "accessoire"
            }
          }));

        case 3:
          produits = _context11.sent;
          res.json(produits);
          _context11.next = 10;
          break;

        case 7:
          _context11.prev = 7;
          _context11.t0 = _context11["catch"](0);
          res.status(500).json({
            error: "Erreur lors de la récupération des produits"
          });

        case 10:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // 🔹 Démarrage du serveur

var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  return console.log("\uD83D\uDE80 Serveur d\xE9marr\xE9 sur le port ".concat(PORT));
});