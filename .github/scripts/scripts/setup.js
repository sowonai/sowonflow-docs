#!/usr/bin/env node

// Load environment variables
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
} catch (error) {
  // dotenv is optional, continue without it
}

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function setup() {
  console.log(chalk.blue('🚀 SowonFlow Docs Translation Setup'));
  console.log(chalk.gray('This will help you configure the translation environment.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasOpenRouter',
      message: 'Do you have an OpenRouter API key?',
      default: false
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your OpenRouter API key:',
      when: (answers) => answers.hasOpenRouter,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API key is required';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'model',
      message: 'Choose a translation model:',
      when: (answers) => answers.hasOpenRouter,
      choices: [
        {
          name: 'Mistral 7B Instruct (Free) - Recommended',
          value: 'mistralai/mistral-7b-instruct:free'
        },
        {
          name: 'Meta Llama 3.1 8B (Free)',
          value: 'meta-llama/llama-3.1-8b-instruct:free'
        },
        {
          name: 'Google Gemma 2 9B (Free)',
          value: 'google/gemma-2-9b-it:free'
        },
        {
          name: 'OpenAI GPT-4 Turbo (Paid)',
          value: 'openai/gpt-4-turbo'
        },
        {
          name: 'Anthropic Claude 3.5 Sonnet (Paid)',
          value: 'anthropic/claude-3.5-sonnet'
        }
      ],
      default: 'mistralai/mistral-7b-instruct:free'
    },
    {
      type: 'confirm',
      name: 'installGoogleTranslate',
      message: 'Install Google Translate CLI as fallback?',
      default: true
    },
    {
      type: 'confirm',
      name: 'createEnvFile',
      message: 'Create .env file for local development?',
      default: true
    }
  ]);

  console.log(chalk.blue('\n⚙️  Setting up environment...\n'));

  // .env 파일 생성
  if (answers.createEnvFile) {
    const envPath = path.resolve(__dirname, '../../../.env');
    let envContent = '# SowonFlow Docs Translation Environment\n\n';
    
    if (answers.hasOpenRouter) {
      envContent += `OPENROUTER_API_KEY=${answers.apiKey}\n`;
      envContent += `OPENROUTER_MODEL=${answers.model}\n`;
    } else {
      envContent += '# OPENROUTER_API_KEY=your_api_key_here\n';
      envContent += '# OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free\n';
    }
    
    envContent += '\n# GitHub Actions will use repository secrets instead\n';
    
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green('✅ Created .env file'));
  }

  // Google Translate 설치 안내
  if (answers.installGoogleTranslate) {
    console.log(chalk.yellow('📦 To install Google Translate CLI:'));
    console.log(chalk.gray('  macOS: brew install translate-shell'));
    console.log(chalk.gray('  Ubuntu: sudo apt-get install translate-shell'));
    console.log(chalk.gray('  Other: https://github.com/soimort/translate-shell\n'));
  }

  // 사용법 안내
  console.log(chalk.blue('📖 Usage examples:'));
  console.log(chalk.gray('  npm run translate:file ko/agent.md     # Translate single file'));
  console.log(chalk.gray('  npm run translate:all                 # Translate all files'));
  console.log(chalk.gray('  npm run dev                          # Watch mode'));
  console.log(chalk.gray('  npm run test                         # Validate translations'));

  // OpenRouter 사용법
  if (answers.hasOpenRouter) {
    console.log(chalk.green('\n🎉 OpenRouter AI translation is ready!'));
    console.log(chalk.gray(`Model: ${answers.model}`));
  } else {
    console.log(chalk.yellow('\n⚠️  Google Translate fallback will be used'));
    console.log(chalk.gray('For better quality, get an OpenRouter API key at https://openrouter.ai'));
  }

  // GitHub Actions 설정 안내
  console.log(chalk.blue('\n🔧 GitHub Actions setup:'));
  console.log(chalk.gray('1. Go to repository Settings → Secrets and variables → Actions'));
  console.log(chalk.gray('2. Add repository secret: OPENROUTER_API_KEY'));
  console.log(chalk.gray('3. Push changes to trigger automatic translation'));

  console.log(chalk.green('\n✨ Setup completed!'));
}

setup().catch(error => {
  console.error(chalk.red(`Setup failed: ${error.message}`));
  process.exit(1);
});
