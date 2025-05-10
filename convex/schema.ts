import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  decisions: defineTable({
    userId: v.id("users"),
    question: v.string(),
    pros: v.array(v.string()),
    cons: v.array(v.string()),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
