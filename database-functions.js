const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://admin:adkjadgajkdgkdadgkagduiweitw@sixgames.vap3vvs.mongodb.net/?retryWrites=true&w=majority&appName=sixgames";

const dbName = "viralpoint";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = client.db(dbName);

async function connectdb() {
  var con_count = await client.connect();

  if (con_count) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "Database Connected : mongodb+srv://viralpoint-global"
    ); //yellow

    console.log(`
    ┌───────────────────────────────────┐
    │ Current Version: Beta-1           │
    │ Latest Version: Beta-3            │
    └───────────────────────────────────┘
    `);
  }
}

module.exports = { connectdb, db };
