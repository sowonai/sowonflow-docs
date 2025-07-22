const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Google Translate CLI를 사용한 간단한 번역
function translateWithGoogle(text, fromLang = 'ko', toLang = 'en') {
  try {
    // trans CLI 도구 사용 (https://github.com/soimort/translate-shell)
    // 특수문자 및 따옴표 이스케이프 처리
    const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
    const command = `echo '${escapedText}' | trans -brief ${fromLang}:${toLang}`;
    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    return result.trim();
  } catch (error) {
    console.warn(`Google Translate warning: ${error.message}`);
    return text; // 번역 실패시 원문 반환
  }
}

// 파일 번역 및 저장 (Google Translate 버전)
async function translateFileSimple(koFilePath) {
  try {
    console.log(`📝 Translating: ${koFilePath}`);
    
    // 한국어 파일 읽기
    const koContent = fs.readFileSync(koFilePath, 'utf8');
    
    // 영어 파일 경로 계산
    const enFilePath = koFilePath.replace(/^ko\//, 'en/');
    const enDir = path.dirname(enFilePath);
    
    // 영어 디렉토리가 없으면 생성
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }
    
    // 마크다운 파일을 라인별로 처리
    const lines = koContent.split('\n');
    const translatedLines = [];
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 코드 블록 감지
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        translatedLines.push(line);
        continue;
      }
      
      // 번역하지 않을 라인들
      if (inCodeBlock || 
          line.trim() === '' ||
          line.startsWith('---') ||
          line.trim().startsWith('http') ||
          line.trim().startsWith('![') ||
          line.includes('](')) {
        translatedLines.push(line);
        continue;
      }
      
      // 헤더나 일반 텍스트 번역
      if (line.trim().length > 0) {
        try {
          const translated = translateWithGoogle(line);
          translatedLines.push(translated);
          console.log(`  ✓ "${line.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
        } catch (error) {
          console.warn(`  ⚠️  Translation failed for: "${line.substring(0, 30)}..."`);
          translatedLines.push(line); // 원문 유지
        }
        
        // API 레이트 리밋 방지
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        translatedLines.push(line);
      }
    }
    
    const translatedContent = translatedLines.join('\n');
    
    // 영어 파일 저장
    fs.writeFileSync(enFilePath, translatedContent, 'utf8');
    console.log(`✅ Translation completed: ${koFilePath} -> ${enFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    // 에러가 발생해도 다른 파일 번역은 계속 진행
  }
}

// 메인 실행 함수
async function main() {
  const changedFiles = process.argv[2];
  
  if (!changedFiles) {
    console.log('No changed files specified');
    return;
  }
  
  // trans CLI 도구 설치 확인
  try {
    execSync('which trans', { encoding: 'utf8' });
  } catch (error) {
    console.error('translate-shell (trans) is not installed. Please install it first.');
    process.exit(1);
  }
  
  // 변경된 파일 목록 파싱
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`Found ${files.length} changed Korean files:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  // 각 파일 번역
  for (const file of files) {
    await translateFileSimple(file);
  }
  
  console.log('🎉 All translations completed!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { translateFileSimple };
