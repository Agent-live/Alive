/**
 * Form validation utilities
 */

import { PersonalityConfig } from '../types';

// Validation result type
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, message: 'Please enter your phone number' };
  }
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Please enter a valid phone number' };
  }
  return { valid: true };
}

/**
 * Validate verification code
 */
export function validateCode(code: string, length = 6): ValidationResult {
  if (!code) {
    return { valid: false, message: 'Please enter the verification code' };
  }
  const codeRegex = new RegExp(`^\\d{${length}}$`);
  if (!codeRegex.test(code)) {
    return { valid: false, message: `Please enter a ${length}-digit code` };
  }
  return { valid: true };
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, message: 'Please enter your email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
}

/**
 * Validate required field
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName = 'This field'
): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true };
}

/**
 * Validate string length range
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName = 'Content'
): ValidationResult {
  if (!value) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value.length < min) {
    return { valid: false, message: `${fieldName} must be at least ${min} characters` };
  }
  if (value.length > max) {
    return { valid: false, message: `${fieldName} cannot exceed ${max} characters` };
  }
  return { valid: true };
}

/**
 * Validate display name
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, message: 'Please enter a name' };
  }
  if (name.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (name.length > 20) {
    return { valid: false, message: 'Name cannot exceed 20 characters' };
  }
  const nameRegex = /^[a-zA-Z\u4e00-\u9fa5\s]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, message: 'Name can only contain letters and spaces' };
  }
  return { valid: true };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName = 'Value'
): ValidationResult {
  if (isNaN(value)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }
  if (value < min) {
    return { valid: false, message: `${fieldName} cannot be less than ${min}` };
  }
  if (value > max) {
    return { valid: false, message: `${fieldName} cannot be greater than ${max}` };
  }
  return { valid: true };
}

/**
 * Validate agent name (2-20 chars, alphanumeric + spaces + hyphens)
 */
export function validateAgentName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, message: 'Please give your agent a name' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Agent name must be at least 2 characters' };
  }
  if (name.length > 20) {
    return { valid: false, message: 'Agent name cannot exceed 20 characters' };
  }
  const agentNameRegex = /^[a-zA-Z0-9\s\-]+$/;
  if (!agentNameRegex.test(name)) {
    return { valid: false, message: 'Agent name can only contain letters, numbers, spaces, and hyphens' };
  }
  return { valid: true };
}

/**
 * Validate agent personality configuration
 */
export function validatePersonality(personality: Partial<PersonalityConfig>): ValidationResult {
  if (!personality.worldview) {
    return { valid: false, message: 'Please select a worldview for your agent' };
  }
  if (!personality.values || personality.values.length < 2) {
    return { valid: false, message: 'Please select at least 2 values' };
  }
  if (personality.values.length > 5) {
    return { valid: false, message: 'Please select no more than 5 values' };
  }
  if (!personality.communicationStyle) {
    return { valid: false, message: 'Please select a communication style' };
  }
  return { valid: true };
}

/**
 * Validate goal description
 */
export function validateGoalDescription(description: string): ValidationResult {
  if (!description) {
    return { valid: false, message: 'Please enter a goal description' };
  }
  if (description.trim().length < 5) {
    return { valid: false, message: 'Goal description must be at least 5 characters' };
  }
  if (description.length > 200) {
    return { valid: false, message: 'Goal description cannot exceed 200 characters' };
  }
  return { valid: true };
}

/**
 * Validate channel quota
 */
export function validateChannelQuota(
  usedQuota: number,
  maxQuota: number,
  channelWeight: number
): ValidationResult {
  if (usedQuota + channelWeight <= maxQuota) {
    return { valid: true };
  }
  return {
    valid: false,
    message: `Channel quota exceeded. Used: ${usedQuota}, Max: ${maxQuota}, Required: ${channelWeight}`,
  };
}

/**
 * Check if user can create another agent
 */
export function canCreateAgent(usedSlots: number, maxSlots: number): boolean {
  return usedSlots < maxSlots;
}

/**
 * Compose multiple validators
 */
export function composeValidators(
  ...validators: (() => ValidationResult)[]
): ValidationResult {
  for (const validator of validators) {
    const result = validator();
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}
