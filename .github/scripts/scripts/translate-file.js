#!/usr/bin/env node

// Load environment variables
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
} catch (error) {
  // dotenv is optional, continue without it
}

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const { translateFileSimple } = require('../translate-simple.js');

program
  .name('translate-file')
  .description('Translate a single Korean markdown file to English')
  .argument('<file>', 'Korean markdown file to translate (e.g., ko/agent.md)')
  .option('-f, --force', 'Force retranslation even if English file exists')
  .option('-v, --verbose', 'Show detailed translation progress')
  .action(async (filePath, options) => {
    try {
      // 파일 경로 검증
      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        console.error(chalk.red(`❌ File not found: ${filePath}`));
        process.exit(1);
      }

      if (!filePath.startsWith('ko/') || !filePath.endsWith('.md')) {
        console.error(chalk.red('❌ Please provide a Korean markdown file (ko/*.md)'));
        process.exit(1);
      }

      // 영어 파일 존재 확인
      const enFilePath = filePath.replace(/^ko\//, 'en/');
      const enAbsolutePath = path.resolve(process.cwd(), enFilePath);
      
      if (fs.existsSync(enAbsolutePath) && !options.force) {
        console.log(chalk.yellow(`⚠️  English file already exists: ${enFilePath}`));
        console.log(chalk.gray('Use --force to retranslate'));
        process.exit(0);
      }

      // API 키 확인
      if (!process.env.OPENROUTER_API_KEY) {
        console.log(chalk.yellow('⚠️  OPENROUTER_API_KEY not set. Using Google Translate as fallback.'));
      }

      const spinner = ora(`Translating ${chalk.blue(filePath)}`).start();
      
      try {
        await translateFileSimple(filePath);
        spinner.succeed(chalk.green(`✅ Translation completed: ${chalk.blue(enFilePath)}`));
        
        // 파일 크기 정보
        const koSize = fs.statSync(absolutePath).size;
        const enSize = fs.statSync(enAbsolutePath).size;
        console.log(chalk.gray(`📊 Korean: ${koSize} bytes → English: ${enSize} bytes`));
        
      } catch (error) {
        spinner.fail(chalk.red(`❌ Translation failed: ${error.message}`));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red(`Fatal error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
