# Cloudflare Feedback Aggregation Tool

An intelligent feedback management system that automatically aggregates, groups, and prioritizes customer feedback from multiple sources using AI-powered semantic analysis.

**Live Demo:** [https://rough-leaf-10cf.nirajanbanjade321.workers.dev](https://rough-leaf-10cf.nirajanbanjade321.workers.dev)

## 🎯 Overview

Product teams receive scattered feedback from GitHub issues, Discord messages, support tickets, and social media. This tool solves that problem by:

- 🤖 **AI-Powered Grouping**: Uses Workers AI (Llama 3) to intelligently cluster similar issues
- 📊 **Urgency Scoring**: Calculates priority based on recency (30%), frequency (30%), and severity (40%)
- 🔄 **Resilient Architecture**: Automatic fallback to rule-based grouping when AI is unavailable
- ⚡ **Serverless & Fast**: Sub-50ms response times with edge deployment

## 🛠️ Tech Stack

- **Cloudflare Workers**: Serverless compute platform
- **D1 Database**: SQL database for structured feedback storage
- **Workers AI**: Llama 3 8B Instruct for semantic clustering
- **Workers Assets**: Static file hosting for dashboard UI

## 🏗️ Architecture
```
User Request → Workers → D1 (Fetch Feedback) → Preprocessing → Workers AI (Semantic Grouping)
                    ↓                                                      ↓
              Fallback Rules ←─────────────────────────────────────── JSON Parsing
                    ↓
         Urgency Score Calculation → Ranked Results → Dashboard UI
```

### Urgency Score Formula
```
Urgency = (Recency × 0.3) + (Frequency × 0.3) + (Severity × 0.4)
```

- **Recency**: Days since latest feedback (newer = higher score)
- **Frequency**: Number of similar reports in group
- **Severity**: Total upvotes across all feedback items

## 🚀 Features

- ✅ Multi-source feedback aggregation (GitHub, Discord, Support, Twitter)
- ✅ AI-powered semantic deduplication
- ✅ Real-time urgency prioritization
- ✅ Automatic fallback when AI rate limits hit
- ✅ Clean dashboard with sortable results
- ✅ RESTful API endpoint (`/api/feedback`)

## 📦 Installation

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/cloudflare-feedback-tool.git
cd cloudflare-feedback-tool
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Cloudflare bindings**

Your `wrangler.toml` should include:
```toml
[[d1_databases]]
binding = "feedback_db"
database_name = "feedback-db"
database_id = "YOUR_DATABASE_ID"

[ai]
binding = "AI"
```

4. **Initialize database**
```bash
# Create D1 database
npx wrangler d1 create feedback-db

# Run migrations locally
npx wrangler d1 execute feedback-db --local --file=./seeder.sql

# Run migrations on production
npx wrangler d1 execute feedback-db --remote --file=./seeder.sql
```

5. **Run locally**
```bash
npm run dev
```

6. **Deploy to production**
```bash
npm run deploy
```

## 📖 Usage

### API Endpoint

**GET** `/api/feedback`

Returns grouped and ranked feedback:
```json
[
  {
    "title": "Deployment Issues",
    "count": 4,
    "total_upvotes": 117,
    "sources": ["GitHub", "Discord", "Support", "Twitter"],
    "urgency_score": 85.67,
    "latest_timestamp": 1737936000000
  }
]
```

### Dashboard

Visit your deployed URL to see the interactive dashboard with:
- Grouped feedback items
- Urgency scores with visual indicators
- Source attribution
- Upvote counts
- Real-time sorting

## 📁 Project Structure
```
cloudflare-feedback-tool/
├── src/
│   └── index.js           # Main Worker logic
├── public/
│   ├── index.html         # Dashboard UI
│   ├── styles.css         # Dashboard styling
│   └── script.js          # Frontend logic
├── seeder.sql             # Database schema & seed data
├── wrangler.toml          # Cloudflare configuration
├── package.json
└── README.md
```

## 🧠 Key Implementation Details

### AI Preprocessing
Reduces token usage by ~60% by condensing feedback into concise strings:
```javascript
`${idx}. [${item.source}] ${item.title}`
```

### Robust JSON Parsing
Handles malformed AI responses with:
- Markdown fence removal
- Brace matching algorithm
- Graceful fallback to rule-based grouping

### Fallback Grouping
Keyword-based clustering when AI is unavailable:
- Deployment issues
- Database problems
- Dashboard performance
- Rate limiting
- Documentation gaps

## 🎓 Built For

Cloudflare Product Manager Intern Assignment (Summer 2026)

**Assignment Requirements:**
- ✅ Hosted on Cloudflare Workers
- ✅ Uses 3+ Developer Platform products (Workers, D1, Workers AI, Assets)
- ✅ Solves feedback aggregation challenge
- ✅ Provides product insights from building experience

## 👤 Author

**Nirajan Banjade**
- Computer Science Student @ Texas State University

## 🙏 Acknowledgments

- Built with assistance from Claude AI
- Cloudflare Developer Platform documentation
- Workers AI (Llama 3 8B Instruct)

---

**Note:** This is a prototype built for educational purposes. Mock data is used for demonstration.