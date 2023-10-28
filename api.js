const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 7000;

app.use(
  cors({
    origin: "*", // Defina o domínio específico que deseja permitir ou "*" para permitir qualquer origem
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Métodos permitidos
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);


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

// Rota para inserir registros na tabela 'register'
app.post("/registros/register", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res
      .status(400)
      .json({ mensagem: "name e password são obrigatórios." });
  }

  const novoRegistro = {
    name,
    password,
  };

  const sql =
    "INSERT INTO register (name, password) VALUES (?, ?)";
  const values = [name, password];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir registro na tabela 'register':", err);
      return res
        .status(500)
        .json({ mensagem: "Erro ao registrar na tabela 'register'." });
    }

    novoRegistro.id = result.insertId;

    // Agora, você tem o 'id' gerado para o usuário
    res.status(201).json(novoRegistro);
  });
});

// Rota para inserir registros na tabela 'register_water'
app.post("/registros/register_water", (req, res) => {
  const { name, quantidade_ml, data, register_id } = req.body;

  if (!name || !quantidade_ml || !data || !register_id) {
    return res
      .status(400)
      .json({ mensagem: "name, quantidade, data e register_id são obrigatórios." });
  }

  // Converter a data para o formato do MySQL (ano-mês-dia)
  const dataFormatada = data.split("/").reverse().join("-");

  const novoRegistro = {
    name,
    quantidade_ml,
    data: dataFormatada, // Data no formato ano-mês-dia
    register_id,
  };

  // Certifique-se de que o 'register_id' seja válido, pois ele deve corresponder ao 'id' da tabela 'register'
  const checkSql = "SELECT id, name FROM register WHERE id = ?";
  db.query(checkSql, [register_id], (checkErr, checkResult) => {
    if (checkErr || checkResult.length === 0) {
      return res.status(400).json({ mensagem: "ID de registro inválido." });
    }

    const nomeRegistro = checkResult[0].name;

    // Verifique se o nome fornecido corresponde ao nome na tabela 'register'
    if (name !== nomeRegistro) {
      return res.status(400).json({ mensagem: "Nome de registro inválido." });
    }

    const insertSql =
      "INSERT INTO register_water (name, quantity, data, register_id) VALUES (?, ?, ?, ?)";
    const insertValues = [name, quantidade_ml, dataFormatada, register_id];

    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        console.error("Erro ao inserir registro na tabela 'register_water':", err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao registrar na tabela 'register_water'." });
      }

      novoRegistro.id = result.insertId;
      res.status(201).json(novoRegistro);
    });
  });
});

// Rota para recuperar informações das duas tabelas
app.get("/registros/:nome", (req, res) => {
  const { nome } = req.params;
  const sql =
    'SELECT r.id as register_id, r.name as register_name,  rw.quantity, DATE_FORMAT(rw.data, "%d/%m/%Y") AS data_formatada FROM register AS r LEFT JOIN register_water AS rw ON r.id = rw.register_id WHERE r.name = ?';
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
