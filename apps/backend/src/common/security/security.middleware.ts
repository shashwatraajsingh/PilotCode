import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware
 * Adds essential security headers to all responses
 * 
 * Note: For comprehensive security headers, consider using the 'helmet' package:
 * npm install helmet
 * 
 * Then in main.ts: app.use(helmet())
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Prevent clickjacking attacks
        res.setHeader('X-Frame-Options', 'DENY');

        // Enable browser XSS filtering
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Control referrer information
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
        );

        // Strict Transport Security (only enable in production with HTTPS)
        if (process.env.NODE_ENV === 'production') {
            res.setHeader(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Remove server information header
        res.removeHeader('X-Powered-By');

        next();
    }
}

/**
 * Security configuration constants
 */
export const SecurityConfig = {
    // Password requirements
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: false,
    },

    // JWT configuration
    jwt: {
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d',
    },

    // Rate limiting defaults
    rateLimit: {
        ttl: 60, // seconds
        limit: 100, // requests per window
        loginLimit: 5, // login attempts per window
        loginTtl: 300, // 5 minutes
    },

    // Allowed file paths for file system operations
    allowedPaths: [
        '/tmp/devin-',
        '/workspace',
    ],

    // Dangerous command patterns to block
    dangerousCommandPatterns: [
        /;/,      // Command chaining
        /\|/,     // Piping
        /&/,      // Background execution / command chaining
        /`/,      // Backtick substitution
        /\$\(/,   // Command substitution
        />/,      // Output redirection
        /</,      // Input redirection
        /\n/,     // Newline injection
        /\r/,     // Carriage return injection
    ],

    // Blocked executables  
    blockedExecutables: [
        'rm',
        'rmdir',
        'curl',
        'wget',
        'nc',
        'netcat',
        'python',
        'python3',
        'perl',
        'ruby',
        'eval',
        'exec',
    ],
};
