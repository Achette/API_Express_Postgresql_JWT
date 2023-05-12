const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const PORT = 8080;

const { pool } = require("./data/data");


app.use(express.json());


app.get("/", (req, res) => {
  res.send("<h1>Hallo, wie geth es Ihnen?</h1>");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const client = await pool.connect();

  const findUser = await client.query(
    `SELECT * FROM users where email='${email}'`
  );
  if (!findUser) {
    return res.status(401).json({ error: "Usuario inexistente. Digite um usuário válido!" });
  }

  if (Number(findUser.rows[0].password) !== password) {
    return res.status(401).json({ error: "Senha incorreta. Tente novamente" });
  }

  const { id, name } = findUser.rows[0];
  return res.status(200).json({
    user: {
      id,
      name,
      email,
    },
    token: jwt.sign({ id }, process.env.SECRET_JWT, {
      expiresIn: process.env.EXPIRESIN_JWT,
    }),
  });
});

app.get("/users", async (req, res) => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM Users");
    console.table(rows);
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro! Não foi possível conectar com o servidor");
  }
});

app.post("/users", async (req, res) => {
  try {
    const { id, name, email, password } = req.body;
    const client = await pool.connect();

    if (!id || !name || !email || !password) {
      return res.status(401).send("Informe os dados do usuário: é requerido: id, nome, email e senha.");
    }

    const user = await client.query(`SELECT FROM users where id=${id}`);
    if (user.rows.length === 0) {
      await client.query(
        `INSERT into users values (${id}, '${email}', '${password}', '${name}')`
      );
      res.status(200).send({
        msg: "Usuário cadastrado com sucesso!",
        result: {
          id,
          email,
          password,
          name,
        },
      });
    } else {
      res.status(401).send("Usuário já existe!.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro! Não foi possível conectar com o servidor");
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const client = await pool.connect();
    if (!id || !name) {
      return res.status(401).send("Id não informados.");
    }

    const user = await client.query(`SELECT FROM users where id=${id}`);
    if (user.rows.length > 0) {
      await client.query(
        `UPDATE users SET name = '${name}',email ='${email}',password ='${password}' WHERE id=${id}`
      );
      res.status(200).send({
        msg: "Usuário atualizado com sucesso!",
        result: {
          id,
          name,
          email,
          password,
        },
      });
    } else {
      res.status(401).send("Usuário não encontrado.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro! Não foi possível conectar com o servidor");
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === undefined) {
      return res.status(401).send("Usuario inexistente.");
    }

    const client = await pool.connect();
    const del = await client.query(`DELETE FROM users where id=${id}`);

    if (del.rowCount == 1) {
      return res.status(200).send("Usuário deletado com sucesso!");
    } else {
      return res.status(200).send("Usuário não encontrado.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro! Não foi possível conectar com o servidor");
  }
});

app.listen(PORT, () => {
  console.log("O servidor está ativo na porta 8080!");
});
