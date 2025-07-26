# SowonFlow Documentation

The Missing Link in AI Transformation - Documentation site for YAML-based AI workflow engine.

## 🚀 Overview

This project is a SowonFlow documentation site built with Docusaurus. It primarily uses Korean as the source language and provides English versions through automated translation.

## 🌟 Key Features

- **Multilingual Support**: Korean source, automated English translation
- **Automated Translation**: Automatically translates Korean documents to English when changed
- **GitHub Pages Deployment**: Automated build and deployment
- **Modern UI**: Responsive interface based on Docusaurus 3.x

## 🛠️ Tech Stack

- **Docusaurus 3.x**: Static site generator
- **TypeScript**: Type safety
- **GitHub Actions**: CI/CD pipeline
- **OpenRouter API**: AI-powered automated translation

## 🏃‍♂️ Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Build

```bash
# Production build
npm run build

# Serve built site locally
npm run serve
```

## 📝 Documentation Guide

### Writing Korean Documentation

1. Write markdown files in Korean in the `docs-ko/` directory
2. Commit and push changes
3. GitHub Actions automatically translates to English and saves to `docs/` directory

### Translation Commands

```bash
# Translate all files
npm run translate

# Translate specific file
npm run translate docs-ko/specific-file.md
```

### Sidebar Configuration

Configure navigation structure in the `sidebars.ts` file.

## 🤖 Automated Translation System

### How It Works

1. When markdown files in `docs-ko/` directory are changed
2. GitHub Actions workflow is triggered
3. AI translation is performed via OpenRouter API
4. Translated documents are saved to `docs/` directory

### Translation Quality Improvements

- Maintains technical terminology consistency
- Preserves brand names (SowonFlow)
- Maintains markdown formatting
- Translates text within YAML code blocks

## 📁 Project Structure

```
sowonflow-docs/
├── docs/                          # English translated documents
│   ├── index.md                   # Homepage
│   ├── intro.md                   # Introduction
│   ├── agent.md                   # Agent guide
│   ├── supervisor.md              # Supervisor guide
│   ├── models.md                  # Models guide
│   ├── mcp.md                     # MCP guide
│   ├── documentation.md           # Documentation guide
│   └── examples/                  # Examples
│       ├── 1.md
│       └── 3.md
├── docs-ko/                       # Korean source documents
│   ├── intro.md                   # Introduction (Korean)
│   ├── agent.md                   # Agent guide (Korean)
│   ├── supervisor.md              # Supervisor guide (Korean)
│   ├── models.md                  # Models guide (Korean)
│   ├── mcp.md                     # MCP guide (Korean)
│   ├── documentation.md           # Documentation guide (Korean)
│   └── examples/                  # Examples (Korean)
├── src/                           # React components
├── static/                        # Static files
├── .github/
│   ├── workflows/                 # CI/CD workflows
│   └── scripts/                   # Translation scripts
├── docusaurus.config.ts           # Docusaurus configuration
└── sidebars.ts                    # Sidebar configuration
```

## 🚀 Deployment

This site is automatically deployed via GitHub Pages:

- **URL**: https://sowonai.github.io/sowonflow-docs/
- **Trigger**: When pushed to `main` branch
- **Build**: Automatically performed in GitHub Actions

## 🔧 Environment Variables

The following secrets are required for automated translation:

- `OPENROUTER_API_KEY`: OpenRouter API key

## 🤝 Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Write documentation in Korean in the `docs-ko/` directory
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Docusaurus](https://docusaurus.io/) - Excellent documentation platform
- [OpenRouter](https://openrouter.ai/) - AI translation service
- [GitHub Pages](https://pages.github.com/) - Free hosting service
