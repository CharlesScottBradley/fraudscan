/**
 * API Key Management Utilities
 *
 * API keys follow the format: sk_live_ + 32 random hex characters
 * Example format: sk_live_<32 hex chars>
 *
 * Keys are stored as SHA-256 hashes in the database.
 * The plaintext key is only shown once when created.
 */

import { createHash, randomBytes } from 'crypto';
import { supabase } from './supabase';

const API_KEY_PREFIX = 'sk_live_';
const KEY_LENGTH = 32; // 32 hex characters after prefix

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  owner_email: string;
  rate_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyResult {
  key: ApiKey;
  plaintext_key: string; // Only available at creation time
}

export interface ValidateKeyResult {
  valid: boolean;
  key?: ApiKey;
  error?: string;
}

/**
 * Generate a new API key
 * @returns The plaintext API key (sk_live_...)
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(KEY_LENGTH / 2).toString('hex');
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash an API key for storage
 * @param plaintextKey - The full API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(plaintextKey: string): string {
  return createHash('sha256').update(plaintextKey).digest('hex');
}

/**
 * Extract the prefix from an API key (first 8 characters)
 * @param plaintextKey - The full API key
 * @returns The key prefix for identification
 */
export function getKeyPrefix(plaintextKey: string): string {
  return plaintextKey.substring(0, 8);
}

/**
 * Validate API key format
 * @param key - The API key to validate
 * @returns True if the format is valid
 */
export function isValidKeyFormat(key: string): boolean {
  // Must start with prefix and have correct total length
  if (!key.startsWith(API_KEY_PREFIX)) return false;
  if (key.length !== API_KEY_PREFIX.length + KEY_LENGTH) return false;

  // Random part must be valid hex
  const randomPart = key.slice(API_KEY_PREFIX.length);
  return /^[0-9a-f]+$/i.test(randomPart);
}

/**
 * Create a new API key in the database
 * @param name - Human-readable name for the key
 * @param ownerEmail - Email of the key owner
 * @param options - Optional settings (rate_limit, expires_at)
 * @returns The created key record and plaintext key
 */
export async function createApiKey(
  name: string,
  ownerEmail: string,
  options: { rate_limit?: number; expires_at?: string } = {}
): Promise<CreateApiKeyResult> {
  const plaintextKey = generateApiKey();
  const keyHash = hashApiKey(plaintextKey);
  const keyPrefix = getKeyPrefix(plaintextKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      owner_email: ownerEmail,
      rate_limit: options.rate_limit || 100,
      expires_at: options.expires_at || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  return {
    key: data as ApiKey,
    plaintext_key: plaintextKey,
  };
}

/**
 * Validate an API key and return the key record if valid
 * @param plaintextKey - The API key to validate
 * @returns Validation result with key info if valid
 */
export async function validateApiKey(plaintextKey: string): Promise<ValidateKeyResult> {
  // Check format first
  if (!isValidKeyFormat(plaintextKey)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const keyHash = hashApiKey(plaintextKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid API key' };
  }

  const key = data as ApiKey;

  // Check if active
  if (!key.is_active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check expiration
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last_used_at (fire and forget - don't await)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {});

  return { valid: true, key };
}

/**
 * Get all API keys for an owner
 * @param ownerEmail - Email of the key owner
 * @returns List of API keys (without sensitive data)
 */
export async function getApiKeysByOwner(ownerEmail: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('owner_email', ownerEmail)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }

  return data as ApiKey[];
}

/**
 * Revoke (deactivate) an API key
 * @param keyId - The UUID of the key to revoke
 * @param ownerEmail - Email of the owner (for authorization)
 */
export async function revokeApiKey(keyId: string, ownerEmail: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('owner_email', ownerEmail);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}

/**
 * Delete an API key permanently
 * @param keyId - The UUID of the key to delete
 * @param ownerEmail - Email of the owner (for authorization)
 */
export async function deleteApiKey(keyId: string, ownerEmail: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('owner_email', ownerEmail);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

/**
 * Extract API key from request headers
 * Supports both "Authorization: Bearer sk_live_..." and "X-API-Key: sk_live_..."
 * @param request - The incoming request
 * @returns The API key or null if not found
 */
export function extractApiKeyFromRequest(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    if (isValidKeyFormat(key)) {
      return key;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && isValidKeyFormat(apiKeyHeader)) {
    return apiKeyHeader;
  }

  return null;
}
