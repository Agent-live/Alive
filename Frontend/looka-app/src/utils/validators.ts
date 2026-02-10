/**
 * 表单验证工具函数
 */

// 验证结果类型
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, message: '请输入手机号' };
  }
  // 中国大陆手机号正则
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '请输入正确的手机号' };
  }
  return { valid: true };
}

/**
 * 验证验证码
 */
export function validateCode(code: string, length = 6): ValidationResult {
  if (!code) {
    return { valid: false, message: '请输入验证码' };
  }
  const codeRegex = new RegExp(`^\\d{${length}}$`);
  if (!codeRegex.test(code)) {
    return { valid: false, message: `请输入${length}位验证码` };
  }
  return { valid: true };
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, message: '请输入邮箱' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: '请输入正确的邮箱地址' };
  }
  return { valid: true };
}

/**
 * 验证必填项
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName = '此项'
): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true };
}

/**
 * 验证长度范围
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName = '内容'
): ValidationResult {
  if (!value) {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  if (value.length < min) {
    return { valid: false, message: `${fieldName}至少需要${min}个字符` };
  }
  if (value.length > max) {
    return { valid: false, message: `${fieldName}不能超过${max}个字符` };
  }
  return { valid: true };
}

/**
 * 验证姓名
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, message: '请输入姓名' };
  }
  if (name.length < 2) {
    return { valid: false, message: '姓名至少需要2个字符' };
  }
  if (name.length > 20) {
    return { valid: false, message: '姓名不能超过20个字符' };
  }
  // 只允许中文、英文、空格
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, message: '姓名只能包含中文或英文' };
  }
  return { valid: true };
}

/**
 * 验证地址
 */
export function validateAddress(address: string): ValidationResult {
  if (!address) {
    return { valid: false, message: '请输入详细地址' };
  }
  if (address.length < 5) {
    return { valid: false, message: '详细地址至少需要5个字符' };
  }
  if (address.length > 100) {
    return { valid: false, message: '详细地址不能超过100个字符' };
  }
  return { valid: true };
}

/**
 * 验证邮编
 */
export function validatePostalCode(code: string): ValidationResult {
  if (!code) {
    return { valid: true }; // 邮编非必填
  }
  const postalRegex = /^\d{6}$/;
  if (!postalRegex.test(code)) {
    return { valid: false, message: '请输入6位邮编' };
  }
  return { valid: true };
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName = '数值'
): ValidationResult {
  if (isNaN(value)) {
    return { valid: false, message: `${fieldName}必须是数字` };
  }
  if (value < min) {
    return { valid: false, message: `${fieldName}不能小于${min}` };
  }
  if (value > max) {
    return { valid: false, message: `${fieldName}不能大于${max}` };
  }
  return { valid: true };
}

/**
 * 验证身高
 */
export function validateHeight(height: number): ValidationResult {
  return validateNumberRange(height, 100, 250, '身高');
}

/**
 * 验证体重
 */
export function validateWeight(weight: number): ValidationResult {
  return validateNumberRange(weight, 20, 200, '体重');
}

/**
 * 验证收货地址表单
 */
export function validateAddressForm(data: {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nameResult = validateName(data.name);
  if (!nameResult.valid) errors.name = nameResult.message!;

  const phoneResult = validatePhone(data.phone);
  if (!phoneResult.valid) errors.phone = phoneResult.message!;

  if (!data.province) errors.province = '请选择省份';
  if (!data.city) errors.city = '请选择城市';
  if (!data.district) errors.district = '请选择区县';

  const streetResult = validateAddress(data.street);
  if (!streetResult.valid) errors.street = streetResult.message!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 组合验证器
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
