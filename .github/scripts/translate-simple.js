const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (error) {
  // dotenv is optional, continue without it
}

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

// OpenRouter API를 사용한 파일 단위 AI 번역
async function translateFileWithOpenRouter(content, fromLang = 'Korean', toLang = 'English', filePath = '') {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY not found, falling back to line-by-line translation');
      return null; // 라인별 번역으로 폴백
    }

    // SUMMARY.md 파일에 대한 특별한 처리
    const isSummaryFile = filePath.includes('SUMMARY.md');
    
    let prompt;
    if (isSummaryFile) {
      prompt = `Translate this GitBook table of contents from ${fromLang} to ${toLang}.

CRITICAL RULES FOR TABLE OF CONTENTS:
1. This is ONLY a navigation menu - translate ONLY the display text
2. Keep ALL markdown formatting exactly the same (*, [text](link), ***)
3. Do NOT add any content, examples, or code blocks
4. Do NOT expand or explain entries
5. Translate only the text inside [ ] brackets
6. Keep all file paths and links unchanged
7. Preserve the exact structure and spacing

Document to translate:

${content}

Provide ONLY the translated table of contents without any additional content:`;
    } else {
      prompt = `Translate the entire markdown document from ${fromLang} to ${toLang}.

IMPORTANT RULES:
1. This is technical documentation about AI agents and workflows
2. Preserve ALL markdown formatting (headers, links, code blocks, etc.)
3. Keep YAML code blocks intact but translate Korean text within them
4. Maintain technical terminology consistency
5. Keep the same document structure and hierarchy
6. Translate Korean text in YAML system_prompt, name, description fields
7. Do NOT translate: URLs, code syntax, technical identifiers, file paths

Document to translate:

${content}

Provide ONLY the translated document without any explanations or additional text:`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/sowonai/sowonflow-docs',
        'X-Title': 'SowonFlow Documentation Translation'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a professional technical translator specializing in AI and software documentation. Translate the entire document while preserving all markdown formatting and technical accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 8000, // 더 긴 문서 처리를 위해 증가
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.log('API response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        errorDetails: data.error || 'No error field'
      });
      throw new Error(`Invalid response format from OpenRouter API`);
    }

    const translation = data.choices[0].message.content.trim();
    return translation;
    
  } catch (error) {
    console.warn(`OpenRouter file translation warning: ${error.message}`);
    return null; // 라인별 번역으로 폴백
  }
}

// OpenRouter API를 사용한 AI 번역 (무료 모델 사용)
async function translateWithOpenRouter(text, fromLang = 'Korean', toLang = 'English') {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY not found, falling back to Google Translate');
      return translateWithGoogle(text);
    }

    const prompt = `Translate the following ${fromLang} text to ${toLang}. 
This is technical documentation about AI agents and workflows.

Guidelines:
- Maintain technical accuracy and use proper technical terminology
- Keep the same tone, style, and formatting
- For YAML/code-related terms, use standard English conventions
- Preserve any special formatting or structure
- Make the translation natural and professional

Text to translate: "${text}"

Provide only the translation without any explanation:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/sowonai/sowonflow-docs',
        'X-Title': 'SowonFlow Documentation Translation'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free', // 기본값: 무료 Mistral 모델
        messages: [
          {
            role: 'system',
            content: 'You are a professional technical translator specializing in AI and software documentation. Provide accurate, natural translations while preserving technical terminology and formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const translation = data.choices[0].message.content.trim();
    
    // 따옴표 제거 (AI가 번역을 따옴표로 감쌀 수 있음)
    return translation.replace(/^["']|["']$/g, '');
    
  } catch (error) {
    console.warn(`OpenRouter translation warning: ${error.message}`);
    return translateWithGoogle(text); // AI 번역 실패시 구글 번역으로 폴백
  }
}

// Google Translate CLI를 사용한 폴백 번역
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

// 파일 번역 및 저장 (파일 단위 AI 번역 우선, 라인별 번역 폴백)
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

    // 먼저 파일 단위 AI 번역 시도
    console.log(`🤖 Attempting AI file-level translation...`);
    const aiTranslation = await translateFileWithOpenRouter(koContent, 'Korean', 'English', relativePath);
    
    if (aiTranslation) {
      // AI 번역 성공 - 후처리 적용
      const processedTranslation = postProcessTranslation(aiTranslation, koContent);
      
      // 영어 파일 저장
      fs.writeFileSync(absoluteEnPath, processedTranslation, 'utf8');
      console.log(`✅ AI translation completed: ${relativePath} -> ${enFilePath}`);
      console.log(`📊 Original: ${koContent.length} chars → Translated: ${processedTranslation.length} chars`);
      return;
    }

    // AI 번역 실패 - 라인별 번역으로 폴백
    console.log(`⚠️  AI translation failed, falling back to line-by-line translation...`);
    await translateFileLineByLine(koFilePath, koContent, absoluteEnPath, relativePath, enFilePath);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    // 에러가 발생해도 다른 파일 번역은 계속 진행
  }
}

// 라인별 번역 (기존 로직)
async function translateFileLineByLine(koFilePath, koContent, absoluteEnPath, relativePath, enFilePath) {
  console.log(`📝 Using line-by-line translation for: ${koFilePath}`);
  
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
              let translated = await translateWithOpenRouter(cleanValue);
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
              await new Promise(resolve => setTimeout(resolve, 1000)); // 요청 제한 방지
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
          let translated = await translateWithOpenRouter(content);
          translated = postProcessTranslation(translated, content);
          translatedLines.push(indent + translated);
          console.log(`  ✓ YAML multiline: "${content.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 요청 제한 방지
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
        let translated = await translateWithOpenRouter(line);
        
        // 후처리: 번역 품질 개선
        translated = postProcessTranslation(translated, line);
        
        translatedLines.push(translated);
        console.log(`  ✓ "${line.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
      } catch (error) {
        console.warn(`  ⚠️  Translation failed for: "${line.substring(0, 30)}..."`);
        translatedLines.push(line); // 원문 유지
      }
      
      // API 레이트 리밋 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      translatedLines.push(line);
    }
  }
  
  const translatedContent = translatedLines.join('\n');
  
  // 영어 파일 저장
  fs.writeFileSync(absoluteEnPath, translatedContent, 'utf8');
  console.log(`✅ Line-by-line translation completed: ${relativePath} -> ${enFilePath}`);
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
  
  // API 키 및 도구 확인
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    console.log('✅ OpenRouter API key found - using AI translation');
  } else {
    console.log('⚠️  OpenRouter API key not found - will use Google Translate as fallback');
    
    // trans CLI 도구 설치 확인 (폴백용)
    try {
      execSync('which trans', { encoding: 'utf8' });
      console.log('✅ translate-shell (trans) is available for fallback');
    } catch (error) {
      console.error('❌ Neither OpenRouter API key nor translate-shell is available.');
      console.error('Please set OPENROUTER_API_KEY environment variable or install translate-shell.');
      process.exit(1);
    }
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
