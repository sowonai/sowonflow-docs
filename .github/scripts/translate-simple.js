const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 번역 후처리 함수 - 품질 개선
function postProcessTranslation(translated, original) {
  let result = translated;
  
  // 1. 브랜드명 보존
  result = result.replace(/SOWONFLOW/g, 'SowonFlow');
  result = result.replace(/sowonflow/g, 'SowonFlow');
  
  // 2. 제목 대문자화
  if (original.startsWith('# ')) {
    result = result.replace(/^# [a-z]/, match => match.toUpperCase());
  }
  
  // 3. 마크다운 포맷 복원
  result = result.replace(/\*\*\* ([^*]+) \*\*/g, '* **$1**');  // *** Text ** → * **Text**
  result = result.replace(/\\\s*"/g, '"');  // \" → "
  result = result.replace(/\\\s*'/g, "'");  // \' → '
  
  // 4. 일반적인 번역 개선
  result = result.replace(/The introduction of corporate AI/g, 'Corporate AI adoption');
  result = result.replace(/Lost ring/g, 'Missing Link');
  result = result.replace(/lost ring/g, 'missing link');
  
  // 5. 마크다운 리스트 포맷 복원
  result = result.replace(/^\s*\*\*\*\s*/gm, '* **');
  
  return result;
}

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
    
    // 절대 경로로 변환 (GitHub Actions 대응)
    const absoluteKoPath = path.isAbsolute(koFilePath) ? koFilePath : path.resolve(process.cwd(), koFilePath);
    
    // 파일 존재 확인
    if (!fs.existsSync(absoluteKoPath)) {
      console.error(`❌ File not found: ${absoluteKoPath}`);
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Files in current directory:`, fs.readdirSync('.').slice(0, 10));
      return;
    }
    
    // 한국어 파일 읽기
    const koContent = fs.readFileSync(absoluteKoPath, 'utf8');
    
    // 영어 파일 경로 계산 (절대 경로 기준)
    const relativePath = path.relative(process.cwd(), absoluteKoPath);
    const enFilePath = relativePath.replace(/^ko\//, 'en/');
    const absoluteEnPath = path.resolve(process.cwd(), enFilePath);
    const enDir = path.dirname(absoluteEnPath);
    
    // 영어 디렉토리가 없으면 생성
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }
    
    // 마크다운 파일을 라인별로 처리
    const lines = koContent.split('\n');
    const translatedLines = [];
    let inCodeBlock = false;
    let inYamlBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 코드 블록 감지
      if (line.trim().startsWith('```')) {
        if (line.includes('yaml')) {
          inYamlBlock = !inYamlBlock;
        } else {
          inCodeBlock = !inCodeBlock;
        }
        translatedLines.push(line);
        continue;
      }
      
      // YAML 블록 내부에서 한국어 텍스트 번역
      if (inYamlBlock) {
        // YAML 내부의 문자열 값만 번역 (키는 번역하지 않음)
        if (line.includes(':') && !line.trim().startsWith('#')) {
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex + 1);
          const value = line.substring(colonIndex + 1).trim();
          
          // 값이 한국어를 포함하고 있고, 파이프(|) 다음 라인이거나 따옴표로 감싸진 문자열인 경우
          if (value && value !== '|' && !/^[a-zA-Z0-9_\-\.\[\]"]+$/.test(value)) {
            try {
              // 따옴표 제거하고 번역
              let cleanValue = value.replace(/^["']|["']$/g, '');
              if (cleanValue.length > 0 && /[가-힣]/.test(cleanValue)) {
                let translated = translateWithGoogle(cleanValue);
                translated = postProcessTranslation(translated, cleanValue);
                
                // 원래 따옴표 형식 유지
                if (value.startsWith('"') && value.endsWith('"')) {
                  translated = `"${translated}"`;
                } else if (value.startsWith("'") && value.endsWith("'")) {
                  translated = `'${translated}'`;
                } else if (value.includes('|')) {
                  // 멀티라인 문자열은 그대로
                  translated = value;
                }
                
                translatedLines.push(key + ' ' + translated);
                console.log(`  ✓ YAML: "${cleanValue.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
                await new Promise(resolve => setTimeout(resolve, 300));
                continue;
              }
            } catch (error) {
              console.warn(`  ⚠️  YAML translation failed for: "${value}"`);
            }
          }
        }
        // YAML 멀티라인 문자열 (|, >, |- 등) 처리
        else if (line.trim() && !line.trim().startsWith('#') && !line.includes(':') && /[가-힣]/.test(line)) {
          try {
            const indent = line.match(/^\s*/)[0];
            const content = line.trim();
            let translated = translateWithGoogle(content);
            translated = postProcessTranslation(translated, content);
            translatedLines.push(indent + translated);
            console.log(`  ✓ YAML multiline: "${content.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
            await new Promise(resolve => setTimeout(resolve, 300));
            continue;
          } catch (error) {
            console.warn(`  ⚠️  YAML multiline translation failed for: "${line.trim()}"`);
          }
        }
        
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
          let translated = translateWithGoogle(line);
          
          // 후처리: 번역 품질 개선
          translated = postProcessTranslation(translated, line);
          
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
    fs.writeFileSync(absoluteEnPath, translatedContent, 'utf8');
    console.log(`✅ Translation completed: ${relativePath} -> ${enFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    // 에러가 발생해도 다른 파일 번역은 계속 진행
  }
}

// 메인 실행 함수
async function main() {
  const changedFiles = process.argv[2];
  
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Script arguments:`, process.argv);
  
  if (!changedFiles) {
    console.log('No changed files specified');
    return;
  }
  
  // trans CLI 도구 설치 확인
  try {
    execSync('which trans', { encoding: 'utf8' });
    console.log('✅ translate-shell (trans) is available');
  } catch (error) {
    console.error('❌ translate-shell (trans) is not installed. Please install it first.');
    process.exit(1);
  }
  
  // 변경된 파일 목록 파싱
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`Found ${files.length} changed Korean files:`);
  files.forEach(file => {
    console.log(`  - ${file}`);
    const absolutePath = path.resolve(process.cwd(), file);
    const exists = fs.existsSync(absolutePath);
    console.log(`    → Absolute path: ${absolutePath} (exists: ${exists})`);
  });
  
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
