const express = require('express');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const { analyzeSite } = require('./functions/analyzeSite');

const app = express();
const PORT = process.env.PORT || 3000;
const LLM_PROVIDER = process.env.LLM_PROVIDER || null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const MODEL = process.env.MODEL || 'llama-3.3-70b-versatile';
const TEMPERATURE = parseFloat(process.env.TEMPERATURE) || 0.7;

function getLLMConfig() {
    if (LLM_PROVIDER === 'groq' && GROQ_API_KEY) {
        return { provider: 'groq', apiKey: GROQ_API_KEY, model: MODEL, temperature: TEMPERATURE };
    }
    if (LLM_PROVIDER === 'openai' && OPENAI_API_KEY) {
        return { provider: 'openai', apiKey: OPENAI_API_KEY, model: MODEL, temperature: TEMPERATURE };
    }
    return null;
}

function isLLMEnabled() {
    return getLLMConfig() !== null;
}

function getProviderName() {
    const config = getLLMConfig();
    return config ? config.provider.toUpperCase() : 'Regras';
}

const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
};

app.use(corsMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({
        llm_enabled: isLLMEnabled(),
        provider: getProviderName(),
        model: MODEL,
        message: isLLMEnabled() 
            ? `LLM ativado (${getProviderName()}) - análises serão geradas por inteligência artificial` 
            : 'LLM desativado - usando análise baseada em regras'
    });
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL é obrigatória' });
    }

    try {
        let normalizedUrl = url.trim();
        
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        new URL(normalizedUrl);

        const llmConfig = getLLMConfig();
        
        console.log(`[${new Date().toLocaleTimeString()}] Análise iniciada: ${normalizedUrl}`);
        if (llmConfig) {
            console.log(`[${new Date().toLocaleTimeString()}] Usando LLM: ${llmConfig.provider.toUpperCase()} (${llmConfig.model})`);
        }

        const result = await analyzeSite(normalizedUrl, llmConfig);
        
        const timestamp = Date.now();
        const filename = `relatorio-${timestamp}.html`;
        const filepath = path.join(reportsDir, filename);

        fs.writeFileSync(filepath, result.html);
        
        console.log(`[${new Date().toLocaleTimeString()}] Relatório gerado: ${filename}`);
        console.log(`[${new Date().toLocaleTimeString()}] Score: ${result.llmResult.scores.finalScore}/100`);

        res.json({ 
            success: true,
            filename: filename,
            url: normalizedUrl,
            scores: result.llmResult.scores,
            maturity: result.llmResult.maturidade,
            using_llm: isLLMEnabled(),
            provider: getProviderName(),
        });

    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Erro:`, error.message);
        res.status(500).json({ 
            error: 'Erro ao analisar site',
            details: error.message 
        });
    }
});

app.get('/reports/:filename', (req, res) => {
    const { filename } = req.params;
    
    if (!filename || !filename.includes('.html') || filename.includes('..')) {
        return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }
    
    const filepath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    
    res.sendFile(filepath);
});

app.get('/api/reports', (req, res) => {
    if (!fs.existsSync(reportsDir)) {
        return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => ({
            filename: f,
            created: fs.statSync(path.join(reportsDir, f)).mtime,
            size: fs.statSync(path.join(reportsDir, f)).size
        }))
        .sort((a, b) => b.created - a.created);

    res.json({ reports: files.slice(0, 20) });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Analisador de Maturidade de Inovação                    ║
║                                                            ║
║   Servidor rodando em: http://localhost:${PORT}              ║
║                                                            ║
║   LLM: ${isLLMEnabled() ? 'Ativado (' + getProviderName() + ' - ' + MODEL + ')' : 'Desativado (regras)'}     ║
║                                                            ║
║   Acesse no navegador para analisar sites!                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
