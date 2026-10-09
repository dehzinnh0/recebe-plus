"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "recebimentos.json");
const USERS_FILE = path.join(ROOT, "data", "users.json");
const sessions = new Map();
const loginAttempts = new Map();
const SESSION_TTL = 8 * 60 * 60 * 1000;
const PUBLIC_FILES = new Set(["index.html","styles.css","app.js","manifest.json","service-worker.js","icon.svg"]);

const MIME = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};

function readUsers() {
  try { const parsed=JSON.parse(fs.readFileSync(USERS_FILE,"utf8"));return Array.isArray(parsed.users)?parsed.users:[]; }
  catch { return []; }
}
function verifyPassword(password,user) {
  try { const actual=crypto.scryptSync(String(password),user.salt,64);const expected=Buffer.from(user.hash,"hex");return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected); }
  catch { return false; }
}
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie||"").split(";").map(part=>part.trim().split(/=(.*)/s).slice(0,2)).filter(([key])=>key).map(([key,value])=>[key,decodeURIComponent(value||"")]));
}
function getSession(req) {
  const token=parseCookies(req).recebe_session;const session=token?sessions.get(token):null;
  if(!session||session.expiresAt<Date.now()){if(token)sessions.delete(token);return null;} return {...session,token};
}
function setSessionCookie(res,token,maxAge=SESSION_TTL/1000) {
  const secure=process.env.NODE_ENV==="production"?"; Secure":"";
  res.setHeader("Set-Cookie",`recebe_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
}
function requireSession(req,res,{write=false}={}) {
  const session=getSession(req);if(!session){json(res,401,{error:"Autenticação necessária"});return null;}
  if(write&&req.headers["x-csrf-token"]!==session.csrf){json(res,403,{error:"Sessão inválida"});return null;}return session;
}
function isRateLimited(ip) {
  const now=Date.now();const entry=loginAttempts.get(ip)||{count:0,since:now};if(now-entry.since>15*60*1000){loginAttempts.delete(ip);return false;}return entry.count>=5;
}
function registerFailure(ip) { const now=Date.now();const entry=loginAttempts.get(ip);loginAttempts.set(ip,!entry||now-entry.since>15*60*1000?{count:1,since:now}:{count:entry.count+1,since:entry.since}); }

function nowAt(hour, minute=0, dayOffset=0) {
  const d=new Date(); d.setDate(d.getDate()+dayOffset); d.setHours(hour,minute,0,0); return d.toISOString();
}
function seed() {
  return [
    {id:"D-101",data:nowAt(7,20),origem:"CD Guarulhos",doca:"3",motorista:"Carlos Mendes",placa:"RFG-8J21",volumetria:1860,inicio:nowAt(7,42),fim:nowAt(8,31),sla:60,conferente:"Ana Souza",status:"Concluído",source:"server"},
    {id:"D-102",data:nowAt(8,10),origem:"Hub Campinas",doca:"5",motorista:"João Ribeiro",placa:"GHT-4C07",volumetria:2430,inicio:nowAt(8,28),fim:null,sla:75,conferente:"Marcos Lima",status:"Em descarga",source:"server"},
    {id:"D-103",data:nowAt(9),origem:"CD Extrema",doca:"2",motorista:"Paulo Nunes",placa:"BXR-1D94",volumetria:0,inicio:null,fim:null,sla:45,conferente:"—",status:"Aguardando",source:"server"},
    {id:"D-104",data:nowAt(9,35),origem:"Hub Sorocaba",doca:"8",motorista:"Rafael Alves",placa:"TJK-6F13",volumetria:0,inicio:null,fim:null,sla:90,conferente:"Beatriz Reis",status:"Em Trânsito",source:"server"},
    {id:"D-105",data:nowAt(10,20),origem:"CD Louveira",doca:"1",motorista:"Diego Martins",placa:"KLM-9A42",volumetria:0,inicio:null,fim:null,sla:55,conferente:"—",status:"Em Trânsito",source:"server"}
  ];
}
function readDb() {
  try {
    const db=JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));
    if(!Array.isArray(db.records)) db.records=[];
    if(!Array.isArray(db.audit)) db.audit=[];
    if(!db.records.length) { db.records=seed(); writeDb(db); }
    else {
      let changed=false;db.records=db.records.map(record=>{const status=record.status==="Previsto"?"Em Trânsito":record.status==="Divergência"?"Em Atraso":record.status;const doca=String(record.doca??"").replace(/^D/i,"").replace(/^0+(?=\d)/,"")||"—";if(status!==record.status||doca!==record.doca)changed=true;return{...record,status,doca};});if(changed)writeDb(db);
    }
    return db;
  } catch {
    const db={records:seed(),audit:[]}; writeDb(db); return db;
  }
}
function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});
  const temp=`${DATA_FILE}.tmp`; fs.writeFileSync(temp,JSON.stringify(db,null,2),{mode:0o600}); fs.renameSync(temp,DATA_FILE);
}
function json(res,status,payload) {
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}); res.end(JSON.stringify(payload));
}
function readBody(req) {
  return new Promise((resolve,reject)=>{let body="";req.on("data",chunk=>{body+=chunk;if(body.length>100_000){reject(new Error("Payload excede o limite"));req.destroy();}});req.on("end",()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error("JSON inválido"));}});req.on("error",reject);});
}
function cleanText(value,max=120) { return String(value??"").trim().slice(0,max); }
function validateRecord(input) {
  const record={id:`R-${crypto.randomUUID().slice(0,8).toUpperCase()}`,data:cleanText(input.data,40),origem:cleanText(input.origem),doca:cleanText(input.doca,12).replace(/\D/g,"")||"—",motorista:cleanText(input.motorista),placa:cleanText(input.placa,10).toUpperCase(),volumetria:Number(input.volumetria)||0,inicio:input.inicio?cleanText(input.inicio,40):null,fim:null,sla:Number(input.sla),conferente:cleanText(input.conferente)||"—",status:cleanText(input.status,30)||"Em Trânsito",source:"server"};
  if(!record.data||Number.isNaN(new Date(record.data).getTime())) throw new Error("Data inválida");
  if(!record.origem||!record.motorista||!record.placa) throw new Error("Campos obrigatórios ausentes");
  if(!/^[A-Z0-9-]{7,8}$/.test(record.placa)) throw new Error("Placa inválida");
  if(!Number.isFinite(record.volumetria)||record.volumetria<0||record.status==="Em descarga"&&record.volumetria<1) throw new Error("Volumetria inválida");
  if(!Number.isFinite(record.sla)||record.sla<1) throw new Error("SLA inválido");
  if(!["Em Trânsito","Aguardando","Em descarga"].includes(record.status)) throw new Error("Status inválido");
  return record;
}
function audit(db,action,record,role) {
  db.audit.unshift({id:crypto.randomUUID(),timestamp:new Date().toISOString(),action,recordId:record.id,placa:record.placa,role:cleanText(role,30)||"Conferente"});
  db.audit=db.audit.slice(0,1000);
}

async function handleApi(req,res,url) {
  if(req.method==="GET"&&url.pathname==="/api/health") return json(res,200,{ok:true});
  if(req.method==="POST"&&url.pathname==="/api/login") {
    const ip=req.socket.remoteAddress||"unknown";if(isRateLimited(ip))return json(res,429,{error:"Muitas tentativas. Aguarde antes de tentar novamente."});
    try { const input=await readBody(req);const username=cleanText(input.username,60);const user=readUsers().find(item=>item.username.toLowerCase()===username.toLowerCase());
      if(!user||!verifyPassword(input.password,user)){registerFailure(ip);return json(res,401,{error:"Usuário ou senha inválidos"});}
      loginAttempts.delete(ip);const token=crypto.randomBytes(32).toString("hex");const csrf=crypto.randomBytes(24).toString("hex");sessions.set(token,{username:user.username,role:user.role,csrf,expiresAt:Date.now()+SESSION_TTL});setSessionCookie(res,token);return json(res,200,{user:{username:user.username,role:user.role},csrf});
    } catch(error){return json(res,400,{error:"Não foi possível processar o login"});}
  }
    // GERENCIAMENTO DE USUÁRIOS (GET para listar, POST para criar/editar)
    if (req.method === "GET" && url.pathname === "/api/users") {
        const session = requireSession(req, res); if (!session) return;
        if (session.role !== "Supervisor") return json(res, 403, { error: "Acesso negado." });
        // Retorna a lista omitindo os dados sensíveis (senhas/hashes)
        const users = readUsers().map(u => ({ username: u.username, name: u.name || "", role: u.role }));
        return json(res, 200, { users });
    }

    if (req.method === "POST" && url.pathname === "/api/users") {
        const session = requireSession(req, res, { write: true }); if (!session) return;
        if (session.role !== "Supervisor") return json(res, 403, { error: "Apenas supervisores podem gerenciar a equipe." });

        try {
            const input = await readBody(req);
            const action = input.action; // Saber se é 'create' (novo) ou 'update' (editar)
            const username = cleanText(input.username, 60);
            const name = cleanText(input.name, 100);
            const password = String(input.password || "");
            const role = cleanText(input.role, 20);

            if (!username || !name || !["Conferente", "Assistente", "Supervisor"].includes(role)) {
                return json(res, 400, { error: "Preencha todos os campos corretamente." });
            }

            const usersDb = readUsers();
            const existingIndex = usersDb.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

            if (action === "create") {
                if (existingIndex >= 0) return json(res, 400, { error: "Este nome de usuário (login) já existe." });
                if (password.length < 4) return json(res, 400, { error: "A senha deve ter pelo menos 4 caracteres." });

                const salt = crypto.randomBytes(16).toString("hex");
                const hash = crypto.scryptSync(password, salt, 64).toString("hex");
                usersDb.push({ username, name, role, salt, hash });

            } else if (action === "update") {
                if (existingIndex < 0) return json(res, 404, { error: "Usuário não encontrado." });

                // Atualiza o nome e o perfil
                usersDb[existingIndex].name = name;
                usersDb[existingIndex].role = role;

                // Só atualiza a senha se o supervisor digitou uma senha nova
                if (password.length >= 4) {
                    const salt = crypto.randomBytes(16).toString("hex");
                    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
                    usersDb[existingIndex].salt = salt;
                    usersDb[existingIndex].hash = hash;
                }
            }

            fs.writeFileSync(USERS_FILE, JSON.stringify({ users: usersDb }, null, 2));
            return json(res, 200, { ok: true, username, name, role });
        } catch (error) {
            return json(res, 500, { error: "Erro interno ao salvar usuário." });
        }
    }
  if(req.method==="GET"&&url.pathname==="/api/me") { const session=requireSession(req,res);if(!session)return;return json(res,200,{user:{username:session.username,role:session.role},csrf:session.csrf}); }
  if(req.method==="POST"&&url.pathname==="/api/logout") { const session=requireSession(req,res,{write:true});if(!session)return;sessions.delete(session.token);setSessionCookie(res,"",0);return json(res,200,{ok:true}); }

  const write=req.method!=="GET";const session=requireSession(req,res,{write});if(!session)return;
  const role=session.role;
  if(req.method==="GET"&&url.pathname==="/api/records") { const db=readDb(); return json(res,200,{records:db.records,updatedAt:new Date().toISOString()}); }
  if(req.method==="GET"&&url.pathname==="/api/audit") { if(role!=="Supervisor")return json(res,403,{error:"Acesso restrito ao supervisor"});const db=readDb();return json(res,200,{audit:db.audit.slice(0,100)}); }
  if(req.method==="POST"&&url.pathname==="/api/records") {
    if(!["Conferente","Assistente","Supervisor"].includes(role))return json(res,403,{error:"Perfil sem permissão"});
    try { const input=await readBody(req);const record=validateRecord(input);const db=readDb();db.records.unshift(record);audit(db,"Recebimento criado",record,role);writeDb(db);return json(res,201,{record}); }
    catch(error){return json(res,400,{error:error.message});}
  }
  const match=url.pathname.match(/^\/api\/records\/([^/]+)\/transition$/);
  if(req.method==="PATCH"&&match) {
    if(!["Conferente","Supervisor"].includes(role))return json(res,403,{error:"Somente conferentes e supervisores podem alterar a descarga"});
    try { const input=await readBody(req);const allowed={start:"Em descarga",finish:"Concluído",issue:"Em Atraso"};if(!allowed[input.action])throw new Error("Transição inválida");const db=readDb();const record=db.records.find(r=>r.id===decodeURIComponent(match[1]));if(!record)return json(res,404,{error:"Registro não encontrado"});
      if(input.action==="start"){if(!["Em Trânsito","Aguardando"].includes(record.status))throw new Error("A descarga não pode ser iniciada neste status");const volume=Number(input.volumetria);if(!Number.isFinite(volume)||volume<1)throw new Error("Informe a volumetria para iniciar a descarga");record.volumetria=volume;record.inicio=new Date().toISOString();}
      if(input.action==="finish"||input.action==="issue"){if(record.status!=="Em descarga")throw new Error("A descarga não está em andamento");record.fim=new Date().toISOString();}
      record.status=allowed[input.action];audit(db,`Status alterado para ${record.status}`,record,role);writeDb(db);return json(res,200,{record});
    } catch(error){return json(res,400,{error:error.message});}
  }
  return json(res,404,{error:"Rota não encontrada"});
}

function serveStatic(req,res,url) {
  const requested=url.pathname==="/"?"index.html":decodeURIComponent(url.pathname.slice(1));
  if(!PUBLIC_FILES.has(requested)) return json(res,404,{error:"Arquivo não encontrado"});
  const filePath=path.resolve(ROOT,requested);
  if(!filePath.startsWith(`${ROOT}${path.sep}`)&&filePath!==path.join(ROOT,"index.html")) return json(res,403,{error:"Acesso negado"});
  fs.stat(filePath,(error,stat)=>{
    if(error||!stat.isFile()) return json(res,404,{error:"Arquivo não encontrado"});
    const headers={"Content-Type":MIME[path.extname(filePath)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://docs.google.com https://docs.googleusercontent.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"};
    if(path.basename(filePath)==="service-worker.js")headers["Cache-Control"]="no-cache";
    res.writeHead(200,headers);fs.createReadStream(filePath).pipe(res);
  });
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  try { if(url.pathname.startsWith("/api/")) return await handleApi(req,res,url); return serveStatic(req,res,url); }
  catch(error){return json(res,500,{error:"Falha interna"});}
});
server.listen(PORT,"0.0.0.0",()=>console.log(`Recebe+ ativo na porta ${PORT}`));
