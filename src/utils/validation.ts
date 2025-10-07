import { z } from 'zod';

// User authentication schemas
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email address is too long'), // RFC 5321 limit
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional()
});

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email address is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s''-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s''-]+$/, 'Last name contains invalid characters'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email address is too long')
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Event schemas
export const eventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description is too long')
    .trim(),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
    .refine((date) => new Date(date) >= new Date(), 'Event date must be today or in the future'),
  time: z
    .string()
    .optional()
    .refine((time) => !time || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), 'Invalid time format (HH:MM)'),
  end_times: z
    .string()
    .optional()
    .refine((time) => !time || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), 'Invalid end time format (HH:MM)'),
  venue: z
    .string()
    .min(1, 'Venue is required')
    .max(200, 'Venue name is too long')
    .trim(),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country name is too long')
    .trim(),
  address: z
    .string()
    .max(500, 'Address is too long')
    .trim()
    .optional(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price is too high')
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
    .default('EUR'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category name is too long'),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(1000000, 'Capacity is too large')
    .optional(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tags: z
    .array(z.string().max(50, 'Tag is too long'))
    .max(10, 'Too many tags')
    .optional(),
  image_url: z
    .string()
    .url('Invalid image URL')
    .max(2000, 'Image URL is too long')
    .optional(),
  poster_image_url: z
    .string()
    .url('Invalid poster image URL')
    .max(2000, 'Poster image URL is too long')
    .optional(),
  contact_email: z
    .string()
    .email('Invalid contact email')
    .max(320, 'Contact email is too long')
    .optional(),
  contact_phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .max(20, 'Phone number is too long')
    .optional(),
  website_url: z
    .string()
    .url('Invalid website URL')
    .max(2000, 'Website URL is too long')
    .optional()
}).refine((data) => {
  if (data.end_times && data.time) {
    return data.end_times > data.time;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['end_times']
});

// Contact form schema
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s''-]+$/, 'Name contains invalid characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(320, 'Email address is too long'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject is too long')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long')
    .trim(),
  honeypot: z.string().max(0, 'Bot detected') // Honeypot field for spam protection
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s''-]+$/, 'First name contains invalid characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s''-]+$/, 'Last name contains invalid characters')
    .trim()
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio is too long')
    .trim()
    .optional(),
  website: z
    .string()
    .url('Invalid website URL')
    .max(200, 'Website URL is too long')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location is too long')
    .trim()
    .optional(),
  avatar_url: z
    .string()
    .url('Invalid avatar URL')
    .max(2000, 'Avatar URL is too long')
    .optional()
});

// API request schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be positive')
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
  sortBy: z
    .enum(['date', 'price', 'title', 'created_at'])
    .default('date'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
  search: z
    .string()
    .max(200, 'Search query is too long')
    .trim()
    .optional(),
  category: z
    .string()
    .max(100, 'Category filter is too long')
    .trim()
    .optional()
});

export const idParamSchema = z.object({
  id: z
    .string()
    .uuid('Invalid ID format')
});

// Interest event schema
export const interestSchema = z.object({
  eventId: z
    .string()
    .uuid('Invalid event ID format')
});

// Admin schemas
export const adminEventUpdateSchema = z.object({
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  featured_order: z
    .number()
    .int('Featured order must be a whole number')
    .min(0, 'Featured order cannot be negative')
    .optional()
});

// Rate limiting schema
export const rateLimitSchema = z.object({
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().min(1).max(10000),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false)
});

// Environment validation schema
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

// Export schema types for TypeScript
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type InterestInput = z.infer<typeof interestSchema>;
export type AdminEventUpdateInput = z.infer<typeof adminEventUpdateSchema>;
export type RateLimitInput = z.infer<typeof rateLimitSchema>;
export type EnvInput = z.infer<typeof envSchema>;

// Utility function to safely parse and validate data
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: z.ZodError;
  issues: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return { success: false, error, issues };
    }
    throw error;
  }
}
