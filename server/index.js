const credentialsModel = require("./models/credentialsModel");
const sequelize = require("./scripts/sequilize");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const app = require("express")();
const bodyParser = require("body-parser");
const cors = require('cors')
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

const corsOptions = {
  credentials: true,
  optionSuccessStatus: 200,
  headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  allowedHeaders: '*',
  origin: '*',
  methods: ['GET', 'POST']
}

app.use(cors(corsOptions));

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await credentialsModel.sync();
    console.log("tables synced");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
main();

app.post("/save-credentials", async (req, res) => {
  console.log(req.body);
  const { user, password } = req.body;
  if (!user) {
    res.status(400).json({ error: "missing user" });
    return;
  }
  if (!password) {
    res.status(400).json({ error: "missing user" });
    return;
  }
  try {
    const [credentials, isNew] = await credentialsModel.findOrCreate({
      where: {
        user: String(user).toLowerCase(),
      }, defaults: {
        user: String(user).toLowerCase(),
        password: await bcrypt.hash(password, 10),
      }
    });

    if (!isNew) {
      return res.status(200).json({message: 'user already exist'})
    }
    return res.json({ message: `user ${credentials.user} created successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { user, password } = req.body;

    if (!user) {
      res.status(400).json({ error: "missing user" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "missing user" });
      return;
    }

    // Buscar el usuario en la base de datos
    const userData = await credentialsModel.findOne({
      where: { user },
    });

    if (!userData) {
      return res.status(401).send('Usuario no encontrado');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Generar un token JWT
    const token = jwt.sign({ user }, 'secretKey', { expiresIn: '1h' });

    const updated = await credentialsModel.update({
      token: token
    }, {
      where: {
        user: user
      }
    })

    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al iniciar sesión');
  }
});


app.post('/verify', async (req, res) => {
  const { token } = req.body;

  try {
    // Buscar el usuario en la base de datos por el token
    const userData = await credentialsModel.findOne({
      where: { token },
    });

    if (!userData) {
      return res.json(false);
    }

    jwt.verify(token, 'secretKey', (err, decoded) => {
      if (err) {
        return res.json(false);
      } else {
        return res.json(true);
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error al verificar el token');
  }
});

app.post("/logout", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "token invalid" });
    return;
  }

  try {
    const credentials = await credentialsModel.update(
      { token: null },
      {
        where: { token },
      }
    );
    if (!credentials) {
      res.status(400).send({ error: "user not found" });
      return;
    }
    return res.send({ message: "logout successfully"});
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/change-password", async (req, res) => {
  const { token, password, newPassword } = req.body;
  if (!token) {
    res.status(400).json({ error: "token invalid" });
    return;
  }
  try {
    const credentials = await credentialsModel.findOne({
      where: { token },
    });
    if (!credentials) {
      res.status(401).send({ error: "token is not valid" });
      return;
    }
    const isPassword = await bcrypt.compare(password, credentials.password);
    if (!isPassword) {
      res.status(401).send({ error: "password is not valid" });
      return;
    }
    const { id } = credentials;
    await credentialsModel.update(
      {
        password: await bcrypt.hash(newPassword, 10),
      },
      { where: { id } }
    );
    return res.send({message:"password changed successfully"})
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.get("/", () => {
  console.log("ayuda diosmio por favor");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
