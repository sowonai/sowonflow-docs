const fs = require('fs');
const path = require('path');

// GitHub Models API를 사용한 고품질 번역
async function translateWithGitHubModels(text) {
  try {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional technical translator. Translate Korean technical documentation to English while:
1. Preserving ALL markdown formatting exactly
2. Keeping brand names like "SowonFlow" unchanged
3. Maintaining proper title capitalization
4. Using natural, professional English
5. Preserving bullet points and code blocks
6. Keeping technical terms accurate`
          },
          {
            role: 'user',
            content: `Translate this Korean markdown to English:\n\n${text}`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub Models API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GitHub Models translation failed:', error.message);
    throw error;
  }
}

// 고품질 파일 번역
async function translateFileAdvanced(koFilePath) {
  try {
    console.log(`🚀 Translating with AI: ${koFilePath}`);
    
    const absoluteKoPath = path.isAbsolute(koFilePath) ? koFilePath : path.resolve(process.cwd(), koFilePath);
    
    if (!fs.existsSync(absoluteKoPath)) {
      console.error(`❌ File not found: ${absoluteKoPath}`);
      return;
    }
    
    const koContent = fs.readFileSync(absoluteKoPath, 'utf8');
    const relativePath = path.relative(process.cwd(), absoluteKoPath);
    const enFilePath = relativePath.replace(/^ko\//, 'en/');
    const absoluteEnPath = path.resolve(process.cwd(), enFilePath);
    const enDir = path.dirname(absoluteEnPath);
    
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }
    
    // AI 번역 수행
    const translatedContent = await translateWithGitHubModels(koContent);
    
    fs.writeFileSync(absoluteEnPath, translatedContent, 'utf8');
    console.log(`✅ High-quality translation completed: ${relativePath} -> ${enFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error in advanced translation for ${koFilePath}:`, error.message);
    // 실패시 기존 Google Translate 방식으로 폴백할 수 있음
  }
}

// 메인 실행 함수
async function main() {
  const changedFiles = process.argv[2];
  
  if (!changedFiles) {
    console.log('No changed files specified');
    return;
  }
  
  // GitHub Token 확인
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not found. Using fallback translation method.');
    return;
  }
  
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`🎯 Translating ${files.length} files with GitHub Models:`);
  files.forEach(file => console.log(`  📄 ${file}`));
  
  for (const file of files) {
    await translateFileAdvanced(file);
    await new Promise(resolve => setTimeout(resolve, 2000)); // API 레이트 리밋 방지
  }
  
  console.log('🎉 Advanced translation completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { translateFileAdvanced, translateWithGitHubModels };
