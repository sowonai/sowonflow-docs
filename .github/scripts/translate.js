const fs = require('fs');
const path = require('path');

// OpenAI API를 사용한 번역 함수
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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional technical translator. Translate the following markdown content from Korean to English while preserving:
1. All markdown formatting (headers, links, code blocks, etc.)
2. YAML frontmatter and code syntax
3. Technical terminology accuracy
4. GitBook structure and navigation
5. File paths and references

Maintain the same tone and technical depth. For technical terms, use industry-standard English equivalents.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Anthropic Claude API를 사용한 번역 함수 (대체 옵션)
async function translateWithClaude(text, fromLang = 'ko', toLang = 'en') {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Please translate the following Korean markdown content to English while preserving all formatting, code blocks, and technical accuracy:

${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 파일 번역 및 저장
async function translateFile(koFilePath) {
  try {
    console.log(`Translating: ${koFilePath}`);
    
    // 한국어 파일 읽기
    const koContent = fs.readFileSync(koFilePath, 'utf8');
    
    // 영어 파일 경로 계산
    const enFilePath = koFilePath.replace(/^ko\//, 'en/');
    const enDir = path.dirname(enFilePath);
    
    // 영어 디렉토리가 없으면 생성
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }
    
    // 번역 실행 (우선 OpenAI, 실패하면 Claude)
    let translatedContent;
    try {
      translatedContent = await translateWithOpenAI(koContent);
    } catch (error) {
      console.log(`OpenAI translation failed, trying Claude: ${error.message}`);
      try {
        translatedContent = await translateWithClaude(koContent);
      } catch (claudeError) {
        throw new Error(`Both translation services failed. OpenAI: ${error.message}, Claude: ${claudeError.message}`);
      }
    }
    
    // 영어 파일 저장
    fs.writeFileSync(enFilePath, translatedContent, 'utf8');
    console.log(`✅ Translated: ${koFilePath} -> ${enFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    process.exit(1);
  }
}

// 메인 실행 함수
async function main() {
  const changedFiles = process.argv[2];
  
  if (!changedFiles) {
    console.log('No changed files specified');
    return;
  }
  
  // 변경된 파일 목록 파싱
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`Found ${files.length} changed Korean files:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  // 각 파일 번역
  for (const file of files) {
    await translateFile(file);
    // API 레이트 리밋 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 All translations completed successfully!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { translateFile, translateWithOpenAI, translateWithClaude };
