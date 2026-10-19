"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// No arguments — talks to the same-origin /api/auth proxy
export const authClient = createAuthClient();
