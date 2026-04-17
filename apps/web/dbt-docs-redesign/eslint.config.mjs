import nextConfig from 'eslint-config-next/core-web-vitals';

const config = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

export default [
  ...config,
  {
    rules: {
      // react-hooks v7 introduced these rules but they produce false positives
      // for common patterns (setMounted, setLoading, animation loops)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];
