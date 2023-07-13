/** @type {import('next').NextConfig} */

module.exports = {
  output: 'standalone',
  i18n: {
    locales: ['en', 'de', 'bs', 'hu', 'ro'],
    defaultLocale: 'en',
  },
};
