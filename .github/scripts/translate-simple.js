const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (error) {
  // dotenv is optional, continue without it
}

// Post-process translation to improve quality
function postProcessTranslation(translated, original) {
  let result = translated;
  
  // 1. Preserve brand names
  result = result.replace(/SOWONFLOW/g, 'SowonFlow');
  result = result.replace(/sowonflow/g, 'SowonFlow');
  
  // 2. Capitalize titles
  if (original.startsWith('# ')) {
    result = result.replace(/^# [a-z]/, match => match.toUpperCase());
  }
  
  // 3. Restore markdown formatting
  result = result.replace(/\*\*\* ([^*]+) \*\*/g, '* **$1**');  // *** Text ** → * **Text**
  result = result.replace(/\\\s*"/g, '"');  // \" → "
  result = result.replace(/\\\s*'/g, "'");  // \' → '
  
  // 4. Common translation improvements
  result = result.replace(/The introduction of corporate AI/g, 'Corporate AI adoption');
  result = result.replace(/Lost ring/g, 'Missing Link');
  result = result.replace(/lost ring/g, 'missing link');
  
  // 5. Restore markdown list formatting
  result = result.replace(/^\s*\*\*\*\s*/gm, '* **');
  
  return result;
}

// File-level AI translation using OpenRouter API
async function translateFileWithOpenRouter(content, fromLang = 'Korean', toLang = 'English', filePath = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }

  // Special handling for SUMMARY.md files
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
      max_tokens: 8000, // Increased for longer documents
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
}

// AI translation using OpenRouter API
async function translateWithOpenRouter(text, fromLang = 'Korean', toLang = 'English') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
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
      model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free',
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
  
  // Remove quotes (AI might wrap translation in quotes)
  return translation.replace(/^["']|["']$/g, '');
}

// File translation and saving (file-level AI translation only)
async function translateFileSimple(koFilePath) {
  try {
    console.log(`📝 Translating: ${koFilePath}`);
    
    // Convert to absolute path (for GitHub Actions compatibility)
    const absoluteKoPath = path.isAbsolute(koFilePath) ? koFilePath : path.resolve(process.cwd(), koFilePath);
    
    // Check if file exists
    if (!fs.existsSync(absoluteKoPath)) {
      console.error(`❌ File not found: ${absoluteKoPath}`);
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Files in current directory:`, fs.readdirSync('.').slice(0, 10));
      return;
    }
    
    // Read Korean file
    const koContent = fs.readFileSync(absoluteKoPath, 'utf8');
    
    // Calculate English file path (based on absolute path)
    const relativePath = path.relative(process.cwd(), absoluteKoPath);
    const enFilePath = relativePath.replace(/^docs-ko\//, 'docs/');
    const absoluteEnPath = path.resolve(process.cwd(), enFilePath);
    const enDir = path.dirname(absoluteEnPath);
    
    // Create English directory if it doesn't exist
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }

    // First, attempt file-level AI translation
    console.log(`🤖 Attempting AI file-level translation...`);
    const aiTranslation = await translateFileWithOpenRouter(koContent, 'Korean', 'English', relativePath);
    
    if (!aiTranslation) {
      throw new Error('AI translation failed - no fallback available');
    }

    // AI translation successful - apply post-processing
    const processedTranslation = postProcessTranslation(aiTranslation, koContent);
    
    // Save English file
    fs.writeFileSync(absoluteEnPath, processedTranslation, 'utf8');
    console.log(`✅ AI translation completed: ${relativePath} -> ${enFilePath}`);
    console.log(`📊 Original: ${koContent.length} chars → Translated: ${processedTranslation.length} chars`);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    throw error; // Re-throw to stop execution on translation failure
  }
}

// Main execution function
async function main() {
  const specifiedFile = process.argv[2];
  
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Script arguments:`, process.argv);
  
  // Check API key
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.error('❌ OpenRouter API key not found.');
    console.error('Please set OPENROUTER_API_KEY environment variable in .env file.');
    process.exit(1);
  }
  
  console.log('✅ OpenRouter API key found - using AI translation');
  
  let files = [];
  
  if (specifiedFile) {
    // Single file specified
    files = [specifiedFile];
    console.log(`Found 1 specified Korean file:`);
  } else {
    // No file specified - translate all files in docs-ko
    console.log('No specific file provided, translating all files in docs-ko/');
    try {
      files = getAllMarkdownFiles('docs-ko');
      console.log(`Found ${files.length} Korean files to translate:`);
    } catch (error) {
      console.error('Error finding files:', error.message);
      return;
    }
  }
  
  for (const file of files) {
    const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    console.log(`  - ${file}`);
    console.log(`    → Absolute path: ${absolutePath} (exists: ${fs.existsSync(absolutePath)})`);
  }
  
  // Translate each file
  for (const file of files) {
    await translateFileSimple(file);
  }
  
  console.log('🎉 All translations completed!');
}

// Helper function to get all markdown files recursively
function getAllMarkdownFiles(dir) {
  const files = [];
  
  function scanDirectory(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
  
  return files;
}

// Execute script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { translateFileSimple };
