const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 7000;

const db = mysql.createConnection({
  host: "bancomysql.c1rmsxzyhbjb.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "Skyfall20#?",
  database: "hidrata",
});

db.connect((err) => {
  if (err) {
    console.log("Erro ao conectar ao banco de dados", err);
  } else {
    console.log("Conexão ao banco de dados estabelecida");
  }
});

app.use(bodyParser.json());

app.post("/registros", (req, res) => {
  const { name, quantidade_ml, data } = req.body;

  if (!name || !quantidade_ml || !data) {
    return res
      .status(400)
      .json({ mensagem: "name, quantidade_ml e data são obrigatórios." });
  }

  // Converter a data para o formato do MySQL (ano-mês-dia)
  const dataFormatada = data.split("/").reverse().join("-");

  const novoRegistro = {
    name,
    quantidade_ml,
    data: dataFormatada, // Data no formato ano-mês-dia
  };

  const sql =
    "INSERT INTO registro_agua (name, quantidade_ml, data) VALUES (?, ?, ?)";
  const values = [name, quantidade_ml, dataFormatada];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir registro no banco de dados:", err);
      return res
        .status(500)
        .json({ mensagem: "Erro ao registrar hidratação." });
    }

    novoRegistro.id = result.insertId;
    res.status(201).json(novoRegistro);
  });
});

app.get("/registros/:nome", (req, res) => {
  const { nome } = req.params;
  const sql =
    'SELECT id, name, quantidade_ml, DATE_FORMAT(data, "%d/%m/%Y") AS data_formatada FROM registro_agua WHERE name = ?';
  db.query(sql, [nome], (err, result) => {
    if (err) {
      console.error("Erro ao consultar registros no banco de dados:", err);
      return res
        .status(500)
        .json({ mensagem: "Erro ao buscar registros de hidratação." });
    }
    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
