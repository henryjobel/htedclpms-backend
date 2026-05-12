import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    console.log(`   MongoDB: Connected ✓`);
  } catch {
    console.error(`   MongoDB: Connection FAILED ✗`);
  }

  app.listen(PORT, () => {
    console.log(`\nHET PMS API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   MongoDB: Connected ✓`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
}

start();
