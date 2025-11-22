const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface User {
    id: string
    email: string
    name?: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

export async function register(email: string, password: string, name?: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to register')
    }

    const data = await response.json()
    return {
        user: data.user,
        tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        },
    }
}

export async function login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to login')
    }

    const data = await response.json()
    return {
        user: data.user,
        tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        },
    }
}

export async function getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to get current user')
    }

    return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
        throw new Error('Failed to refresh token')
    }

    return response.json()
}
