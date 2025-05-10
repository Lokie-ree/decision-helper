import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const analyze = action({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes decisions by providing pros and cons. Provide exactly 3 pros and 3 cons in a JSON format.",
        },
        {
          role: "user",
          content: `Analyze this decision: ${args.question}. Respond in this exact JSON format: {"pros": ["pro1", "pro2", "pro3"], "cons": ["con1", "con2", "con3"]}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");

    const analysis = JSON.parse(content);
    
    await ctx.runMutation(api.decisions.save, {
      question: args.question,
      pros: analysis.pros,
      cons: analysis.cons,
    });

    return analysis;
  },
});

export const save = mutation({
  args: {
    question: v.string(),
    pros: v.array(v.string()),
    cons: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("decisions", {
      userId,
      question: args.question,
      pros: args.pros,
      cons: args.cons,
    });
  },
});

export const listRecent = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("decisions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
  },
});
