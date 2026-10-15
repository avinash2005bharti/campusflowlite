import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or enrollment number').trim(),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export const registerStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  rollNumber: z.string().min(1, 'Roll Number is required').trim().optional(),
  enrollment_no: z.string().trim().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  semester: z.union([z.string(), z.number()]).optional(),
  section: z.string().trim().optional(),
  batch: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  enrollmentYear: z.union([z.string(), z.number()]).optional(),
});

export const registerTeacherSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  employeeId: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export default {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  registerStudentSchema,
  registerTeacherSchema,
};
