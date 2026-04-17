import nextConfig from 'eslint-config-next/core-web-vitals';

export default Array.isArray(nextConfig) ? nextConfig : [nextConfig];
