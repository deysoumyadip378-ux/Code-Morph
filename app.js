// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const apiKeyInput = document.getElementById('apiKey');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const translateBtn = document.getElementById('translateBtn');
const translateSpinner = document.getElementById('translateSpinner');
const sourceCode = document.getElementById('sourceCode');
const outputCode = document.getElementById('outputCode');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const copyBtn = document.getElementById('copyBtn');

const DEFAULT_GROQ_KEY = '';

// Load API Key
let apiKey = localStorage.getItem('groq_api_key') || DEFAULT_GROQ_KEY;
apiKeyInput.value = apiKey;

// Modal Events
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('groq_api_key', apiKey);
    settingsModal.classList.add('hidden');
    alert('API Key saved successfully!');
});

// Copy Output
copyBtn.addEventListener('click', async () => {
    const text = outputCode.textContent;
    if (!text || text === 'Translated code will appear here...') return;
    try {
        await navigator.clipboard.writeText(text);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
        lucide.createIcons();
        setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            lucide.createIcons();
        }, 2000);
    } catch (err) {
        alert('Failed to copy to clipboard');
    }
});

function extractCode(text) {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1].trim() : text.trim();
}

// Translate Function
translateBtn.addEventListener('click', async () => {
    const code = sourceCode.value.trim();
    if (!code) {
        alert('Please enter some code to translate.');
        return;
    }

    const effectiveKey = apiKey || DEFAULT_GROQ_KEY;
    const srcLang = sourceLang.value;
    const tgtLang = targetLang.value;

    translateBtn.disabled = true;
    translateSpinner.classList.remove('hidden');
    outputCode.textContent = 'Translating...';
    // Remove previous highlighting class
    outputCode.className = '';

    const systemPrompt = `You are an expert programmer. Translate the provided source code to ${tgtLang}. 
${srcLang !== 'auto' ? 'The source language is ' + srcLang + '.' : 'Auto-detect the source language.'}
Preserve the logic exactly. Add comments explaining key differences, language idioms, or adaptations made during translation.
Return ONLY the translated code within markdown code blocks (e.g. \`\`\`${tgtLang}\n...\n\`\`\`). Do not include any other conversational text.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${effectiveKey}`
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.8-27b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: code }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const cleanCode = extractCode(content);
        
        outputCode.className = `language-${tgtLang}`;
        outputCode.textContent = cleanCode;
        hljs.highlightElement(outputCode);

    } catch (error) {
        console.error(error);
        outputCode.textContent = `Error: ${error.message}`;
    } finally {
        translateBtn.disabled = false;
        translateSpinner.classList.add('hidden');
    }
});

// Keyboard shortcut: Ctrl+Enter to trigger translation
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translateCode();
    }
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
    }
});

// Enhanced copy visual indicator
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>✓ Copied!</span>';
        setTimeout(() => { copyBtn.innerHTML = originalText; }, 1800);
    });
}
