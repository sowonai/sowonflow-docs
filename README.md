# SowonFlow Documentation Translation System

AI-powered translation system for SowonFlow documentation using OpenRouter and Google Translate fallback.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Run interactive setup (recommended)
npm run setup

# Or manually edit .env file
# OPENROUTER_API_KEY=your_key_here
# OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

### 3. Start Translating
```bash
# Translate a single file
npm run translate:file ko/agent.md

# Translate all files
npm run translate:all

# Watch mode (auto-translate on file changes)
npm run dev

# Validate translations
npm run test
```

## 📚 Available Scripts

| Script | Description | Example |
|--------|-------------|---------|
| `npm run setup` | Initial setup wizard | Interactive configuration |
| `npm run env:check` | Check environment variables | Show current settings |
| `npm run translate:file` | Translate single file | `npm run translate:file ko/agent.md` |
| `npm run translate:all` | Translate all Korean files | With options: `--force --concurrent 5` |
| `npm run dev` | Watch mode for auto-translation | Monitors `ko/**/*.md` |
| `npm run test` | Validate translation quality | Checks for issues |
| `npm run build` | Full build (translate all) | Production ready |

## 🔧 Configuration

### Environment Variables

Create `.env` file or set environment variables:

```bash
# OpenRouter API (Recommended)
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free

# Alternative models
# OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
# OPENROUTER_MODEL=google/gemma-2-9b-it:free
```

### Supported Models

#### Free Models (OpenRouter)
- `mistralai/mistral-7b-instruct:free` ⭐ Recommended
- `meta-llama/llama-3.1-8b-instruct:free`
- `google/gemma-2-9b-it:free`

#### Paid Models (Higher Quality)
- `openai/gpt-4-turbo`
- `anthropic/claude-3.5-sonnet`
- `mistralai/mistral-large`

## 🎯 Features

### AI Translation (OpenRouter)
- ✅ Context-aware technical translation
- ✅ Preserves YAML structure and code blocks
- ✅ Consistent terminology
- ✅ Natural, professional English
- ✅ Free tier available

### Smart Processing
- 🔄 YAML block detection and translation
- 📝 Markdown structure preservation
- 🔗 Link and image handling
- 📊 Translation validation
- ⏱️ Rate limiting and error handling

### Development Tools
- 👀 File watching for automatic translation
- 📈 Progress tracking and statistics
- 🔍 Quality validation and issue detection
- 📋 Detailed logging and error reporting

## 📖 Usage Examples

### Single File Translation
```bash
# Basic translation
npm run translate:file ko/agent.md

# Force retranslation
npm run translate:file ko/agent.md -- --force

# Verbose output
npm run translate:file ko/agent.md -- --verbose
```

### Batch Translation
```bash
# All files
npm run translate:all

# Force retranslation
npm run translate:all -- --force

# Custom concurrency
npm run translate:all -- --concurrent 5

# Custom pattern
npm run translate:all -- --pattern "ko/guides/*.md"
```

### Development Workflow
```bash
# Start watching for changes
npm run dev

# In another terminal, edit Korean files
echo "New content" >> ko/agent.md

# Translation happens automatically!
```

### Quality Assurance
```bash
# Validate all translations
npm run test

# Detailed validation report
npm run test -- --verbose
```

## 🏗️ Architecture

```
.
├── package.json                    # Main package configuration
├── .env                           # Environment variables (local)
├── .github/
│   ├── scripts/
│   │   ├── translate-simple.js    # Core translation engine
│   │   ├── package.json          # Script dependencies
│   │   └── scripts/
│   │       ├── translate-file.js  # Single file translation
│   │       ├── translate-all.js   # Batch translation
│   │       ├── translate-watch.js # File watcher
│   │       ├── validate-translations.js # Quality validation
│   │       └── setup.js          # Initial setup
│   └── workflows/
│       └── translate-ko2en.yml    # GitHub Actions workflow
├── ko/                           # Korean documentation
│   ├── agent.md
│   └── ...
└── en/                           # English documentation (generated)
    ├── agent.md
    └── ...
```

## 🤖 GitHub Actions

Automatic translation on push to `main` branch:

1. **Setup Repository Secret**: Add `OPENROUTER_API_KEY` in repository settings
2. **Push Changes**: Any changes to `ko/**/*.md` trigger translation
3. **Auto Commit**: Translated files are automatically committed back

## 🔍 Translation Quality

### Before (Google Translate)
```yaml
system_prompt: |
  You are a legal expert specializing in the following areas:
  -Conalization and review of contracts  # ❌ Typo
  -Recision compliance evaluation        # ❌ Wrong term
```

### After (AI Translation)
```yaml
system_prompt: |
  You are a legal expert specializing in the following areas:
  - Contract analysis and review         # ✅ Correct
  - Regulatory compliance evaluation     # ✅ Accurate
```

## 🛠️ Troubleshooting

### Common Issues

**Translation not working?**
```bash
# Check API key
echo $OPENROUTER_API_KEY

# Check fallback
which trans

# Test single file
npm run translate:file ko/README.md -- --verbose
```

**Quality issues?**
```bash
# Run validation
npm run test -- --verbose

# Try different model
export OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct:free"
```

**Performance issues?**
```bash
# Reduce concurrency
npm run translate:all -- --concurrent 1

# Check rate limits
# OpenRouter free tier: 20 requests/minute
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Test your changes: `npm run test`
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by SowonAI**
