// migrate.js
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("Defina a variável DATABASE_URL antes de rodar o script de migração.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🔄 Iniciando migração de JSON para PostgreSQL...");

    // 1. Migrar Usuários
    const usersPath = path.join(__dirname, "data", "users.json");
    if (fs.existsSync(usersPath)) {
      const { users = [] } = JSON.parse(fs.readFileSync(usersPath, "utf8"));
      for (const u of users) {
        await client.query(`
          INSERT INTO usuarios (id, username, name, role, hash, salt)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (username) DO NOTHING
        `, [crypto.randomUUID(), u.username, u.name || u.username, u.role, u.hash, u.salt]);
      }
      console.log(`✅ ${users.length} usuário(s) migrado(s).`);
    }

    // 2. Migrar Recebimentos
    const recPath = path.join(__dirname, "data", "recebimentos.json");
    if (fs.existsSync(recPath)) {
      const { records = [] } = JSON.parse(fs.readFileSync(recPath, "utf8"));
      for (const r of records) {
        await client.query(`
          INSERT INTO recebimentos (id, data, origem, placa, motorista, doca, volumetria, sla, status, inicio, fim, conferente, insumos_lista)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING
        `, [
          r.id || `R-${crypto.randomUUID().slice(0, 8)}`,
          r.data || new Date().toISOString(),
          r.origem,
          r.placa,
          r.motorista,
          r.doca || "—",
          r.volumetria || 0,
          r.sla || 60,
          r.status || "Em Trânsito",
          r.inicio || null,
          r.fim || null,
          r.conferente || "—",
          r.insumos_lista ? JSON.stringify(r.insumos_lista) : null
        ]);
      }
      console.log(`✅ ${records.length} recebimento(s) migrado(s).`);
    }

    console.log("🎉 Migração concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro durante a migração:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();