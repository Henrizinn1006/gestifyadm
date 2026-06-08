<h1 align="center">⚡ Gestify</h1>
<p align="center">Sistema de gestão financeira e operacional para empresas de eventos</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
</p>

---

## 📌 Sobre o projeto

O **Gestify** é uma aplicação web full-stack criada para ajudar pequenas empresas de eventos a:

- Controlar entradas e saídas financeiras por evento
- Calcular lucro em tempo real
- Gerenciar clientes, fornecedores e categorias
- Visualizar relatórios e gráficos interativos
- Conversar com o **Lion AI** — assistente financeiro integrado via API de IA

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11+ + **Flask** + Blueprints |
| Banco | SQLite (local) → pronto para PostgreSQL/MySQL |
| ORM | SQLAlchemy 2.x |
| Frontend | HTML5 + CSS3 + JavaScript Vanilla |
| Gráficos | Chart.js |
| Servidor | Gunicorn / Flask dev server |
| IA | Integração com LLM via Lion AI |
| Notificações | Integração com WhatsApp |

---

## 📁 Estrutura

```
gestifyadm/
├── backend/
│   ├── main.py          ← App Flask + blueprints + serve frontend
│   ├── database.py      ← Conexão SQLAlchemy
│   ├── models.py        ← Modelos ORM
│   ├── schemas.py       ← Validação de dados
│   ├── crud.py          ← Lógica de banco
│   └── routers/
│       ├── dashboard.py
│       ├── clientes.py
│       ├── eventos.py
│       ├── financeiro.py
│       ├── categorias.py
│       ├── fornecedores.py
│       ├── relatorios.py
│       ├── lion.py      ← Assistente IA
│       └── whatsapp.py  ← Integração WhatsApp
│
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js
│       ├── app.js
│       ├── dashboard.js
│       └── ...
│
├── requirements.txt
├── run.py
└── .env.example
```

---

## 🚀 Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/Henrizinn1006/gestifyadm.git
cd gestifyadm

# 2. Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua chave de API (se usar Lion AI)

# 5. Inicie o servidor
python run.py
```

Acesse em: **http://localhost:8000**

---

## 📊 Funcionalidades

### Dashboard
- Cards de KPI: Receitas, Despesas, Lucro, Pendentes
- Gráfico de barras: Receitas vs Despesas (6 meses)
- Gráfico de rosca: Despesas por Categoria
- Gráfico horizontal: Lucro por Evento
- Lista de próximos eventos

### Módulos CRUD completos
- **Clientes** — busca em tempo real, histórico de movimentações
- **Eventos** — status (Planejado → Em andamento → Concluído)
- **Financeiro** — Receitas e despesas com filtros por tipo, status e mês
- **Categorias** — separadas por tipo (receita/despesa), criadas automaticamente
- **Fornecedores** — prestadores de serviço vinculados a eventos
- **Relatórios** — KPIs por evento + tabela de movimentações

### 🤖 Lion AI
Assistente financeiro integrado, capaz de interpretar dados do banco e responder perguntas sobre o negócio via chat.

---

## 🔌 API REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard/resumo` | Resumo do dashboard |
| GET/POST | `/clientes` | Listar / Criar cliente |
| PUT/DELETE | `/clientes/{id}` | Editar / Excluir |
| GET/POST | `/eventos` | Listar / Criar evento |
| GET/POST | `/financeiro` | Movimentações financeiras |
| GET | `/relatorios/evento/{id}` | Relatório por evento |

---

## ⚙️ Regras de negócio

- `Lucro = Receitas (pagas) − Despesas (pagas)`
- Movimentações `canceladas` não entram nos cálculos
- Movimentações `pendentes` aparecem separadas das pagas
- Banco criado automaticamente na primeira execução

---

## 🔮 Roadmap

- [x] v1.0 — CRUD completo + Dashboard + Relatórios + Lion AI
- [ ] v1.1 — Autenticação com JWT
- [ ] v1.2 — Multiempresa
- [ ] v1.3 — Migração para PostgreSQL com Alembic
- [ ] v1.4 — Exportação PDF e Excel
- [ ] v1.5 — Notificações via WhatsApp
- [ ] v2.0 — Deploy SaaS (VPS + domínio próprio)

---

## 👨‍💻 Autor

**Henrique Tavares**
- GitHub: [@Henrizinn1006](https://github.com/Henrizinn1006)
- LinkedIn: [linkedin.com/in/henriquetavares1006](https://linkedin.com/in/henriquetavares1006)
- Email: htavares803@gmail.com
