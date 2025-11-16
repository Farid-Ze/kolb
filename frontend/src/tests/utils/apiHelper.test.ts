/**
 * KLSI 4.0 - API Helper Unit Tests
 * Tests untuk utility functions di apiHelper.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseApiError, apiCall } from '../../utils/apiHelper';

describe('parseApiError', () => {
  it('should parse JSON error response with detail field', async () => {
    const mockResponse = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ detail: 'Invalid credentials' }),
    } as unknown as Response;

    const result = await parseApiError(mockResponse);
    expect(result).toBe('Invalid credentials');
  });

  it('should parse JSON error response with message field', async () => {
    const mockResponse = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'Server error' }),
    } as unknown as Response;

    const result = await parseApiError(mockResponse);
    expect(result).toBe('Server error');
  });

  it('should parse text error response', async () => {
    const mockResponse = {
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: vi.fn().mockResolvedValue('Bad Request'),
      statusText: 'Bad Request',
    } as unknown as Response;

    const result = await parseApiError(mockResponse);
    expect(result).toBe('Bad Request');
  });

  it('should fallback to status text if parsing fails', async () => {
    const mockResponse = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockRejectedValue(new Error('Parse error')),
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response;

    const result = await parseApiError(mockResponse);
    expect(result).toBe('500 Internal Server Error');
  });

  it('should handle response without detail or message', async () => {
    const mockResponse = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response;

    const result = await parseApiError(mockResponse);
    expect(result).toBe('Request failed');
  });
});

describe('apiCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch and return JSON data', async () => {
    const mockData = { id: 1, name: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockData),
    });

    const result = await apiCall('/api/test', { method: 'GET' });
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/test', { method: 'GET' });
  });

  it('should handle non-JSON success responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
    });

    const result = await apiCall('/api/test', { method: 'POST' });
    expect(result).toEqual({});
  });

  it('should throw error on failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ detail: 'Resource not found' }),
    });

    await expect(apiCall('/api/test', { method: 'GET' })).rejects.toThrow(
      'Resource not found'
    );
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(apiCall('/api/test', { method: 'GET' })).rejects.toThrow(
      'Network error'
    );
  });

  it('should handle unknown errors', async () => {
    global.fetch = vi.fn().mockRejectedValue('Unknown error');

    await expect(apiCall('/api/test', { method: 'GET' })).rejects.toThrow(
      'Network error: Unable to reach server'
    );
  });
});
