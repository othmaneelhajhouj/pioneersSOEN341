const express = require("express");
const prisma = require("../lib/prisma");
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} = require("../lib/auth");
const { wantsJson } = require("../utils/validation");

const router = express.Router();

const secureCookies = process.env.NODE_ENV === "production";

// --- cookie helpers -------------------------------------------------------

// Attach the session token to a secure, httpOnly cookie so the browser keeps
// sending it for us. This keeps session handling straightforward.
function setSessionCookie(res, token, expiresAt) {
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    expires: expiresAt,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
  });
}

// For API style requests we stick to JSON responses. For regular form posts we
// rely on redirects instead to keep things familiar.
function redirectTo(req, res, path) {
  if (wantsJson(req)) {
    return res.json({ ok: true, redirect: path });
  }
  return res.redirect(path);
}

// --- login ----------------------------------------------------------------

router.get("/login", (req, res) => {
  if (req.user) {
    // If user is already logged in, redirect to next URL or home
    const nextUrl = req.query.next || "/";
    return redirectTo(req, res, nextUrl);
  }
  if (wantsJson(req)) {
    return res.json({ ok: true, form: "login" });
  }
  // Pass the next URL to the template so it can be included in the form
  return res.render("auth/login", { error: null, values: {}, next: req.query.next || null });
});

router.post("/login", async (req, res) => {
  // Support both form submissions and JSON bodies.
  const { email, password } = req.body;
  const nextUrl = req.query.next || req.body.next || "/";
  
  if (!email || !password) {
    const error = "Email and password are required.";
    if (wantsJson(req)) return res.status(400).json({ error });
    return res.status(400).render("auth/login", { error, values: { email }, next: nextUrl });
  }

  // Look up the user and compare their password hash.
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    const error = "Invalid email or password.";
    if (wantsJson(req)) return res.status(401).json({ error });
    return res.status(401).render("auth/login", { error, values: { email }, next: nextUrl });
  }

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);

  if (wantsJson(req)) {
    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      redirect: nextUrl,
    });
  }

  return res.redirect(nextUrl);
});

// --- logout ---------------------------------------------------------------

router.post("/logout", async (req, res) => {
  if (req.sessionToken) {
    await destroySession(req.sessionToken);
  }
  clearSessionCookie(res);
  if (wantsJson(req)) {
    return res.json({ ok: true });
  }
  return res.redirect("/login");
});

// --- register -------------------------------------------------------------

router.get("/register", (req, res) => {
  if (req.user) {
    return redirectTo(req, res, "/");
  }
  if (wantsJson(req)) {
    return res.json({ ok: true, form: "register" });
  }
  return res.render("auth/register", { errors: [], values: {} });
});

router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const values = { email, firstName, lastName };

  const errors = [];
  if (!email || !email.trim()) errors.push("Email is required.");
  if (!password || password.length < 8) errors.push("Password must be at least 8 characters.");
  if (!firstName || !firstName.trim()) errors.push("First name is required.");

  if (errors.length) {
    if (wantsJson(req)) return res.status(400).json({ errors });
    return res.status(400).render("auth/register", { errors, values });
  }

  const lowerEmail = email.trim().toLowerCase();

  try {
    // Everyone starts as a student. Organizer access is requested later.
    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        passwordHash: hashPassword(password),
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        role: "student",
      },
    });

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);

    if (wantsJson(req)) {
      return res.status(201).json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }

    return res.redirect("/");
  } catch (err) {
    console.error("Registration failed", err);
    if (err?.code === "P2002") {
      const error = "An account with that email already exists.";
      if (wantsJson(req)) return res.status(409).json({ error });
      return res.status(409).render("auth/register", { errors: [error], values });
    }

    if (wantsJson(req)) return res.status(500).json({ error: "Registration failed." });
    return res.status(500).render("auth/register", { errors: ["Registration failed."], values });
  }
});

module.exports = router;
