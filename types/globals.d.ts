export {};

declare global {
  // Clerk Dashboard → Sessions → Customize session token: "metadata": "{{user.public_metadata}}"
  interface CustomJwtSessionClaims {
    metadata?: { role?: "admin" };
  }
}
