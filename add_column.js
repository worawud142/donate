const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function addCashNoteColumn() {
  try {
    console.log("Adding cash_note column to donations table...");
    
    const { error } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE donations ADD COLUMN IF NOT EXISTS cash_note TEXT NULL;"
    });
    
    if (error) {
      console.error("Error adding column:", error);
      
      // Try alternative approach using raw SQL
      console.log("Trying alternative approach...");
      const { data, error: error2 } = await supabase
        .from("donations")
        .select("cash_note")
        .limit(1);
      
      if (error2 && error2.message.includes("column \"cash_note\" does not exist")) {
        console.log("Column does not exist. You need to add it manually via Supabase dashboard.");
        console.log("SQL to run: ALTER TABLE donations ADD COLUMN cash_note TEXT NULL;");
      } else if (!error2) {
        console.log("Column already exists!");
      }
    } else {
      console.log("Column added successfully!");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

addCashNoteColumn();
