/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin Turbopack's workspace root to this project directory. Without this,
  // Turbopack walks up the filesystem for a lockfile and can misidentify the
  // root (e.g. a stray package-lock.json in a parent/home directory), which
  // breaks internal module resolution. import.meta.dirname keeps this portable
  // across machines and CI — no absolute paths.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
