import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log("Starting password update...");
    
    // Get all users
    const allUsers = await db.query.users.findMany();
    console.log(`Found ${allUsers.length} users to update`);
    
    for (const user of allUsers) {
      // Hash the password
      const hashedPassword = await hashPassword("password123");
      
      // Update the user with the hashed password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
      
      console.log(`Updated password for user: ${user.username}`);
    }
    
    console.log("Password update completed successfully!");
  } catch (error) {
    console.error("Error updating passwords:", error);
  } finally {
    await db.end?.();
    process.exit(0);
  }
}

main();