# Analisador de Maturidade de Inovação

Sistema web para análise automática de maturidade de inovação de empresas através da análise de seus sites institucionais.

## 🚀 Funcionalidades

- **Análise com LLM**: Usa inteligência artificial (OpenAI GPT) para análise inteligente
- **Análise com Regras**: Fallback para análise baseada em regras (sem API key)
- **5 Dimensões de Análise**:
  - Presença Digital (20%)
  - Redes Sociais (25%)
  - Cultura de Inovação (25%)
  - Comunicação e Conteúdo (15%)
  - Indicadores de Transformação (15%)
- **Framework de Maturidade**: Classifica empresas de Nascent (1) a Líder (5)
- **Relatório HTML**: Geração automática de relatório profissional

## 📦 Instalação

```bash
cd analise-maturidade
npm install
```

## 🔑 Configuração (Opcional)

Para usar análise com LLM, crie um arquivo `.env` com sua chave da OpenAI:

```bash
cp .env.example .env
```

Edite o `.env` e adicione sua API key:
```
OPENAI_API_KEY=sk-...
```

Obtenha sua chave em: https://platform.openai.com/api-keys

## ▶️ Execução

```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
analise-maturidade/
├── server.js              # Servidor Express
├── functions/
│   ├── analyzeSite.js    # Lógica de análise (LLM + regras)
│   └── scoringRules.js   # Sistema de pontuação
├── public/
│   └── index.html        # Interface do usuário
├── reports/              # Relatórios gerados
├── .env                  # Configuração (crie manualmente)
├── .env.example          # Template de configuração
├── package.json
└── README.md
```

## 🎯 Como Usar

1. Acesse `http://localhost:3000`
2. Insira a URL do site da empresa (ex: `www.exemplo.com.br`)
3. Clique em "Analisar Site"
4. Aguarde a geração do relatório
5. Visualize ou baixe o relatório HTML

## 🔧 Tecnologias

- **Node.js** + **Express** - Backend
- **Cheerio** - Web scraping
- **Axios** - Requisições HTTP
- **OpenAI** - Inteligência artificial (opcional)
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
- O sistema analisa apenas dados públicos disponíveis nos sites
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
