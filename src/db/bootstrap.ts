import { pool } from "@/db";

const globalForSchema = globalThis as typeof globalThis & {
  __folioSchemaReady?: Promise<void>;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text,
  "is_demo" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "role" text DEFAULT 'Member' NOT NULL,
  "avatar" text DEFAULT '' NOT NULL,
  "color" text DEFAULT 'mint' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "category" text DEFAULT 'Design' NOT NULL,
  "status" text DEFAULT 'in_progress' NOT NULL,
  "color" text DEFAULT 'mint' NOT NULL,
  "due_date" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE,
  "assignee_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'todo' NOT NULL,
  "priority" text DEFAULT 'medium' NOT NULL,
  "due_date" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "member_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "detail" text DEFAULT '' NOT NULL,
  "kind" text DEFAULT 'project' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;

export function ensureDatabaseSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  if (!globalForSchema.__folioSchemaReady) {
    globalForSchema.__folioSchemaReady = pool
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch(error => {
        globalForSchema.__folioSchemaReady = undefined;
        throw error;
      });
  }
  return globalForSchema.__folioSchemaReady;
}
