// Ambient declarations for static asset imports (Vite serves these in dev
// and emits hashed files for production builds).
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}
