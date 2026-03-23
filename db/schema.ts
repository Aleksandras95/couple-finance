import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  invite_code: text('invite_code').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatar_color: text('avatar_color').notNull().default('#F43F5E'),
  household_id: uuid('household_id').references(() => households.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('💰'),
  color: text('color').notNull().default('#8B5CF6'),
  type: text('type').notNull().default('both'), // 'income' | 'expense' | 'both'
  is_default: boolean('is_default').notNull().default(false),
  household_id: uuid('household_id').references(() => households.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: integer('amount').notNull(), // in cents (100 = €1.00)
  type: text('type').notNull(), // 'income' | 'expense'
  category_id: uuid('category_id').references(() => categories.id),
  date: text('date').notNull(), // ISO date YYYY-MM-DD
  description: text('description'),
  user_id: uuid('user_id').notNull().references(() => users.id),
  household_id: uuid('household_id').notNull().references(() => households.id),
  is_recurring: boolean('is_recurring').notNull().default(false),
  recurring_interval: text('recurring_interval'), // 'monthly' | 'weekly' | 'yearly'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  category_id: uuid('category_id').notNull().references(() => categories.id),
  household_id: uuid('household_id').notNull().references(() => households.id),
  amount: integer('amount').notNull(), // in cents
  month: text('month').notNull(), // YYYY-MM
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const householdsRelations = relations(households, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  household: one(households, { fields: [users.household_id], references: [households.id] }),
  transactions: many(transactions),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  household: one(households, { fields: [categories.household_id], references: [households.id] }),
  transactions: many(transactions),
  budgets: many(budgets),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.user_id], references: [users.id] }),
  household: one(households, { fields: [transactions.household_id], references: [households.id] }),
  category: one(categories, { fields: [transactions.category_id], references: [categories.id] }),
}))

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, { fields: [budgets.category_id], references: [categories.id] }),
  household: one(households, { fields: [budgets.household_id], references: [households.id] }),
}))
