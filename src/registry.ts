/**
 * Registry loading with proper error handling.
 * Extracted for testability.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Registry } from './types.js';
import { validateRegistry } from './lib.js';

export const REMOTE_REGISTRY_URL = 'https://raw.githubusercontent.com/askeluv/mcli/main/registry/tools.json';
export const LOCAL_REGISTRY_DIR = join(homedir(), '.mcli');
export const LOCAL_REGISTRY_PATH = join(LOCAL_REGISTRY_DIR, 'registry.json');

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

/**
 * Check if a local registry exists.
 */
export function hasLocalRegistry(): boolean {
  return existsSync(LOCAL_REGISTRY_PATH);
}

/**
 * Fetch registry from remote URL.
 * @throws {RegistryError} If fetch fails or response is invalid
 */
export async function fetchRemoteRegistry(): Promise<Registry> {
  let response: Response;
  try {
    response = await fetch(REMOTE_REGISTRY_URL);
  } catch (err) {
    throw new RegistryError(
      'Failed to fetch remote registry',
      err instanceof Error ? err : undefined
    );
  }

  if (!response.ok) {
    throw new RegistryError(
      `Failed to fetch registry: HTTP ${response.status}`
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    throw new RegistryError(
      'Remote registry contains invalid JSON',
      err instanceof Error ? err : undefined
    );
  }

  const validation = validateRegistry(data);
  if (!validation.valid) {
    throw new RegistryError(
      `Remote registry validation failed: ${validation.errors.join('; ')}`
    );
  }

  return data as Registry;
}

/**
 * Save registry to local cache.
 */
export function saveLocalRegistry(registry: Registry): void {
  mkdirSync(LOCAL_REGISTRY_DIR, { recursive: true });
  writeFileSync(LOCAL_REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Update local registry from remote.
 * @returns The updated registry
 */
export async function updateRegistry(): Promise<Registry> {
  const registry = await fetchRemoteRegistry();
  saveLocalRegistry(registry);
  return registry;
}
