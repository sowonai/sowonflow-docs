const fs = require('fs');
const path = require('path');

// GitHub Models API를 사용한 번역 함수
async function translateWithGitHubModels(text, fromLang = 'ko', toLang = 'en') {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  // GitHub Models API 엔드포인트
  const apiUrl = 'https://models.inference.ai.azure.com/chat/completions';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // GitHub Models에서 제공하는 무료 모델
      messages: [
        {
          role: 'system',
          content: `You are a professional technical translator specializing in software documentation. 
Translate the following markdown content from Korean to English while preserving:

1. All markdown formatting (headers, links, code blocks, tables, etc.)
2. YAML frontmatter and code syntax exactly as written
3. Technical terminology accuracy using industry-standard terms
4. GitBook structure and navigation elements
5. File paths, URLs, and references unchanged
6. Code examples and configuration snippets untranslated

Guidelines:
- Maintain the same professional tone and technical depth
- Use clear, concise English suitable for technical documentation
- Preserve the document structure and hierarchy
- Keep the same level of detail and explanation depth
- For SowonFlow-specific terms, maintain consistency with established terminology`
        },
        {
          role: 'user',
          content: `Please translate this Korean technical documentation to English:\n\n${text}`
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub Models API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// OpenAI API 백업 (기존 코드와 동일)
async function translateWithOpenAI(text, fromLang = 'ko', toLang = 'en') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional technical translator. Translate the following markdown content from Korean to English while preserving all formatting and technical accuracy.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Google Translate CLI 백업
function translateWithGoogle(text) {
  const { execSync } = require('child_process');
  try {
    const command = `echo "${text.replace(/"/g, '\\"')}" | trans -brief ko:en`;
    const result = execSync(command, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    throw new Error(`Google Translate failed: ${error.message}`);
  }
}

// 파일 번역 및 저장
async function translateFile(koFilePath) {
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
    
    let translatedContent;
    
    // 번역 우선순위: GitHub Models > OpenAI > Google Translate
    try {
      console.log('🤖 Using GitHub Models...');
      translatedContent = await translateWithGitHubModels(koContent);
    } catch (error) {
      console.log(`⚠️  GitHub Models failed: ${error.message}`);
      
      if (process.env.OPENAI_API_KEY) {
        try {
          console.log('🔄 Trying OpenAI...');
          translatedContent = await translateWithOpenAI(koContent);
        } catch (openaiError) {
          console.log(`⚠️  OpenAI failed: ${openaiError.message}`);
          throw new Error('All AI translation services failed');
        }
      } else {
        throw new Error('No backup translation service available');
      }
    }
    
    // 영어 파일 저장
    fs.writeFileSync(enFilePath, translatedContent, 'utf8');
    console.log(`✅ Translated: ${koFilePath} -> ${enFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    
    // 에러가 발생해도 Google Translate로 기본 번역 시도
    try {
      console.log('🔄 Attempting basic translation with Google Translate...');
      const koContent = fs.readFileSync(koFilePath, 'utf8');
      const enFilePath = koFilePath.replace(/^ko\//, 'en/');
      
      // 간단한 섹션별 번역
      const sections = koContent.split('\n\n');
      const translatedSections = [];
      
      for (const section of sections) {
        if (section.trim() && !section.includes('```') && !section.startsWith('---')) {
          try {
            const translated = translateWithGoogle(section);
            translatedSections.push(translated);
          } catch {
            translatedSections.push(section); // 번역 실패시 원문 유지
          }
        } else {
          translatedSections.push(section);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // 레이트 리밋 방지
      }
      
      const fallbackContent = translatedSections.join('\n\n');
      fs.writeFileSync(enFilePath, fallbackContent, 'utf8');
      console.log(`⚠️  Basic translation completed: ${enFilePath}`);
      
    } catch (fallbackError) {
      console.error(`💥 All translation methods failed for ${koFilePath}`);
      // 프로세스는 계속 진행 (다른 파일들을 위해)
    }
  }
}

// 메인 실행 함수
async function main() {
  const changedFiles = process.argv[2];
  
  if (!changedFiles) {
    console.log('ℹ️  No changed files specified');
    return;
  }
  
  // 변경된 파일 목록 파싱
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`🎯 Found ${files.length} changed Korean files:`);
  files.forEach(file => console.log(`  📄 ${file}`));
  console.log('');
  
  // 각 파일 번역
  for (const file of files) {
    await translateFile(file);
    // API 레이트 리밋 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(''); // 빈 줄로 구분
  }
  
  console.log('🎉 Translation process completed!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { translateFile, translateWithGitHubModels, translateWithOpenAI };
