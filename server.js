const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config();

const { analyzeSite } = require('./functions/analyzeSite');

const app = express();
const PORT = process.env.PORT || 3000;
const LLM_PROVIDER = process.env.LLM_PROVIDER || null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const MODEL = process.env.MODEL || 'llama-3.3-70b-versatile';
const TEMPERATURE = parseFloat(process.env.TEMPERATURE) || 0.7;
const AGENT_ID = process.env.AGENT_ID || process.env.AGENT_APP_ID || 'analise-maturidade';
const AGENT_JWT_SECRET = process.env.AGENT_JWT_SECRET || process.env.JWT_SECRET || '';

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

function base64UrlToBuffer(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return Buffer.from(padded, 'base64');
}

function parseTokenPayload(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Token ausente');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Token malformado');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(base64UrlToBuffer(encodedHeader).toString('utf8'));
    const payload = JSON.parse(base64UrlToBuffer(encodedPayload).toString('utf8'));

    if (header.alg !== 'HS256') {
        throw new Error('Algoritmo de token não suportado');
    }

    if (!AGENT_JWT_SECRET) {
        throw new Error('Segredo JWT não configurado');
    }

    const expectedSignature = crypto
        .createHmac('sha256', AGENT_JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();

    const receivedSignature = base64UrlToBuffer(encodedSignature);

    if (
        expectedSignature.length !== receivedSignature.length ||
        !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
        throw new Error('Assinatura inválida');
    }

    if (!payload.exp || Number(payload.exp) <= Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
    }

    if (payload.agent_id !== AGENT_ID) {
        throw new Error('agent_id inválido');
    }

    return payload;
}

function getTokenFromRequest(req) {
    if (typeof req.query.token === 'string' && req.query.token.trim()) {
        return req.query.token.trim();
    }

    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    return '';
}

function sendBlockedPage(res, statusCode, title, message) {
    res
        .status(statusCode)
        .type('html')
        .send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f9fafb;
            --surface: #ffffff;
            --border: #e5e7eb;
            --text: #111827;
            --muted: #4b5563;
            --accent: #ea580c;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: linear-gradient(180deg, #fff 0%, #f9fafb 100%);
            color: var(--text);
            font-family: Inter, system-ui, sans-serif;
        }
        .blocked-card {
            width: min(100%, 440px);
            padding: 28px;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: var(--surface);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
        }
        .blocked-kicker {
            display: inline-flex;
            margin-bottom: 14px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(234, 88, 12, 0.08);
            color: var(--accent);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: -.04em;
        }
        p {
            margin: 12px 0 0;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <main class="blocked-card">
        <div class="blocked-kicker">Acesso restrito</div>
        <h1>${title}</h1>
        <p>${message}</p>
    </main>
</body>
</html>`);
}

function requireAgentToken(req, res, next) {
    try {
        req.agentClaims = parseTokenPayload(getTokenFromRequest(req));
        next();
    } catch (error) {
        const statusCode =
            error.message === 'Segredo JWT não configurado'
                ? 500
                : (error.message === 'agent_id inválido' ? 403 : 401);

        if (req.path === '/' || req.path.startsWith('/reports/')) {
            const message =
                error.message === 'Segredo JWT não configurado'
                    ? 'O app não está configurado para validar o token recebido.'
                    : 'O link de acesso é inválido, expirou ou não pertence a este app.';
            return sendBlockedPage(res, statusCode, 'Acesso não autorizado', message);
        }

        return res.status(statusCode).json({
            error: 'Acesso não autorizado',
            details: error.message,
        });
    }
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

const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

app.get('/', requireAgentToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', requireAgentToken, (req, res) => {
    res.json({
        llm_enabled: isLLMEnabled(),
        provider: getProviderName(),
        model: MODEL,
        agent_id: req.agentClaims.agent_id,
        email: req.agentClaims.email || null,
        message: isLLMEnabled() 
            ? `LLM ativado (${getProviderName()}) - análises serão geradas por inteligência artificial` 
            : 'LLM desativado - usando análise baseada em regras'
    });
});

app.post('/api/analyze', requireAgentToken, async (req, res) => {
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

app.get('/reports/:filename', requireAgentToken, (req, res) => {
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

app.get('/api/reports', requireAgentToken, (req, res) => {
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
