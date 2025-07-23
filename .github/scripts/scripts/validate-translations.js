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
const { glob } = require('glob');

program
  .name('validate-translations')
  .description('Validate translated English files for common issues')
  .option('-v, --verbose', 'Show detailed validation results')
  .action(async (options) => {
    try {
      const rootDir = path.resolve(__dirname, '../../../');
      process.chdir(rootDir);

      console.log(chalk.blue('🔍 Validating translations...'));
      
      // 영어 파일 목록 찾기
      const enFiles = await glob('en/**/*.md', {
        cwd: rootDir,
        absolute: false
      });

      if (enFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No English files found'));
        return;
      }

      let totalIssues = 0;
      const issueTypes = {
        koreanText: 0,
        brokenLinks: 0,
        malformedYaml: 0,
        emptyFiles: 0,
        missingFiles: 0
      };

      console.log(chalk.green(`📚 Validating ${enFiles.length} English files:\n`));

      for (const enFile of enFiles) {
        const koFile = enFile.replace(/^en\//, 'ko/');
        const issues = [];

        // 1. 한국어 파일 존재 확인
        if (!fs.existsSync(koFile)) {
          issues.push('Missing corresponding Korean file');
          issueTypes.missingFiles++;
        }

        // 2. 영어 파일 내용 검사
        if (fs.existsSync(enFile)) {
          const content = fs.readFileSync(enFile, 'utf8');
          
          // 빈 파일 확인
          if (content.trim().length === 0) {
            issues.push('Empty file');
            issueTypes.emptyFiles++;
          }

          // 한국어 텍스트 잔존 확인
          const koreanRegex = /[가-힣]/g;
          const koreanMatches = content.match(koreanRegex);
          if (koreanMatches && koreanMatches.length > 5) { // 5자 이상의 한국어가 있으면
            issues.push(`Contains ${koreanMatches.length} Korean characters`);
            issueTypes.koreanText++;
          }

          // YAML 블록 검사
          const yamlBlocks = content.match(/```yaml[\s\S]*?```/g);
          if (yamlBlocks) {
            yamlBlocks.forEach((block, index) => {
              // 간단한 YAML 구조 확인
              const lines = block.split('\n').slice(1, -1); // ```yaml과 ``` 제거
              let hasStructuralIssues = false;
              
              for (const line of lines) {
                if (line.trim() && !line.trim().startsWith('#') && !line.includes(':') && !line.startsWith(' ') && !line.startsWith('-')) {
                  // YAML 구조가 아닌 것 같은 라인
                  hasStructuralIssues = true;
                  break;
                }
              }
              
              if (hasStructuralIssues) {
                issues.push(`Malformed YAML block ${index + 1}`);
                issueTypes.malformedYaml++;
              }
            });
          }

          // 링크 확인 (간단한 검사)
          const brokenLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          let linkMatch;
          while ((linkMatch = brokenLinkRegex.exec(content)) !== null) {
            const linkText = linkMatch[1];
            const linkUrl = linkMatch[2];
            
            // 내부 링크 확인
            if (linkUrl.startsWith('./') || linkUrl.startsWith('../')) {
              const targetPath = path.resolve(path.dirname(enFile), linkUrl);
              if (!fs.existsSync(targetPath)) {
                issues.push(`Broken internal link: ${linkUrl}`);
                issueTypes.brokenLinks++;
              }
            }
          }
        }

        // 결과 출력
        if (issues.length > 0) {
          console.log(chalk.red(`❌ ${enFile}`));
          if (options.verbose) {
            issues.forEach(issue => {
              console.log(chalk.gray(`   - ${issue}`));
            });
            console.log();
          }
          totalIssues += issues.length;
        } else {
          if (options.verbose) {
            console.log(chalk.green(`✅ ${enFile}`));
          }
        }
      }

      // 결과 요약
      console.log(chalk.blue('\n📊 Validation Summary:'));
      console.log(chalk.gray(`  Total files: ${enFiles.length}`));
      console.log(chalk.gray(`  Total issues: ${totalIssues}`));
      
      if (totalIssues > 0) {
        console.log(chalk.red('\n🔍 Issue breakdown:'));
        if (issueTypes.koreanText > 0) console.log(chalk.yellow(`  - Korean text remaining: ${issueTypes.koreanText} files`));
        if (issueTypes.brokenLinks > 0) console.log(chalk.yellow(`  - Broken links: ${issueTypes.brokenLinks} files`));
        if (issueTypes.malformedYaml > 0) console.log(chalk.yellow(`  - Malformed YAML: ${issueTypes.malformedYaml} files`));
        if (issueTypes.emptyFiles > 0) console.log(chalk.yellow(`  - Empty files: ${issueTypes.emptyFiles} files`));
        if (issueTypes.missingFiles > 0) console.log(chalk.yellow(`  - Missing Korean files: ${issueTypes.missingFiles} files`));
      } else {
        console.log(chalk.green('\n🎉 All translations look good!'));
      }

    } catch (error) {
      console.error(chalk.red(`Fatal error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
