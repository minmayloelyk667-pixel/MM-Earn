MM EARN WEBSITE - STARTER

ဤ Project သည် စမ်းသပ်/Starter အဆင့်သာဖြစ်သည်။

Local run:
1. Node.js 20+ install လုပ်ပါ။
2. Project folder ထဲမှာ npm install
3. .env.example ကို .env အဖြစ် copy လုပ်ပြီး SESSION_SECRET, ADMIN_PASSWORD ကို ခိုင်မာတဲ့တန်ဖိုးများဖြင့် ပြောင်းပါ။
4. npm start
5. http://localhost:3000 ကိုဖွင့်ပါ။

Deploy:
- Node.js Web Service hosting လိုအပ်သည်။
- SQLite database ဖိုင် မပျောက်စေရန် persistent disk/storage လိုအပ်သည်။ DB_PATH သည် ထို storage ထဲကို ညွှန်ရမည်။
- HTTPS နှင့် SESSION_SECRET/ADMIN_PASSWORD environment variables မဖြစ်မနေ သတ်မှတ်ပါ။
- GitHub သို့ .env သို့မဟုတ် database file မတင်ပါနှင့်။

မပါဝင်သေးသည်:
- အမှန်တကယ် Ad network / ad approval / ad revenue
- အမှန်တကယ် KBZPay, WavePay, USDT payment integration သို့မဟုတ် auto payout
- Production security audit, anti-fraud, full privacy/terms/legal review

ငွေထုတ်တောင်းဆိုမှုသည် မှတ်တမ်းတင်ရုံသာဖြစ်ပြီး အလိုအလျောက်ငွေမပို့ပါ။ Production အတွက် လုံခြုံရေးနှင့် ငွေပေးချေမှုကို စစ်ဆေးပြီးမှ အသုံးပြုပါ။
