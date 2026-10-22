require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_PATH || "mmearn.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 points INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS withdrawals (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 amount INTEGER NOT NULL,
 method TEXT NOT NULL,
 account TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 150 }));
app.use(session({
 secret: process.env.SESSION_SECRET || "change-this-before-deploying",
 resave: false, saveUninitialized: false,
 cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 24*60*60*1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

const userById = db.prepare("SELECT id, username, points FROM users WHERE id = ?");
function requireUser(req,res,next){ if(!req.session.userId) return res.status(401).json({error:"အရင် Login ဝင်ပါ။"}); next(); }

app.post("/api/register", async (req,res) => {
 const username = String(req.body.username||"").trim();
 const password = String(req.body.password||"");
 if(!/^[A-Za-z0-9_]{3,24}$/.test(username) || password.length < 8)
   return res.status(400).json({error:"Username 3–24 လုံး (အင်္ဂလိပ်စာ/နံပါတ်/_) နှင့် Password အနည်းဆုံး 8 လုံး လိုပါတယ်။"});
 try {
   const hash = await bcrypt.hash(password, 12);
   const info = db.prepare("INSERT INTO users(username,password_hash) VALUES(?,?)").run(username,hash);
   req.session.userId = info.lastInsertRowid;
   res.json({ok:true,user:userById.get(req.session.userId)});
 } catch(e) { res.status(400).json({error:"ဒီ Username ရှိပြီးသားဖြစ်နိုင်ပါတယ်။"}); }
});
app.post("/api/login", async (req,res) => {
 const username=String(req.body.username||"").trim(), password=String(req.body.password||"");
 const u=db.prepare("SELECT * FROM users WHERE username=?").get(username);
 if(!u || !(await bcrypt.compare(password,u.password_hash))) return res.status(401).json({error:"Username သို့မဟုတ် Password မှားနေပါတယ်။"});
 req.session.userId=u.id; res.json({ok:true,user:userById.get(u.id)});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",requireUser,(req,res)=>res.json({user:userById.get(req.session.userId)}));
app.post("/api/game/claim",requireUser,(req,res)=>{
 // Demo points only; replace with audited anti-abuse game logic before launch.
 db.prepare("UPDATE users SET points=points+5 WHERE id=?").run(req.session.userId);
 res.json({ok:true,user:userById.get(req.session.userId),message:"Demo အမှတ် ၅ မှတ် ထည့်ပြီးပါပြီ။"});
});
app.post("/api/withdraw",requireUser,(req,res)=>{
 const amount=Number(req.body.amount), method=String(req.body.method||""), account=String(req.body.account||"").trim();
 if(!Number.isInteger(amount)||amount<100 || !["KBZPay","WavePay","USDT-TRC20"].includes(method)||account.length<4)
   return res.status(400).json({error:"ငွေပမာဏ၊ နည်းလမ်းနှင့် အကောင့်အချက်အလက်ကို စစ်ဆေးပါ။"});
 const u=userById.get(req.session.userId);
 if(amount>u.points) return res.status(400).json({error:"အမှတ် မလုံလောက်ပါ။"});
 db.prepare("UPDATE users SET points=points-? WHERE id=?").run(amount,req.session.userId);
 db.prepare("INSERT INTO withdrawals(user_id,amount,method,account) VALUES(?,?,?,?)").run(req.session.userId,amount,method,account);
 res.json({ok:true,message:"တောင်းဆိုမှုကို မှတ်တမ်းတင်ပြီးပါပြီ။ အမှန်တကယ်ငွေပေးချေမှု မလုပ်ဆောင်ရသေးပါ။"});
});
app.get("/admin", (req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/api/admin/withdrawals",(req,res)=>{
 if(!process.env.ADMIN_PASSWORD || req.get("x-admin-password")!==process.env.ADMIN_PASSWORD) return res.status(401).json({error:"Admin password မမှန်ပါ။"});
 res.json(db.prepare("SELECT withdrawals.*, users.username FROM withdrawals JOIN users ON users.id=withdrawals.user_id ORDER BY withdrawals.id DESC").all());
});
app.post("/api/admin/withdrawals/:id/status",(req,res)=>{
 if(!process.env.ADMIN_PASSWORD || req.get("x-admin-password")!==process.env.ADMIN_PASSWORD) return res.status(401).json({error:"Admin password မမှန်ပါ။"});
 const status=String(req.body.status||"");
 if(!["Pending","Approved","Rejected","Paid"].includes(status)) return res.status(400).json({error:"Status မမှန်ပါ။"});
 db.prepare("UPDATE withdrawals SET status=? WHERE id=?").run(status,Number(req.params.id));
 res.json({ok:true});
});
app.listen(PORT,()=>console.log(`MM Earn starter running on port ${PORT}`));
