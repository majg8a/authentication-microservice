const credentialsModel = require("./models/credentialsModel");
const sequelize = require("./scripts/sequilize");
const bcrypt = require("bcrypt");
const app = require("express")();
const port = process.env.PORT || 5000;

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
main();

app.post("save-credentials", async (req, res) => {
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
    const credentials = await credentialsModel.create({
      user: String(user).toLowerCase(),
      password: await bcrypt.hash(password),
    });
    res.json({ message: `user ${credentials.user} created successfully` });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("login", async (req, res) => {
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
    const credentials = await credentialsModel.findOne({
      where: { user: String(user).toLowerCase() },
    });
    if (!credentials) {
      res.status(400).send({ error: "user not found" });
      return;
    }
    const isPassword = await bcrypt.compare(password, credentials.password);
    if (!isPassword) {
      res.status(401).send({ error: "password is not valid" });
      return;
    }

    const { id } = credentials;
    const token = await bcrypt.hash(new Date());

    await credentialsModel.update(
      {
        token,
        tokenBirth: new Date(),
      },
      { where: { id } }
    );

    res.send({ token });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("verify", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "token invalid" });
    return;
  }

  try {
    const credentials = await credentialsModel.findOne({
      where: { token },
    });
    if (!credentials) {
      res.status(400).send({ verify: false });
      return;
    }
    res.send({
      verify: true,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("logout", async (req, res) => {
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
    res.send({
      message: "logout successfully",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("change-password", async (req, res) => {
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
    credentialsModel.update(
      {
        password: await bcrypt.hash(newPassword),
      },
      { where: { id } }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
