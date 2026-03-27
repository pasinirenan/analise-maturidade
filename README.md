# Analisador de Maturidade de Inovação

Sistema web para análise automática de maturidade de inovação de empresas através da análise de seus sites institucionais.

## 🚀 Funcionalidades

- **Análise com LLM**: Usa inteligência artificial (OpenAI GPT ou Groq) para análise inteligente
- **Análise com Regras**: Fallback para análise baseada em regras (sem API key)
- **5 Dimensões de Análise**:
  - Presença Digital (20%)
  - Redes Sociais (25%)
  - Cultura de Inovação (25%)
  - Comunicação e Conteúdo (15%)
  - Indicadores de Transformação (15%)
- **Framework de Maturidade**: Classifica empresas de Nascent (1) a Líder (5)
- **Relatório HTML**: Geração automática de relatório profissional

## 🚀 Deploy no Render.com

### Opção 1: Deploy Automático (Recomendado)

1. Fork este repo para sua conta GitHub
2. Acesse: https://render.com
3. Faça login com GitHub
4. Clique **"New +"** → **"Web Service"**
5. Conecte sua conta GitHub se necessário
6. Selecione o repo `analise-maturidade`
7. Configure:
   - **Name**: `analise-maturidade`
   - **Region**: Frankfurt
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
8. Adicione variáveis de ambiente:
   - `LLM_PROVIDER`: `groq` ou `openai`
   - `GROQ_API_KEY`: sua chave do Groq
   - `OPENAI_API_KEY`: sua chave da OpenAI
   - `MODEL`: `llama-3.3-70b-versatile` (Groq) ou `gpt-5.4` (OpenAI)
   - `TEMPERATURE`: `0.7`
9. Clique **"Create Web Service"**
10. Aguarde o deploy e teste!

### Opção 2: Deploy via render.yaml

1. O arquivo `render.yaml` já está configurado
2. Conecte o repo ao Render
3. O Render detectará o arquivo e configurará automaticamente

## 📦 Instalação Local

```bash
cd analise-maturidade
npm install
```

## 🔑 Configuração (Opcional)

Para usar análise com LLM, crie um arquivo `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e adicione:
```
LLM_PROVIDER=groq
GROQ_API_KEY=sua-chave-groq
MODEL=llama-3.3-70b-versatile
```

## ▶️ Execução Local

```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
analise-maturidade/
├── server.js              # Servidor Express
├── functions/
│   ├── analyzeSite.js     # Lógica de análise (LLM + regras)
│   └── scoringRules.js    # Sistema de pontuação
├── public/
│   └── index.html         # Interface do usuário
├── reports/               # Relatórios gerados
├── .env.example           # Template de configuração
├── render.yaml            # Configuração para deploy no Render
├── package.json
└── README.md
```

## 🎯 Como Usar

1. Acesse o sistema (localhost ou URL do Render)
2. Insira a URL do site da empresa (ex: `www.exemplo.com.br`)
3. Clique em "Analisar Site"
4. Aguarde a geração do relatório
5. Visualize o relatório HTML

## 🔧 Tecnologias

- **Node.js** + **Express** - Backend
- **Cheerio** - Web scraping
- **Axios** - Requisições HTTP
- **OpenAI SDK** - Inteligência artificial (opcional)
- **Groq API** - Inteligência artificial (opcional)
- **HTML/CSS/JS** - Frontend

## 📊 Scores de Maturidade

| Nível | Denominação | Score |
|-------|-------------|-------|
| 1 | Nascent | 0-29 |
| 2 | Emergente | 30-49 |
| 3 | Desenvolvendo | 50-69 |
| 4 | Inovador | 70-84 |
| 5 | Líder | 85-100 |

## ⚠️ Observações

- **Sem API Key**: Sistema usa análise baseada em regras
- **Com API Key**: Sistema usa LLM para análise mais contextualizada
- O plano Free do Render "dorme" após 15min inativo
- Para resultados mais precisos, uma análise manual é recomendada

## 📝 API

### `GET /api/status`
Retorna o status do servidor e se LLM está ativo.

### `POST /api/analyze`
Analisa um site.
```json
{
  "url": "https://www.exemplo.com.br"
}
```

### `GET /reports/:filename`
Acessa um relatório gerado.

### `GET /api/reports`
Lista os últimos 20 relatórios gerados.

---

Desenvolvido com BMAD Skills
