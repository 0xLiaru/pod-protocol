# 🛡️ Proof of Dare (POD) Protocol
### *Decentralized Social Verification Powered by DareGuard AI*

**Proof of Dare (POD)** is a next-generation SocialFi platform built on **Solana**. It allows users to challenge each other, prove their achievements via AI-verified video evidence, and earn rewards through a trustless escrow system.

![Platform Preview](https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

### 🧠 DareGuard AI Audit
Utilizes **Google Gemini 1.5 Flash** to perform frame-by-frame video analysis. The AI agent ensures that submissions are authentic and strictly follow the challenge requirements. 
- **Zero-Tolerance Policy:** Automatically rejects irrelevant or fraudulent content.
- **Context-Aware Heuristics:** Analyzes descriptions and video metadata for semantic alignment.

### ⚡ Solana Blinks & Actions
Integrated with **Solana Actions**, allowing users to participate in dares directly from their **X (Twitter)** feed. 
- One-click participation.
- Viral social proof loops.

### 🔐 Trustless Escrow Vault
A decentralized financial model where prize pools are locked in a vault upon challenge creation.
- **Secure Payouts:** Winners claim rewards directly from the vault.
- **Sustainable Economy:** 10% platform commission on every successful claim.

### 🆔 Web3 Identity (Privy)
Seamless onboarding using **Privy**, linking Solana wallets with X and Google accounts for verified social identity.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion
- **Blockchain:** Solana Web3.js, @solana/actions
- **AI Engine:** Google Generative AI (Gemini 1.5 Flash)
- **Auth:** Privy SDK
- **Persistence:** Supabase (Coming Soon) / LocalStorage

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pod-protocol.git
   cd pod-protocol
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file and add your keys:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_id
   GOOGLE_API_KEY=your_gemini_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🏆 Hackathon Submission
This project is submitted for the **Solana Hackathon**. It aims to solve the problem of social trust by merging Multimodal AI with Blockchain-backed incentives.

**Developer:** [Your Name/Handle]
**License:** MIT
