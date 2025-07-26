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
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY not found, falling back to line-by-line translation');
      return null; // Fallback to line-by-line translation
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
    
  } catch (error) {
    console.warn(`OpenRouter file translation warning: ${error.message}`);
    return null; // Fallback to line-by-line translation
  }
}

// AI translation using OpenRouter API (free models)
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
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free', // Default: free Mistral model
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
    
  } catch (error) {
    console.warn(`OpenRouter translation warning: ${error.message}`);
    return translateWithGoogle(text); // Fallback to Google Translate on AI failure
  }
}

// Fallback translation using Google Translate CLI
function translateWithGoogle(text, fromLang = 'ko', toLang = 'en') {
  try {
    // Uses trans CLI tool (https://github.com/soimort/translate-shell)
    // Escape special characters and quotes
    const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
    const command = `echo '${escapedText}' | trans -brief ${fromLang}:${toLang}`;
    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    return result.trim();
  } catch (error) {
    console.warn(`Google Translate warning: ${error.message}`);
    return text; // Return original text on translation failure
  }
}

// File translation and saving (file-level AI translation first, line-by-line fallback)
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
    const enFilePath = relativePath.replace(/^ko\//, 'en/');
    const absoluteEnPath = path.resolve(process.cwd(), enFilePath);
    const enDir = path.dirname(absoluteEnPath);
    
    // Create English directory if it doesn't exist
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }

    // First, attempt file-level AI translation
    console.log(`🤖 Attempting AI file-level translation...`);
    const aiTranslation = await translateFileWithOpenRouter(koContent, 'Korean', 'English', relativePath);
    
    if (aiTranslation) {
      // AI translation successful - apply post-processing
      const processedTranslation = postProcessTranslation(aiTranslation, koContent);
      
      // Save English file
      fs.writeFileSync(absoluteEnPath, processedTranslation, 'utf8');
      console.log(`✅ AI translation completed: ${relativePath} -> ${enFilePath}`);
      console.log(`📊 Original: ${koContent.length} chars → Translated: ${processedTranslation.length} chars`);
      return;
    }

    // AI translation failed - fallback to line-by-line translation
    console.log(`⚠️  AI translation failed, falling back to line-by-line translation...`);
    await translateFileLineByLine(koFilePath, koContent, absoluteEnPath, relativePath, enFilePath);
    
  } catch (error) {
    console.error(`❌ Error translating ${koFilePath}:`, error.message);
    // Continue with other files even if error occurs
  }
}

// Line-by-line translation (existing logic)
async function translateFileLineByLine(koFilePath, koContent, absoluteEnPath, relativePath, enFilePath) {
  console.log(`📝 Using line-by-line translation for: ${koFilePath}`);
  
  // Process markdown file line by line
  const lines = koContent.split('\n');
  const translatedLines = [];
  let inCodeBlock = false;
  let inYamlBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect code blocks
    if (line.trim().startsWith('```')) {
      if (line.includes('yaml')) {
        inYamlBlock = !inYamlBlock;
      } else {
        inCodeBlock = !inCodeBlock;
      }
      translatedLines.push(line);
      continue;
    }
    
    // Translate Korean text inside YAML blocks
    if (inYamlBlock) {
      // Only translate string values in YAML (not keys)
      if (line.includes(':') && !line.trim().startsWith('#')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex + 1);
        const value = line.substring(colonIndex + 1).trim();
        
        // If value contains Korean and is not a pipe (|) or alphanumeric only
        if (value && value !== '|' && !/^[a-zA-Z0-9_\-\.\[\]"]+$/.test(value)) {
          try {
            // Remove quotes and translate
            let cleanValue = value.replace(/^["']|["']$/g, '');
            if (cleanValue.length > 0 && /[가-힣]/.test(cleanValue)) {
              let translated = await translateWithOpenRouter(cleanValue);
              translated = postProcessTranslation(translated, cleanValue);
              
              // Maintain original quote format
              if (value.startsWith('"') && value.endsWith('"')) {
                translated = `"${translated}"`;
              } else if (value.startsWith("'") && value.endsWith("'")) {
                translated = `'${translated}'`;
              } else if (value.includes('|')) {
                // Keep multiline strings as is
                translated = value;
              }
              
              translatedLines.push(key + ' ' + translated);
              console.log(`  ✓ YAML: "${cleanValue.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent rate limiting
              continue;
            }
          } catch (error) {
            console.warn(`  ⚠️  YAML translation failed for: "${value}"`);
          }
        }
      }
      // Handle YAML multiline strings (|, >, |- etc.)
      else if (line.trim() && !line.trim().startsWith('#') && !line.includes(':') && /[가-힣]/.test(line)) {
        try {
          const indent = line.match(/^\s*/)[0];
          const content = line.trim();
          let translated = await translateWithOpenRouter(content);
          translated = postProcessTranslation(translated, content);
          translatedLines.push(indent + translated);
          console.log(`  ✓ YAML multiline: "${content.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent rate limiting
          continue;
        } catch (error) {
          console.warn(`  ⚠️  YAML multiline translation failed for: "${line.trim()}"`);
        }
      }
      
      translatedLines.push(line);
      continue;
    }
    
    // Lines not to translate
    if (inCodeBlock || 
        line.trim() === '' ||
        line.startsWith('---') ||
        line.trim().startsWith('http') ||
        line.trim().startsWith('![') ||
        line.includes('](')) {
      translatedLines.push(line);
      continue;
    }
    
    // Translate headers and general text
    if (line.trim().length > 0) {
      try {
        let translated = await translateWithOpenRouter(line);
        
        // Post-process: improve translation quality
        translated = postProcessTranslation(translated, line);
        
        translatedLines.push(translated);
        console.log(`  ✓ "${line.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
      } catch (error) {
        console.warn(`  ⚠️  Translation failed for: "${line.substring(0, 30)}..."`);
        translatedLines.push(line); // Keep original text
      }
      
      // Prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      translatedLines.push(line);
    }
  }
  
  const translatedContent = translatedLines.join('\n');
  
  // Save English file
  fs.writeFileSync(absoluteEnPath, translatedContent, 'utf8');
  console.log(`✅ Line-by-line translation completed: ${relativePath} -> ${enFilePath}`);
}

// Main execution function
async function main() {
  const changedFiles = process.argv[2];
  
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Script arguments:`, process.argv);
  
  if (!changedFiles) {
    console.log('No changed files specified');
    return;
  }
  
  // Check API key and tools
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    console.log('✅ OpenRouter API key found - using AI translation');
  } else {
    console.log('⚠️  OpenRouter API key not found - will use Google Translate as fallback');
    
    // Check trans CLI tool availability (for fallback)
    try {
      execSync('which trans', { encoding: 'utf8' });
      console.log('✅ translate-shell (trans) is available for fallback');
    } catch (error) {
      console.error('❌ Neither OpenRouter API key nor translate-shell is available.');
      console.error('Please set OPENROUTER_API_KEY environment variable or install translate-shell.');
      process.exit(1);
    }
  }
  
  // Parse changed files list
  const files = changedFiles.split(' ').filter(file => file.trim());
  
  console.log(`Found ${files.length} changed Korean files:`);
  files.forEach(file => {
    console.log(`  - ${file}`);
    const absolutePath = path.resolve(process.cwd(), file);
    const exists = fs.existsSync(absolutePath);
    console.log(`    → Absolute path: ${absolutePath} (exists: ${exists})`);
  });
  
  // Translate each file
  for (const file of files) {
    await translateFileSimple(file);
  }
  
  console.log('🎉 All translations completed!');
}

// Execute script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { translateFileSimple };
