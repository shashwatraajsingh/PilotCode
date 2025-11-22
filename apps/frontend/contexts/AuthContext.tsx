'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthTokens, login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name?: string) => Promise<void>
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is already logged in
        const initAuth = async () => {
            try {
                const accessToken = localStorage.getItem('access_token')
                if (accessToken) {
                    const userData = await getCurrentUser(accessToken)
                    setUser(userData)
                }
            } catch (error) {
                console.error('Failed to restore session:', error)
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const { user: userData, tokens } = await apiLogin(email, password)
            localStorage.setItem('access_token', tokens.accessToken)
            localStorage.setItem('refresh_token', tokens.refreshToken)
            setUser(userData)
        } catch (error) {
            throw error
        }
    }

    const register = async (email: string, password: string, name?: string) => {
        try {
            const { user: userData, tokens } = await apiRegister(email, password, name)
            localStorage.setItem('access_token', tokens.accessToken)
            localStorage.setItem('refresh_token', tokens.refreshToken)
            setUser(userData)
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
