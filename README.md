# 📚 Álbum de Figurinhas ALMAH

> Álbum virtual com login, coleção individual por usuário, pacotinhos diários e sistema de trocas por código — tudo salvo no Supabase.

---

## 🚀 Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 + Vite 5 | Interface |
| Sass (SCSS Modules) | Estilização |
| Supabase | Auth + banco de dados PostgreSQL |
| Vercel | Hospedagem |

---

## 📁 Estrutura do Projeto

```
almah-album/
├── public/
│   └── fotos/              ← 📸 Fotos dos funcionários ficam aqui
├── src/
│   ├── components/         ← FigurinhaCard, Pacotinho, Header, Toast, CardModal, AlbumPage
│   ├── contexts/
│   │   └── AuthContext.jsx ← Estado global de autenticação
│   ├── data/
│   │   └── album.js        ← ✏️ ÚNICO ARQUIVO que você edita para dados do time
│   ├── hooks/
│   │   ├── useAlbum.js     ← Coleção + pacotes + trocas (Supabase)
│   │   └── useToast.js     ← Notificações
│   ├── lib/
│   │   └── supabase.js     ← Cliente Supabase (singleton)
│   ├── pages/              ← AuthPage, AlbumView, PacotinhosView, TrocasView
│   └── styles/
│       └── global.scss     ← Variáveis de cor, keyframes, reset
├── supabase/
│   └── schema.sql          ← ✏️ SQL para criar as tabelas no Supabase
├── .env.example            ← Modelo das variáveis de ambiente
├── vercel.json
└── package.json
```

---

## ⚙️ PASSO A PASSO COMPLETO

### ETAPA 1 — Configurar o Supabase

#### 1.1 Criar conta e projeto

1. Acesse **https://supabase.com** e crie uma conta gratuita
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `almah-album`
   - **Database Password:** crie uma senha forte (guarde ela!)
   - **Region:** South America (São Paulo)
4. Aguarde ~2 minutos o projeto ser criado

#### 1.2 Criar as tabelas (banco de dados)

1. No painel do Supabase, vá em **SQL Editor** → **New Query**
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor e clique em **Run**
4. Você verá ✅ `Success. No rows returned` — tabelas criadas!

#### 1.3 Configurar confirmação de e-mail (IMPORTANTE)

Por padrão o Supabase exige confirmar o e-mail ao cadastrar.
Para o ambiente interno da ALMAH, recomendamos **desativar** isso:

1. Vá em **Authentication** → **Providers** → **Email**
2. Desative a opção **"Confirm email"**
3. Salve

> Se quiser manter a confirmação, os usuários receberão um e-mail ao se cadastrar.

#### 1.4 Pegar as chaves da API

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `https://XXXXXXXXXXXXXXXX.supabase.co`
   - **anon public** key → `eyJhbGci...` (chave longa)

---

### ETAPA 2 — Configurar o projeto localmente

#### 2.1 Pré-requisitos

- **Node.js 18+** → https://nodejs.org
- **Git** → https://git-scm.com

#### 2.2 Clonar e instalar

```bash
# Extraia o ZIP ou clone do GitHub
cd almah-album

# Instalar dependências
npm install
```

#### 2.3 Criar o arquivo .env

```bash
# Copie o modelo
cp .env.example .env
```

Edite o `.env` com as chaves que você copiou do Supabase:

```env
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2.4 Rodar em desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:5173** — a tela de login vai aparecer!

---

### ETAPA 3 — Deploy no Vercel

#### Opção A — Via GitHub (recomendado)

1. Suba o projeto para um repositório no **GitHub** (pode ser privado)
2. Acesse **https://vercel.com** → **Add New Project**
3. Selecione o repositório
4. **IMPORTANTE — Adicione as variáveis de ambiente no Vercel:**
   - Vá em **Environment Variables** antes de fazer o deploy
   - Adicione `VITE_SUPABASE_URL` com o valor da URL
   - Adicione `VITE_SUPABASE_ANON_KEY` com o valor da chave
5. Clique em **Deploy**

> ⚠️ Nunca commite o arquivo `.env` no GitHub — ele está no `.gitignore`.

#### Opção B — Via Vercel CLI

```bash
npm install -g vercel
vercel login

# Na primeira vez, ele vai pedir para configurar o projeto
# Quando perguntar sobre variáveis de ambiente, adicione as duas chaves do Supabase
vercel --prod
```

---

## 📸 Como adicionar fotos dos funcionários

### 1. Preparar as imagens

- Formato: **JPG ou WebP**
- Tamanho ideal: **400×500px** (proporção retrato)
- Peso máximo: **150KB** por foto → use https://squoosh.app para comprimir

### 2. Colocar na pasta

```
public/
└── fotos/
    ├── roberto.jpg
    ├── viviane.jpg
    ├── alexandre.jpg
    └── ...
```

### 3. Atualizar o arquivo de dados

Abra **`src/data/album.js`** e substitua `foto: null` pelo caminho:

```js
// Antes:
{ id: 1, nome: 'Roberto Almada', ..., foto: null }

// Depois:
{ id: 1, nome: 'Roberto Almada', ..., foto: '/fotos/roberto.jpg' }
```

### 4. Publicar

```bash
git add .
git commit -m "Adiciona fotos dos funcionários"
git push
# Vercel republica automaticamente em ~30 segundos
```

---

## ✏️ Como editar o time

Abra **`src/data/album.js`** — é o único arquivo que você precisa mexer.

### Adicionar funcionário

```js
{ id: 36, nome: 'Novo Membro', cargo: 'Cargo', setor: 'dev', brilhante: false, foto: null },
```

> IDs devem ser únicos. Use o próximo número disponível.

### Marcar como brilhante (líder/sócio)

```js
{ id: 4, nome: 'Ana Lima', cargo: 'Tech Lead', setor: 'dev', brilhante: true, foto: null },
```

### Adicionar figurinha especial (família/evento)

```js
{ id: 36, nome: 'Família Fulano', cargo: 'Legenda aqui', setor: 'especial', brilhante: false, foto: null, especial: true },
```

### Setores disponíveis

| id | Nome |
|---|---|
| `crm` | CRM |
| `cro` | CRO |
| `dev` | Desenvolvimento |
| `socios` | Sócios |
| `marketing` | Marketing |
| `ux` | UX |
| `atendimento` | Atendimento |
| `comercial` | Comercial |
| `especial` | Especiais |

---

## 🎨 Como mudar as cores

Edite **`src/styles/global.scss`** — tudo está em variáveis no topo:

```scss
$orange:       #FF6B00;  ← cor principal
$orange-light: #FF8C35;
$orange-dark:  #CC5500;
```

---

## 🔄 Como funciona o sistema de trocas

1. **Usuário A** (tem figurinhas repetidas):
   - Trocas → Propor Troca
   - Escolhe qual figurinha repetida oferece → qual quer receber
   - Recebe um **código de 6 letras** (ex: `AB3X9K`)
   - Manda o código para o colega via WhatsApp/Slack

2. **Usuário B**:
   - Trocas → Usar Código
   - Cola o código → confirma
   - As figurinhas são trocadas e salvas no banco

> Os códigos expiram em 24h automaticamente.

---

## 👤 Como funciona o login

- Cada funcionário se cadastra com **e-mail + senha** (mínimo 6 caracteres)
- A coleção fica salva no banco — funciona em qualquer dispositivo
- Logout pelo botão ⏏ no canto do header

---

## 🗄️ Tabelas do banco de dados (Supabase)

| Tabela | O que guarda |
|---|---|
| `profiles` | Nome e e-mail de cada usuário |
| `colecao` | Cada figurinha coletada (uma linha por figurinha) |
| `pacotes_dia` | Controle de quantos pacotes cada um abriu hoje |
| `trocas` | Propostas de troca com código, status e validade |

Todas as tabelas têm **Row Level Security (RLS)** — cada usuário só vê e edita os próprios dados.

---

## 🐛 Problemas comuns

| Problema | Solução |
|---|---|
| "Variáveis VITE_SUPABASE_URL não encontradas" | Crie o arquivo `.env` com as chaves do Supabase |
| Login não funciona | Verifique se copiou a chave **anon public** (não a `service_role`) |
| Cadastro cria conta mas não entra | Desative "Confirm email" nas configurações de Auth do Supabase |
| Foto não aparece | Confirme que o arquivo está em `public/fotos/` e o caminho em `album.js` está correto |
| Deploy falha no Vercel | Confirme que as variáveis de ambiente foram adicionadas no painel do Vercel |
| Trocas não atualizam em tempo real | Normal — a atualização em tempo real requer que ambos os usuários estejam com o app aberto |

---

## 📞 Contato

Projeto desenvolvido para uso interno da **ALMAH Comunicação**.
Dúvidas técnicas: fale com a equipe de Dev.
