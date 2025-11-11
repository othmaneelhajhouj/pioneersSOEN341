import { Request, Response, NextFunction } from "express";

/**
 * Helper to check if request expects JSON response
 */
function wantsJson(req: Request): boolean {
    const contentType = req.headers['content-type'] || '';
    const accept = req.headers.accept || '';
    return contentType.includes('application/json') || accept.includes('application/json');
}

/**
 * Middleware to restrict access to admin users only
 * Handles both JSON API requests and HTML page requests
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
    // Check if user is not authenticated
    if (!req.user) {
        if (wantsJson(req)) {
            return res.status(401).json({ error: "Authentication required." });
        }
        // Redirect to login with return URL for HTML requests
        const nextUrl = encodeURIComponent(req.originalUrl || "/admin/dashboard");
        return res.redirect(`/login?next=${nextUrl}`);
    }

    // Check if user is not an admin
    if (req.user.role !== "admin") {
        if (wantsJson(req)) {
            return res.status(403).json({ error: "Access denied: admin only" });
        }
        // Show forbidden page for HTML requests
        return res.status(403).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Access Denied</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .container { text-align: center; padding: 2rem; }
                    h1 { font-size: 3rem; margin: 0 0 1rem; }
                    p { font-size: 1.25rem; margin: 0 0 2rem; opacity: 0.9; }
                    a { display: inline-block; padding: 0.75rem 2rem; background: white; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s; }
                    a:hover { transform: translateY(-2px); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚫 Access Denied</h1>
                    <p>You need administrator privileges to access this page.</p>
                    <a href="/">Return to Home</a>
                </div>
            </body>
            </html>
        `);
    }

    // User is authenticated and is an admin
    next();
}