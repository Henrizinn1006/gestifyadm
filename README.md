# ⚡ Gestify — Sistema de Gestão Financeira e Operacional

> Sistema de gestão para pequenas empresas, inicialmente focado em **empresas de eventos**.
> Versão 1.0 — Roda localmente em `http://localhost:8000`.

---

## 📌 Objetivo

O Gestify foi criado para ajudar empresas de eventos a:
- Controlar **entradas e saídas** financeiras
- Calcular o **lucro por evento**
- Gerenciar **clientes, fornecedores e categorias**
- Visualizar **relatórios e gráficos** em tempo real

---

## 🛠️ Tecnologias

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | Python 3.11+ + FastAPI            |
| Banco      | SQLite (local) → pronto para PostgreSQL/MySQL |
| ORM        | SQLAlchemy 2.x                    |
| Validação  | Pydantic v2                       |
| Frontend   | HTML5 + CSS3 + JavaScript Vanilla |
| Gráficos   | Chart.js (CDN)                    |
| Servidor   | Uvicorn (ASGI)                    |

---

## 📁 Estrutura de Pastas

```
gestifyadm/
│
├── backend/
│   ├── __init__.py
│   ├── main.py          ← App FastAPI + serve frontend
│   ├── database.py      ← Conexão SQLAlchemy/SQLite
│   ├── models.py        ← Modelos ORM (tabelas)
│   ├── schemas.py       ← Schemas Pydantic (validação)
│   ├── crud.py          ← Operações de banco (lógica)
│   ├── gestify.db       ← Banco gerado automaticamente
│   └── routers/
│       ├── __init__.py
│       ├── dashboard.py
│       ├── clientes.py
│       ├── eventos.py
│       ├── financeiro.py
│       ├── categorias.py
│       ├── fornecedores.py
│       └── relatorios.py
│
├── frontend/
│   ├── index.html       ← SPA completa
│   ├── css/
│   │   └── style.css    ← Dark theme
│   └── js/
│       ├── api.js       ← Comunicação com API
│       ├── app.js       ← Roteador SPA
│       ├── dashboard.js ← Gráficos e KPIs
│       ├── clientes.js
│       ├── eventos.js
│       ├── financeiro.js
│       ├── categorias.js
│       ├── fornecedores.js
│       └── relatorios.js
│
├── requirements.txt
└── README.md
```

---

## 🚀 Como Instalar e Rodar

### Pré-requisitos
- Python 3.11 ou superior
- pip

### Passo 1 — Criar ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### Passo 2 — Instalar dependências

```bash
pip install -r requirements.txt
```

### Passo 3 — Iniciar o servidor

```bash
# A partir da pasta gestifyadm/
uvicorn backend.main:app --reload
```

### Passo 4 — Abrir no navegador

- **Sistema:**   [http://localhost:8000](http://localhost:8000)
- **Swagger:**   [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:**     [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📖 Funcionalidades

### 📊 Dashboard
- Cards com totais: Receitas, Despesas, Lucro, Pendentes
- Contadores: Eventos, Clientes, Fornecedores
- Resumo do mês corrente
- Gráfico de barras: Receitas vs Despesas (6 meses)
- Gráfico de rosca: Despesas por Categoria
- Gráfico horizontal: Lucro por Evento
- Lista de Próximos Eventos

### 👥 Clientes
- CRUD completo (Criar, Listar, Editar, Excluir)
- Busca por nome em tempo real
- Campos: Nome, Telefone, Email, Endereço, Observações

### 🎉 Eventos
- CRUD completo
- Filtro por status e busca por nome
- Status: Planejado, Em Andamento, Concluído, Cancelado
- Acesso rápido ao relatório do evento

### 💰 Financeiro
- CRUD de movimentações (Receitas e Despesas)
- Filtros por tipo, status e mês
- Totalização em tempo real (filtro ativo)
- Vinculação com Evento, Cliente e Fornecedor
- Formas de pagamento: PIX, Dinheiro, Crédito, Débito, Boleto, Transferência, Outro
- Status: Pago, Pendente, Cancelado

### 🏷️ Categorias
- CRUD de categorias financeiras
- Separação por tipo (Receita / Despesa)
- Categorias padrão criadas automaticamente na primeira execução

### 🤝 Fornecedores
- CRUD completo
- Busca por nome em tempo real

### 📋 Relatórios
- Seleção de evento via dropdown
- KPIs do evento: Receitas, Despesas, Lucro, Valor Fechado
- Tabela completa de movimentações do evento

---

## 🔌 Endpoints da API

| Método | Endpoint                        | Descrição                   |
|--------|---------------------------------|-----------------------------|
| GET    | `/dashboard/resumo`             | Resumo completo do dashboard |
| GET    | `/clientes`                     | Listar clientes              |
| POST   | `/clientes`                     | Criar cliente                |
| GET    | `/clientes/{id}`                | Obter cliente por ID         |
| PUT    | `/clientes/{id}`                | Atualizar cliente            |
| DELETE | `/clientes/{id}`                | Excluir cliente              |
| GET    | `/eventos`                      | Listar eventos               |
| POST   | `/eventos`                      | Criar evento                 |
| GET    | `/eventos/{id}`                 | Obter evento por ID          |
| PUT    | `/eventos/{id}`                 | Atualizar evento             |
| DELETE | `/eventos/{id}`                 | Excluir evento               |
| GET    | `/financeiro`                   | Listar movimentações         |
| POST   | `/financeiro`                   | Criar movimentação           |
| GET    | `/financeiro/{id}`              | Obter movimentação           |
| PUT    | `/financeiro/{id}`              | Atualizar movimentação       |
| DELETE | `/financeiro/{id}`              | Excluir movimentação         |
| GET    | `/categorias`                   | Listar categorias            |
| POST   | `/categorias`                   | Criar categoria              |
| PUT    | `/categorias/{id}`              | Atualizar categoria          |
| DELETE | `/categorias/{id}`              | Excluir categoria            |
| GET    | `/fornecedores`                 | Listar fornecedores          |
| POST   | `/fornecedores`                 | Criar fornecedor             |
| PUT    | `/fornecedores/{id}`            | Atualizar fornecedor         |
| DELETE | `/fornecedores/{id}`            | Excluir fornecedor           |
| GET    | `/relatorios/evento/{id}`       | Relatório por evento         |

---

## ⚙️ Regras de Negócio

- `Lucro = Receitas (pagas) − Despesas (pagas)`
- Movimentações com status `cancelado` **não** entram nos cálculos
- Movimentações `pendentes` aparecem separadas das pagas
- O lucro de um evento é calculado pelas movimentações vinculadas a ele
- O banco de dados é criado automaticamente ao iniciar o servidor

---

## 🔮 Próximos Passos (Roadmap)

### v1.1 — Autenticação
- [ ] Login com usuário e senha (JWT)
- [ ] Sessão persistente
- [ ] Logout e controle de acesso

### v1.2 — Multiempresa
- [ ] Cadastro de empresas
- [ ] Isolamento de dados por empresa
- [ ] Painel administrativo

### v1.3 — Banco de dados em produção
- [ ] Migração para PostgreSQL ou MySQL
- [ ] Configuração via variável de ambiente `DATABASE_URL`
- [ ] Migrations com Alembic

### v1.4 — Exportação
- [ ] Exportar relatórios em PDF
- [ ] Exportar dados em Excel/CSV
- [ ] Relatório mensal automatizado

### v1.5 — Integrações
- [ ] Envio de relatórios via WhatsApp
- [ ] IA para interpretar mensagens financeiras
- [ ] Notificações de eventos próximos

### v2.0 — SaaS Online
- [ ] Deploy em VPS (DigitalOcean, AWS, etc.)
- [ ] Domínio próprio e SSL
- [ ] Planos de assinatura

---

## 💡 Dicas de Uso

**Primeira execução:** O sistema cria automaticamente categorias padrão (flores, transporte, equipe, etc.).

**Testar a API:** Acesse `http://localhost:8000/docs` para o Swagger com todos os endpoints documentados e testáveis.

**Migrar para PostgreSQL:** Basta alterar a variável `DATABASE_URL` em `backend/database.py`:
```python
DATABASE_URL = "postgresql://usuario:senha@localhost:5432/gestify"
```

---

*Gestify — Feito para crescer junto com o seu negócio.* ⚡
