// Pinterest API v5 Client

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

export interface PinterestBoard {
  id: string;
  name: string;
  description: string | null;
  pin_count: number;
  privacy: string;
  media?: {
    image_cover_url?: string;
  };
}

export interface PinterestPin {
  id: string;
  title: string | null;
  description: string | null;
  link: string | null;
  media?: {
    media_type: string;
    images?: {
      '150x150'?: { url: string };
      '400x300'?: { url: string };
      '600x'?: { url: string };
      '1200x'?: { url: string };
    };
  };
  board_id: string;
  created_at: string;
}

export interface PinterestUser {
  username: string;
  account_type: string;
  profile_image: string | null;
}

export class PinterestClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${PINTEREST_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Pinterest API error: ${response.status}`);
    }

    return response.json();
  }

  async getUser(): Promise<PinterestUser> {
    return this.request<PinterestUser>('/user_account');
  }

  async getBoards(pageSize = 25, bookmark?: string): Promise<{ items: PinterestBoard[]; bookmark?: string }> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (bookmark) params.append('bookmark', bookmark);
    return this.request(`/boards?${params}`);
  }

  async getBoardPins(boardId: string, pageSize = 25, bookmark?: string): Promise<{ items: PinterestPin[]; bookmark?: string }> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (bookmark) params.append('bookmark', bookmark);
    return this.request(`/boards/${boardId}/pins?${params}`);
  }

  async getPin(pinId: string): Promise<PinterestPin> {
    return this.request(`/pins/${pinId}`);
  }

  async searchUserPins(query: string, pageSize = 25, bookmark?: string): Promise<{ items: PinterestPin[]; bookmark?: string }> {
    const params = new URLSearchParams({ query, page_size: String(pageSize) });
    if (bookmark) params.append('bookmark', bookmark);
    return this.request(`/search/pins?${params}`);
  }
}

// OAuth helpers
export function getPinterestAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'boards:read,pins:read,user_accounts:read',
    state,
  });
  return `https://www.pinterest.com/oauth/?${params}`;
}

export async function exchangePinterestCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to exchange Pinterest code');
  }

  return response.json();
}

export async function refreshPinterestToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to refresh Pinterest token');
  }

  return response.json();
}
