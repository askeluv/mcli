/**
 * Registry loading with proper error handling.
 * Extracted for testability.
 */
import { readFileSync, existsSync } from 'fs';
import type { Registry } from './types.js';
import { validateRegistry } from './lib.js';

export class RegistryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Load and validate registry from a JSON file.
 * @throws {RegistryError} If file is missing, malformed, or invalid
 */
export function loadRegistry(path: string): Registry {
  // Check file exists
  if (!existsSync(path)) {
    throw new RegistryError(`Registry file not found: ${path}`);
  }

  // Read file
  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new RegistryError(
      `Failed to read registry file: ${path}`,
      err instanceof Error ? err : undefined
    );
  }

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (err) {
    throw new RegistryError(
      `Registry file contains invalid JSON: ${path}`,
      err instanceof Error ? err : undefined
    );
  }

  // Validate schema
  const validation = validateRegistry(data);
  if (!validation.valid) {
    throw new RegistryError(
      `Registry validation failed: ${validation.errors.join('; ')}`
    );
  }

  return data as Registry;
}
