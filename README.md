# 🚀 Team Leader System v4.0

> **The easiest way to build projects with AI agents**

A hierarchical AI Agent Orchestration System that creates teams of AI agents to build your projects step-by-step, with your approval at each stage.

## ✨ Features

- 🤖 **AI Agent Teams** - Specialized agents work together
- 📝 **Step-by-Step Development** - Review and approve each stage
- 💰 **Cost Management** - Real-time cost tracking and optimization
- 📊 **Live Dashboard** - Monitor progress in real-time
- 🔄 **Multi-Model Support** - Uses the best AI models for each task
- 🎯 **Project Templates** - Quick start with common project types

## 🚀 Quick Start

### 1. Start Your Project
```bash
node start.js
```

### 2. Answer Simple Questions
- Project name
- Description
- Project type (web app, mobile app, e-commerce, etc.)

### 3. Let AI Team Work
The AI team will:
- Analyze your requirements
- Create a development plan
- Build your project step-by-step
- Ask for your approval at milestones

## 📋 Example Session

```
🚀 Welcome to Team Leader System v4.0!

👋 Hello! I'm excited to help you build your project!

What would you like to call your project? my-task-manager
Describe your project: A web app that helps users organize tasks

📚 Project types available:
1. Web app - User authentication, Dashboard, Profiles
2. Mobile app - Onboarding, Core features, Notifications  
3. E-commerce - Product catalog, Shopping cart, Checkout
4. SaaS platform - User management, Billing, Admin dashboard
5. Simple website - Home page, About page, Contact form

What type of project? web app

🎉 Congratulations! Your project "my-task-manager" has been created!

📁 Project location: ./my-task-manager
🤖 AI team: Ready and waiting for your input

💡 To check on your project:
   cd my-task-manager
   node ../setup.js
```

## 🎨 Project Templates

| Template | Best For | Features |
|----------|----------|----------|
| **Web App** 🌐 | Business apps, productivity tools | Authentication, Dashboard, User profiles |
| **Mobile App** 📱 | Mobile-first applications | Onboarding, Core features, Push notifications |
| **E-commerce** 🛒 | Online stores, marketplaces | Product catalog, Shopping cart, Checkout |
| **SaaS Platform** 💼 | Business software, subscriptions | User management, Billing, Admin dashboard |
| **Simple Website** 🌍 | Portfolios, small business sites | Home page, About page, Contact form |
| **Custom** 🎨 | Unique requirements | Define your own features and integrations |

## 🔧 Advanced Usage

### Technical Setup (for developers)
```bash
node setup.js
```

### Check Project Status
```bash
cd your-project-name
node ../setup.js
```

### View Available Commands
```javascript
await setup.help()
```

### Check Progress
```javascript
await setup.status()
```

### View Pending Approvals
```javascript
await setup.pending()
```

### Approve Work
```javascript
await setup.approve('task-id')
```

## 📁 Project Structure

```
your-project/
├── .teamleader/          # Project configuration and logs
├── src/                  # Source code
├── docs/                 # Documentation
├── tests/                # Test files
└── project-status.html   # Live dashboard
```

## 🛠️ Development

### Prerequisites
- Node.js 14.0.0 or higher
- API keys for AI providers (optional but recommended)

### Installation
```bash
git clone <repository>
cd team-leader-system
npm install
```

### Running Tests
```bash
npm test
```

### Available Scripts
```bash
npm start          # Start new project (user-friendly)
npm run setup      # Technical setup
npm run test       # Run all tests
npm run browser    # Open dashboard in browser
```

## 🔑 API Keys (Optional)

For best performance, add your API keys to `.env`:

```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPSEEK_API_KEY=your_deepseek_key
```

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Detailed user guide
- [LLM Setup Guide](docs/LLM_SETUP_GUIDE.md) - API key configuration
- [MCP Setup Guide](docs/MCP_SETUP_GUIDE.md) - Multi-model setup
- [Project Initiation](docs/PROJECT_INITIATION_IMPROVEMENTS.md) - How the system works

## 🧪 Testing

All tests are organized in the `tests/` directory:

```bash
# Run specific test categories
node tests/test-project-initiation.js
node tests/test-complete-refactoring.js
node tests/test-dashboard-refactoring.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- Check the logs in your project's `.teamleader/` folder
- Review the documentation in `docs/`
- The AI team is designed to be self-explanatory - just ask questions!

---

**🎉 Ready to build something amazing? Run `node start.js` and let's get started!** 