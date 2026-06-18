import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: {
    username: v.string(), // We treat the email as the username
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (admin && admin.password === args.password) {
      return { success: true, token: "admin-token-placeholder" };
    }
    return { success: false, error: "Invalid credentials" };
  },
});

export const initAdmins = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSonis = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", "sonishriyash@gmail.com"))
      .first();
    
    if (existingSonis) {
      await ctx.db.patch(existingSonis._id, { password: "Soni#2023" });
    } else {
      await ctx.db.insert("admins", { username: "sonishriyash@gmail.com", password: "Soni#2023" });
    }

    const existingApnaBad = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", "apnacopunsellor@gmail.com"))
      .first();
      
    if (existingApnaBad) {
      await ctx.db.delete(existingApnaBad._id);
    }
    
    const existingApna = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", "OpenHire@gmail.com"))
      .first();
      
    if (existingApna) {
      await ctx.db.patch(existingApna._id, { password: "Soni#2023" });
    } else {
      await ctx.db.insert("admins", { username: "OpenHire@gmail.com", password: "Soni#2023" });
    }

    return "Admin passwords updated successfully";
  },
});

// --- NEW COMPREHENSIVE ADMIN MANAGEMENT ---

export const getAdmins = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admins").collect();
  },
});

export const createAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (existing) {
      throw new Error("Admin with this email already exists");
    }
    
    await ctx.db.insert("admins", {
      username: args.username,
      password: args.password,
    });
  },
});

export const deleteAdmin = mutation({
  args: { adminId: v.id("admins") },
  handler: async (ctx, args) => {
    // Prevent deleting the last admin
    const admins = await ctx.db.query("admins").collect();
    if (admins.length <= 1) {
      throw new Error("Cannot delete the last remaining admin account.");
    }
    await ctx.db.delete(args.adminId);
  },
});
