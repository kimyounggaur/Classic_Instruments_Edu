import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** One authenticated visitor's workspace. Never used to store shared or public data. */
export const userStates = sqliteTable("user_states", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  instrument: text("instrument").notNull(),
  level: text("level").notNull(),
  missionJson: text("mission_json").notNull(),
  missionId: text("mission_id").notNull(),
  joinCode: text("join_code").notNull(),
  createdAt: text("created_at").notNull(),
  closedAt: text("closed_at"),
}, (t) => [index("classroom_owner_idx").on(t.ownerId), uniqueIndex("classroom_code_idx").on(t.joinCode)]);

export const classroomMembers = sqliteTable("classroom_members", {
  sessionId: text("session_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull(),
  joinedAt: text("joined_at").notNull(),
}, (t) => [primaryKey({ columns: [t.sessionId, t.userId] }), index("classroom_member_user_idx").on(t.userId)]);

export const classroomCompletions = sqliteTable("classroom_completions", {
  sessionId: text("session_id").notNull().references(() => classrooms.id, { onDelete: "cascade" }),
  missionId: text("mission_id").notNull(),
  userId: text("user_id").notNull(),
  minutes: integer("minutes").notNull(),
  note: text("note").notNull(),
  completedAt: text("completed_at").notNull(),
}, (t) => [primaryKey({ columns: [t.sessionId, t.missionId, t.userId] })]);

/** Immutable server-side evidence of workflow changes; this is not expert certification. */
export const reviewAudit = sqliteTable("review_audit", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  reviewId: text("review_id").notNull(),
  action: text("action").notNull(),
  detailJson: text("detail_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (t) => [index("review_audit_user_idx").on(t.userId, t.createdAt)]);
