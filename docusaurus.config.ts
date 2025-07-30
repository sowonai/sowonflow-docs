import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'SowonFlow Documentation',
  tagline: 'The Missing Link in AI Transformation',
  favicon: 'img/LogoIcon2.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sowonai.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/sowonflow-docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sowonai', // Usually your GitHub org/user name.
  projectName: 'sowonflow-docs', // Usually your repo name.

  onBrokenLinks: 'warn', // GitHub Pages 배포를 위해 임시로 warn으로 설정
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editLocalizedFiles: true,
          routeBasePath: '/',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/sowonai/sowonflow-docs/tree/main/',
        },
        blog: false, // 블로그 비활성화
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-1C2N095D9M',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        blogRouteBasePath: '/blog', // false 대신 경로 지정
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'SowonFlow',
      logo: {
        alt: 'SowonFlow Logo',
        src: 'img/LogoIcon2.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/sowonai/sowonflow-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/sowonai/sowonflow-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} SowonLabs.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
