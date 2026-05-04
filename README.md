# CotaWeb

Monorepo do sistema **CotaWeb** — frontend React (Vite) + backend Fastify (Knex + PostgreSQL).

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| **Node.js** | 18+ |
| **npm** | 9+ (vem junto com o Node) |
| **Docker** e **Docker Compose** | Para subir o banco de dados (recomendado) |

> [!TIP]
> Se você já tiver um PostgreSQL instalado na máquina, pode pular o Docker. Basta configurar o `.env` com os dados do seu banco.

---

## 1 · Clonar o repositório

```bash
git clone https://github.com/Gabriel-Enrico/Projeto_Cotaweb.git
cd Projeto_Cotaweb
```

---

## 2 · Instalar dependências

Na raiz do projeto:

```bash
npm install
```

Isso instala tudo (root + frontend + backend) graças ao **npm workspaces**.

---

## 3 · Configurar variáveis de ambiente

Copie o exemplo e ajuste os valores:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Valores padrão para desenvolvimento local:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5433
DB_NAME=cotaweb
DB_USER=postgres
DB_PASSWORD=senha
```

---

## 4 · Subir o banco de dados (PostgreSQL)

### Opção A — Docker (recomendado)

```bash
docker compose up -d
```

Isso cria um container PostgreSQL 16 já configurado com os valores do `.env`.

Para parar:

```bash
docker compose down        # mantém os dados
docker compose down -v     # apaga os dados do volume
```

### Opção B — PostgreSQL instalado localmente

Crie o banco manualmente:

```sql
CREATE DATABASE cotaweb;
```

E garanta que o usuário/senha do `.env` tenha acesso.

---

## 5 · Rodar as migrations e seeds

```bash
npm run migrate   # cria as tabelas
npm run seed      # popula dados iniciais
```

---

## 6 · Iniciar o projeto

### Tudo junto (backend + frontend):

```bash
npm run dev
```

### Separadamente:

```bash
npm run dev:backend    # API Fastify → http://localhost:3000
npm run dev:frontend   # Vite/React  → http://localhost:5173
```

O frontend usa um **proxy** do Vite: qualquer chamada para `/api/*` é redirecionada automaticamente ao backend.

---

## Scripts disponíveis (raiz)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Roda backend + frontend em paralelo |
| `npm run dev:backend` | Roda só o backend |
| `npm run dev:frontend` | Roda só o frontend |
| `npm run build` | Builda frontend + backend para produção |
| `npm run migrate` | Executa migrations do Knex |
| `npm run seed` | Executa seeds do Knex |

---

## Estrutura do projeto

```
cotaweb_clean/
├── apps/
│   ├── backend/           # API Fastify + Knex + PostgreSQL
│   │   ├── src/
│   │   │   ├── db/        # knexfile, migrations, seeds
│   │   │   ├── routes/    # rotas Fastify
│   │   │   ├── services/  # lógica de negócio
│   │   │   ├── schemas/   # validações Zod
│   │   │   └── server.ts  # entry point
│   │   └── .env.example
│   └── frontend/          # React + Vite
│       └── src/
├── docker-compose.yml     # PostgreSQL via Docker
├── package.json           # Workspaces root
└── README.md
```

---

## Checklist rápido para outra máquina

```bash
# 1. Clonar
git clone https://github.com/Gabriel-Enrico/Projeto_Cotaweb.git
cd Projeto_Cotaweb

# 2. Instalar
npm install

# 3. Configurar .env
cp apps/backend/.env.example apps/backend/.env
# editar se necessário

# 4. Subir banco
docker compose up -d

# 5. Criar tabelas e dados
npm run migrate
npm run seed

# 6. Rodar
npm run dev
```

Pronto! Frontend em `http://localhost:5173` e API em `http://localhost:3000`.
