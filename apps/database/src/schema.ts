import { sql } from 'drizzle-orm';
import { integer, sqliteTable, primaryKey, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text(),
  avatar_url: text(),
  email: text().unique().notNull(),
  github_username: text(),
  company: text(),
  site: text(),
  location: text(),
  bio: text(),
  twitter_username: text(),
  created_at: text()
    .default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updated_at: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  setup_at: text(),
  terms_accepted_at: text(),
},
	(table) => {
		return {
			emailIdx: uniqueIndex("email_idx").on(table.email),
			githubUsernameIdx: uniqueIndex("github_username_idx").on(table.github_username),
			twitterUsernameIdx: uniqueIndex("twitter_username_idx").on(table.twitter_username),
		};
	},
);

export type User = typeof user.$inferSelect;

export const oauthAccount = sqliteTable(
  "oauth_account",
  {
    provider_id: text(),
    provider_user_id: text(),
    user_id: integer()
      .notNull()
      .references(() => user.id),
  },
  (table: any) => [primaryKey({ columns: [table.provider_id, table.provider_user_id] })],
);

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  user_id: integer()
    .notNull()
    .references(() => user.id),
	expires_at: text().notNull(),
	last_extended_at: text("last_extended_at").default(sql`(CURRENT_TIMESTAMP)`).notNull()
}, (table) => {
	return {
		expiresAtIdx: index("expires_at_idx").on(table.expires_at),
	};
});

export type Session = typeof session.$inferSelect;

export const document = sqliteTable("document", {
    id: text().primaryKey(),
    metadata: text(),
    title: text(),
    description: text(),
    slug: text(),
    content: text(),
    type: text(),
    storage_key: text(),
    archived: integer().default(0),
    draft: integer().default(0),
    image_url: text(),
    image_alt: text(),
    tags: text(),
    audio_url: text(),
    created_at: text()
    .default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updated_at: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export type Document = typeof document.$inferSelect;