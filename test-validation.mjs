#!/usr/bin/env node

// Simple test runner for the runtime validator
import { TachiRuntimeValidator } from './runtime-validator.mjs';

console.log('🧪 Testing Runtime Validator...');

const validator = new TachiRuntimeValidator();

try {
  // Run a quick validation
  console.log('Running validation...');
  await validator.runRuntimeValidation();
  
  console.log('\n📊 VALIDATION COMPLETE!');
  
  // Generate and display report
  const report = validator.generateValidationReport();
  console.log(report);
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  console.error(error.stack);
}
