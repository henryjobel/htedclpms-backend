import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 5000;
const requiredEnv = ["DATABASE_URL", "JWT_SECRET"] as const;

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

async function start() {
  validateEnv();

  try {
    await prisma.$connect();
    console.log("   MongoDB: Connected");
  } catch {
    console.error("   MongoDB: Connection FAILED");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\nHET PMS API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
}

start();
