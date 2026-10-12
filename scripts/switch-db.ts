import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const target = process.argv[2]?.toLowerCase();
const rootDir = process.cwd();
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");
const postgresSchemaPath = path.join(rootDir, "prisma", "schema.postgresql.prisma");

if (target === "postgres" || target === "postgresql") {
  console.log("🔄 Switching Prisma to PostgreSQL...");
  if (fs.existsSync(postgresSchemaPath)) {
    fs.copyFileSync(postgresSchemaPath, schemaPath);
  } else {
    let content = fs.readFileSync(schemaPath, "utf-8");
    content = content.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, content, "utf-8");
  }
  console.log("📦 Generating PostgreSQL Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Successfully switched to PostgreSQL!");
  console.log("💡 Remember to set your live Neon/PostgreSQL DATABASE_URL in .env");
} else if (target === "sqlite") {
  console.log("🔄 Switching Prisma to local SQLite (dev.db)...");
  let content = fs.readFileSync(schemaPath, "utf-8");
  content = content.replace('provider = "postgresql"', 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, "utf-8");
  console.log("📦 Generating SQLite Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Successfully switched to SQLite!");
} else {
  console.error("Usage: tsx scripts/switch-db.ts [sqlite|postgres]");
  process.exit(1);
}
