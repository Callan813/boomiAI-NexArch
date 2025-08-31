# ShareHub - AI-Powered Rental Platform

ShareHub is a modern peer-to-peer rental platform that leverages artificial intelligence to create a trusted, efficient marketplace for item rentals. Built with Next.js and powered by multiple AI agents, ShareHub connects people who have items to rent with those who need them, ensuring safety, verification, and optimal matching.

## 🚀 Features

- **AI-Powered Matching**: Intelligent agent system for optimal user and item matching
- **Damage Verification**: Computer vision-based damage assessment and verification
- **Trust Management**: AI-driven trust scoring and user reputation system
- **Smart Pricing**: Dynamic pricing recommendations based on market analysis
- **Engagement Optimization**: AI-powered user engagement and retention strategies
- **Secure Payouts**: Automated payment processing and verification
- **Responsive Design**: Modern UI built with Tailwind CSS for all devices
- **Real-time Search**: Location-based and category-filtered item discovery

## 🏗️ Architecture

ShareHub uses a multi-agent AI architecture with specialized agents handling different aspects of the platform:

### AI Agents

- **Matching Agent**: Intelligent user-item pairing and recommendations
- **Trust Agent**: User reputation scoring and trust verification
- **Verification Agent**: Damage assessment and item verification using computer vision
- **Pricing Agent**: Dynamic pricing analysis and recommendations
- **Engagement Agent**: User behavior analysis and engagement optimization
- **Payout Agent**: Payment processing and verification
- **Orchestrator**: Coordinates all AI agents and manages workflows

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Python-based agents with computer vision capabilities
- **Image Processing**: OpenCV for damage verification
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
boomiAI/
├── agents/                    # AI Agent System
│   ├── engagement_agent/     # User engagement optimization
│   ├── matching_agent/       # User-item matching algorithms
│   ├── orchestrator/         # Agent coordination system
│   ├── payout_agent/         # Payment processing
│   ├── pricing_agent/        # Dynamic pricing analysis
│   ├── trust_agent/          # Trust and reputation management
│   └── verification_agent/   # Damage verification & computer vision
├── components/                # React Components
│   ├── Footer.jsx           # Site footer
│   ├── Header.jsx           # Navigation header
│   └── ProtectedRoute.jsx   # Authentication wrapper
├── lib/                      # Utility Libraries
│   └── supabaseClient.js    # Supabase client configuration
├── pages/                    # Next.js Pages
│   ├── api/                 # API endpoints
│   │   ├── agents/          # Agent API routes
│   │   ├── payout.js        # Payment processing
│   │   └── verify-damage.js # Damage verification
│   ├── dashboard.jsx        # User dashboard
│   ├── marketplace.jsx      # Item marketplace
│   ├── profile.jsx          # User profile management
│   ├── request.jsx          # Rental requests
│   ├── search.jsx           # Item search
│   └── auth/                # Authentication pages
├── public/                   # Static Assets
└── src/                      # Source files
    └── app/                 # App-specific components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.8+
- Supabase account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/boomiAI.git
   cd boomiAI
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies**:
   ```bash
   cd agents
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials and API keys
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Start AI agents** (in separate terminals):
   ```bash
   cd agents/verification_agent
   python main.py
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AI_MODEL_API_KEY=your_ai_model_key
```

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication tables
3. Configure storage for image uploads
4. Set up real-time subscriptions

## 🤖 AI Agent Configuration

Each AI agent can be configured independently:

- **Verification Agent**: Configure computer vision models and thresholds
- **Trust Agent**: Set reputation scoring algorithms
- **Matching Agent**: Tune recommendation algorithms
- **Pricing Agent**: Configure market analysis parameters

## 📱 Available Pages

- **Homepage** (`/`): Platform overview and featured items
- **Marketplace** (`/marketplace`): Browse all available rentals
- **Dashboard** (`/dashboard`): User management and analytics
- **Profile** (`/profile`): User profile and settings
- **Search** (`/search`): Advanced item search
- **Request** (`/request`): Create rental requests
- **Damage Report** (`/damage-report/[id]`): Report and verify item damage

## 🔌 API Endpoints

- `POST /api/agents/[agent]`: Interact with AI agents
- `POST /api/payout`: Process payments
- `POST /api/verify-damage`: Verify item damage

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run AI agent tests
cd agents
python -m pytest
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### AI Agents

1. Deploy to cloud platform (AWS, GCP, Azure)
2. Configure auto-scaling
3. Set up monitoring and logging

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.sharehub.com](https://docs.sharehub.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/boomiAI/issues)
- **Discord**: [Join our community](https://discord.gg/sharehub)
- **Email**: support@sharehub.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend services
- OpenCV community for computer vision tools
- All contributors and beta testers

---

**ShareHub** - Making sharing simple, safe, and smart with AI. 🚀

---

**
*Built with ❤️ by [Aaron Neil Rebello](https://github.com/Aaron1374) and [Callan Gonsalves](https://github.com/Callan813)*

