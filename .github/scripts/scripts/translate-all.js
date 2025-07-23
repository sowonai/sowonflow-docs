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
const { glob } = require('glob');
const { translateFileSimple } = require('../translate-simple.js');

program
  .name('translate-all')
  .description('Translate all Korean markdown files to English')
  .option('-f, --force', 'Force retranslation even if English files exist')
  .option('-p, --pattern <pattern>', 'File pattern to match', 'ko/**/*.md')
  .option('-c, --concurrent <number>', 'Number of concurrent translations', '3')
  .option('-v, --verbose', 'Show detailed progress')
  .action(async (options) => {
    try {
      const rootDir = path.resolve(__dirname, '../../../');
      process.chdir(rootDir);

      console.log(chalk.blue('🔍 Finding Korean markdown files...'));
      
      // 한국어 파일 목록 찾기
      const koFiles = await glob(options.pattern, {
        cwd: rootDir,
        absolute: false
      });

      if (koFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No Korean files found'));
        return;
      }

      console.log(chalk.green(`📚 Found ${koFiles.length} Korean files:`));
      
      // 번역이 필요한 파일 필터링
      const filesToTranslate = [];
      for (const koFile of koFiles) {
        const enFile = koFile.replace(/^ko\//, 'en/');
        const enExists = fs.existsSync(enFile);
        
        if (!enExists || options.force) {
          filesToTranslate.push(koFile);
          console.log(chalk.gray(`  + ${koFile} ${enExists ? '(will overwrite)' : '(new)'}`));
        } else {
          console.log(chalk.gray(`  - ${koFile} (skipped - exists)`));
        }
      }

      if (filesToTranslate.length === 0) {
        console.log(chalk.yellow('✅ All files are already translated. Use --force to retranslate.'));
        return;
      }

      // API 키 확인
      if (!process.env.OPENROUTER_API_KEY) {
        console.log(chalk.yellow('⚠️  OPENROUTER_API_KEY not set. Using Google Translate as fallback.'));
      }

      const concurrent = Math.max(1, Math.min(10, parseInt(options.concurrent)));
      console.log(chalk.blue(`🚀 Starting translation of ${filesToTranslate.length} files (${concurrent} concurrent)...`));

      const spinner = ora('Translating files...').start();
      let completed = 0;
      let failed = 0;

      // 배치별로 번역 처리
      for (let i = 0; i < filesToTranslate.length; i += concurrent) {
        const batch = filesToTranslate.slice(i, i + concurrent);
        
        const promises = batch.map(async (file) => {
          try {
            await translateFileSimple(file);
            completed++;
            spinner.text = `Translating... (${completed}/${filesToTranslate.length})`;
            return { file, success: true };
          } catch (error) {
            failed++;
            return { file, success: false, error: error.message };
          }
        });

        const results = await Promise.all(promises);
        
        if (options.verbose) {
          results.forEach(result => {
            if (result.success) {
              console.log(chalk.green(`  ✅ ${result.file}`));
            } else {
              console.log(chalk.red(`  ❌ ${result.file}: ${result.error}`));
            }
          });
        }
      }

      spinner.stop();
      
      // 결과 요약
      console.log(chalk.green(`\n🎉 Translation completed!`));
      console.log(chalk.gray(`  ✅ Success: ${completed} files`));
      if (failed > 0) {
        console.log(chalk.red(`  ❌ Failed: ${failed} files`));
      }

    } catch (error) {
      console.error(chalk.red(`Fatal error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
