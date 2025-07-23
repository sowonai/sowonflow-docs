#!/usr/bin/env node

// Load environment variables
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
} catch (error) {
  // dotenv is optional, continue without it
}

const chokidar = require('chokidar');
const path = require('path');
const chalk = require('chalk');
const { translateFileSimple } = require('../translate-simple.js');

console.log(chalk.blue('👀 Starting translation watcher...'));
console.log(chalk.gray('Watching ko/**/*.md for changes\n'));

// API 키 확인
if (!process.env.OPENROUTER_API_KEY) {
  console.log(chalk.yellow('⚠️  OPENROUTER_API_KEY not set. Using Google Translate as fallback.\n'));
}

const rootDir = path.resolve(__dirname, '../../../');
process.chdir(rootDir);

// 파일 감시 설정
const watcher = chokidar.watch('ko/**/*.md', {
  ignored: /(^|[\/\\])\../, // dot files 무시
  persistent: true,
  cwd: rootDir
});

let translationQueue = new Set();
let isTranslating = false;

// 번역 큐 처리
async function processQueue() {
  if (isTranslating || translationQueue.size === 0) {
    return;
  }

  isTranslating = true;
  const filesToTranslate = Array.from(translationQueue);
  translationQueue.clear();

  for (const file of filesToTranslate) {
    try {
      console.log(chalk.blue(`🔄 Translating: ${file}`));
      await translateFileSimple(file);
      console.log(chalk.green(`✅ Completed: ${file.replace('ko/', 'en/')}\n`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${file} - ${error.message}\n`));
    }
  }

  isTranslating = false;
  
  // 큐에 새로운 파일이 있으면 다시 처리
  if (translationQueue.size > 0) {
    setTimeout(processQueue, 1000);
  }
}

// 파일 변경 이벤트 핸들러
watcher
  .on('add', (file) => {
    console.log(chalk.cyan(`📁 File added: ${file}`));
    translationQueue.add(file);
    setTimeout(processQueue, 2000); // 2초 후 번역 시작
  })
  .on('change', (file) => {
    console.log(chalk.yellow(`📝 File changed: ${file}`));
    translationQueue.add(file);
    setTimeout(processQueue, 2000); // 2초 후 번역 시작
  })
  .on('unlink', (file) => {
    console.log(chalk.red(`🗑️  File removed: ${file}`));
    // 영어 파일도 삭제할지 물어볼 수 있지만, 일단은 로그만
    const enFile = file.replace('ko/', 'en/');
    console.log(chalk.gray(`   Consider removing: ${enFile}`));
  })
  .on('error', (error) => {
    console.error(chalk.red(`Watcher error: ${error}`));
  });

console.log(chalk.green('✅ Watcher is ready!'));
console.log(chalk.gray('Press Ctrl+C to stop'));

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log(chalk.blue('\n👋 Stopping watcher...'));
  watcher.close().then(() => {
    console.log(chalk.green('✅ Watcher stopped'));
    process.exit(0);
  });
});
