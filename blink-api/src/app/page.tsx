"use client";

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState, useMemo } from "react";
import { CONNECTION } from "@/lib/solana";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
    { id: 'Sports', label: 'Spor', icon: '🏋️‍♂️', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800' },
    { id: 'Software', label: 'Yazılım', icon: '💻', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800' },
    { id: 'Gaming', label: 'Oyun', icon: '🎮', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800' },
    { id: 'Fun', label: 'Eğlence', icon: '🎉', img: 'https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800' }
];

const PLATFORM_WALLET = "81Eei1YU14Uq2a4Qqost8X1TjQFLWxcu9TRyKbzArMyR"; 
const PLATFORM_FEE_LAUNCH = 0.01;
const PLATFORM_FEE_SUBMIT = 0.005;

interface Applicant {
    id: number; address: string; proofUrl: string; description: string; likes: number; dislikes: number; img: string;
    aiScore?: number; aiComment?: string; aiStatus?: 'LEGIT' | 'SUSPICIOUS';
}

interface Dare {
    pubkey: string; challenger: string; challenged: string; amount: number; deadline: number; status: string;
    title: string; description: string; exampleUrl?: string; maxApplicants: number; winnerCount: number;
    category: string; applicants?: Applicant[]; customImg?: string;
}

const DEFAULT_DARES: Dare[] = [
    { 
        pubkey: '1', challenger: 'SYSTEM', challenged: 'Public', amount: 1.5, deadline: Math.floor(Date.now()/1000) + 7200, status: 'Active', title: '100 Şınav Çek ve Kanıtla', description: 'Şınavlar nizami olmalı ve kesintisiz çekilmelidir. Video kanıtı zorunludur.', exampleUrl: 'https://youtube.com/shorts/example', maxApplicants: 50, winnerCount: 5, category: 'Sports', 
        applicants: [
            { id: 101, address: "7vB6...Xp2", proofUrl: "https://youtube.com/shorts/nizami-sinav", description: "100 tane nizami şınav çektim, her saniyesi videoda!", likes: 12, dislikes: 0, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", aiScore: 98, aiComment: "🛡️ DAREGUARD: Hareketlerin formu kusursuz. Sayım doğruluğu %100.", aiStatus: 'LEGIT' }
        ] 
    },
    { 
        pubkey: '2', challenger: 'SYSTEM', challenged: 'Public', amount: 5.0, deadline: Math.floor(Date.now()/1000) + 86400, status: 'Active', title: 'Solana Blink API ile Tool Yaz', description: 'Yeni bir Blink aksiyonu geliştirin ve GitHub linkini paylaşın. En yaratıcı 3 kişi kazanır.', exampleUrl: 'https://github.com/solana-labs/solana-pay', maxApplicants: 20, winnerCount: 3, category: 'Software', 
        applicants: [
            { id: 201, address: "3A9z...Kq9", proofUrl: "https://github.com/example/blink-tool", description: "NFT Launchpad için özel bir Blink aksiyonu yazdım.", likes: 25, dislikes: 1, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie", aiScore: 95, aiComment: "🛡️ DAREGUARD: Kod yapısı temiz, güvenlik standartlarına uygun.", aiStatus: 'LEGIT' }
        ] 
    },
    { 
        pubkey: '4', challenger: 'SYSTEM', challenged: 'Public', amount: 10.0, deadline: Math.floor(Date.now()/1000) + 172800, status: 'Active', title: 'Mad Lads NFT Mint Story', description: 'En sevdiğin NFT koleksiyonunun hikayesini anlatan bir video çek ve paylaş.', exampleUrl: 'https://madlads.com', maxApplicants: 100, winnerCount: 10, category: 'Fun', customImg: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
        applicants: [
            { id: 401, address: "9Xj8...Lm3", proofUrl: "https://x.com/user/status/123", description: "Mad Lads dünyasına nasıl katıldığımı anlattım!", likes: 45, dislikes: 2, img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack", aiScore: 92, aiComment: "🛡️ DAREGUARD: Hikaye anlatımı etkileyici ve topluluk ruhunu yansıtıyor.", aiStatus: 'LEGIT' }
        ]
    },
    { pubkey: '3', challenger: 'SYSTEM', challenged: 'Public', amount: 0.5, deadline: Math.floor(Date.now()/1000) + 3600, status: 'Active', title: 'League 1vs1 Kazan', description: 'Herhangi birine karşı 1vs1 kazan ve maç sonu ekranını at.', exampleUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e', maxApplicants: 10, winnerCount: 1, category: 'Gaming', applicants: [] },
    { pubkey: '5', challenger: 'SYSTEM', challenged: 'Public', amount: 2.5, deadline: Math.floor(Date.now()/1000) + 43200, status: 'Active', title: 'Meme-Coin Trading Botu Yap', description: 'Solana ağında çalışan basit bir trading botu geliştirin. Kodları GitHub üzerinden kanıtlayın.', exampleUrl: 'https://github.com/solana-labs', maxApplicants: 15, winnerCount: 2, category: 'Software', applicants: [], customImg: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800' },
    { pubkey: '6', challenger: 'SYSTEM', challenged: 'Public', amount: 1.0, deadline: Math.floor(Date.now()/1000) + 1800, status: 'Active', title: 'En İyi Setup Fotoğrafı', description: 'Kendi yazılım/oyun setupını en estetik şekilde fotoğrafla ve kanıtla.', exampleUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', maxApplicants: 50, winnerCount: 5, category: 'Fun', applicants: [], customImg: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800' }
];

const Countdown = ({ deadline }: { deadline: number }) => {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const diff = deadline - now;
            if (diff <= 0) { setTimeLeft("Süre Doldu"); clearInterval(timer); return; }
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setTimeLeft(`${h}s ${m}d ${s}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [deadline]);
    return <span className="font-mono text-cyan-400 font-black tracking-widest">{timeLeft}</span>;
};

export default function Dashboard() {
  const { login, logout, authenticated, user, ready, linkTwitter, linkGoogle } = usePrivy();
  const { wallets } = useWallets();
  
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: string, tx?: string}[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dares, setDares] = useState<Dare[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDare, setSelectedDare] = useState<Dare | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'rewards'>('account');
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [realTimeAiScore, setRealTimeAiScore] = useState(0);
  const [aiStatusMsg, setAiStatusMsg] = useState("");

  const [newDare, setNewDare] = useState({ title: "", description: "", exampleUrl: "", amount: 0.1, category: "Sports", hours: 24, maxApplicants: 10, winnerCount: 1 });
  const [newProof, setNewProof] = useState({ url: "", desc: "" });

  const twitterHandle = user?.twitter?.username;
  const googleEmail = user?.google?.email;

  const [activeTab, setActiveTab] = useState<'dares' | 'feed'>('dares');
  const [globalFeed, setGlobalFeed] = useState<any[]>([]);

  useEffect(() => {
      setMounted(true);
      fetchDares();
      fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
        if (!supabase) return;
        const { data: feed, error } = await supabase.from('dares').select('title, applicants');
        if (error) throw error;
        const flatFeed = feed?.flatMap(d => (d.applicants || []).map((a: any) => ({ ...a, dareTitle: d.title })))
                          .sort((a, b) => b.id - a.id) || [];
        setGlobalFeed(flatFeed.slice(0, 20));
    } catch (e) {
        console.warn("Global Feed yüklenemedi, veritabanı bağlantısını kontrol edin.");
    }
  };

  const fetchDares = async () => {
    try {
        if (!supabase) { setDares(DEFAULT_DARES); return; }
        const { data, error } = await supabase.from('dares').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setDares(data.length > 0 ? data : DEFAULT_DARES);
    } catch (e) {
        console.error("Veri çekme hatası:", e);
        setDares(DEFAULT_DARES);
    }
  };

  const getActiveProvider = () => { 
    if (typeof window === 'undefined') return null; 
    // Öncelikli olarak Phantom ve Solflare'i kontrol et
    if ((window as any).phantom?.solana) return (window as any).phantom.solana;
    if ((window as any).solflare) return (window as any).solflare;
    // Eğer ikisi de yoksa genel Solana objesine bak (MetaMask Solana modundaysa buraya düşebilir)
    if ((window as any).solana?.isPhantom || (window as any).solana?.isSolflare) return (window as any).solana;
    return null;
  };

  const publicKey = useMemo(() => {
    const provider = getActiveProvider();
    if (provider?.publicKey) return provider.publicKey;
    const privySol = wallets.find(w => w.chainType === 'solana' || (w.address && !w.address.startsWith('0x')));
    if (privySol?.address) { try { return new PublicKey(privySol.address); } catch (e) {} }
    return null;
  }, [wallets, ready]);

  const showNotification = (message: string, txOrType: string = "INFO", type: string = "INFO") => {
      const id = Date.now() + Math.random();
      const isTx = txOrType.length > 30;
      const finalType = isTx ? "SUCCESS" : txOrType;
      const newNotif = { id, message, type: finalType, tx: isTx ? txOrType : undefined };
      setNotifications(prev => [...prev, newNotif]);
      
      // RED mesajları (WARN) 8 saniye kalsın, diğerleri 5 saniye
      const duration = finalType === "WARN" ? 8000 : 5000;
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
  };

  const performTransfer = async (amountInSol: number) => {
      const provider = getActiveProvider();
      if (!provider) throw new Error("Cüzdan bulunamadı!");
      try {
          if (!provider.isConnected) await provider.connect();
          const currentPayer = provider.publicKey;
          const transaction = new Transaction().add(SystemProgram.transfer({ fromPubkey: currentPayer, toPubkey: new PublicKey(PLATFORM_WALLET), lamports: Math.round(amountInSol * LAMPORTS_PER_SOL) }));
          const { blockhash } = await CONNECTION.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = currentPayer;
          const signedTransaction = await provider.signTransaction(transaction);
          const signature = await CONNECTION.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: true });
          return signature;
      } catch (e: any) { throw new Error(e.message || "İşlem reddedildi."); }
  };

  const handleLaunchDare = async () => {
    if (!authenticated) return login();
    if (!newDare.title || !newDare.description) return showNotification("Lütfen tüm alanları doldurun!", "WARN");
    
    try {
        const totalDeposit = newDare.amount + PLATFORM_FEE_LAUNCH;
        showNotification(`${totalDeposit.toFixed(3)} SOL (Ödül Havuzu + Fee) Kasaya Kilitleniyor... 🔐`);
        const signature = await performTransfer(totalDeposit);
        
        const dare: Dare = {
            pubkey: Math.random().toString(36).substring(7),
            challenger: publicKey?.toBase58() || "Anon",
            challenged: 'Public',
            amount: newDare.amount,
            deadline: Math.floor(Date.now()/1000) + (newDare.hours * 3600),
            status: 'Active',
            title: newDare.title,
            description: newDare.description,
            maxApplicants: newDare.maxApplicants,
            winnerCount: newDare.winnerCount,
            category: newDare.category,
            applicants: []
        };
        
        const updatedDares = [dare, ...dares];
        setDares(updatedDares);
        
        // SUPABASE KAYIT
        if (supabase) {
            await supabase.from('dares').insert([dare]);
        }
        
        setIsCreateOpen(false);
        showNotification("Meydan Okuma Kasada Kilitlendi ve Başlatıldı!", signature);
        setNewDare({ title: "", description: "", exampleUrl: "", amount: 0.1, category: "Sports", hours: 24, maxApplicants: 10, winnerCount: 1 });
    } catch (err: any) { showNotification(err.message, "WARN"); }
  };

  const handleSubmitProof = async () => {
      if (!authenticated) return login();
      if (realTimeAiScore < 77) return showNotification("Ön analiz yetersiz!", "WARN");
      
      try {
          const signature = await performTransfer(PLATFORM_FEE_SUBMIT);
          setIsAiAnalyzing(true); setAiProgress(0);
          const progressInterval = setInterval(() => { setAiProgress(prev => (prev >= 100 ? 100 : prev + 5)); }, 80);

          await new Promise(r => setTimeout(r, 2000));
          
          const category = (selectedDare?.category || "").toLowerCase();
          const apiResponse = await fetch('/api/analyze-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoUrl: newProof.url, dareCategory: category, dareTitle: selectedDare?.title, userDescription: newProof.desc })
          });
          const aiResult = await apiResponse.json();
          clearInterval(progressInterval);

          if (aiResult.score < 77) {
              setIsAiAnalyzing(false);
              showNotification(`🛡️ DAREGUARD REDDETTİ: ${aiResult.analysisReport}`, "WARN");
              return;
          }

          const applicant: Applicant = {
              id: Date.now(), 
              address: publicKey?.toBase58() || "Anon", // TAM ADRES KAYDEDİLİYOR
              proofUrl: newProof.url, 
              description: newProof.desc, 
              likes: 0, 
              dislikes: 0,
              img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey?.toBase58()}`,
              aiScore: aiResult.score, 
              aiComment: aiResult.analysisReport, 
              aiStatus: 'LEGIT'
          };
          
          const updatedApplicants = [applicant, ...(selectedDare?.applicants || [])];
          
          // SUPABASE GÜNCELLEME
          if (supabase && selectedDare) {
              await supabase.from('dares')
                  .update({ applicants: updatedApplicants })
                  .eq('pubkey', selectedDare.pubkey);
          }

          const updatedDares = dares.map(d => { if (d.pubkey === selectedDare?.pubkey) return { ...d, applicants: updatedApplicants }; return d; });
          setDares(updatedDares);
          setIsAiAnalyzing(false);
          if (selectedDare) setSelectedDare(prev => ({ ...prev!, applicants: updatedApplicants }));
          showNotification("Kanıt AI tarafından onaylandı! @proofofdaree ✅", signature);
          setNewProof({ url: "", desc: "" });
      } catch (err: any) { 
          setIsAiAnalyzing(false); 
          // AI REDDETTİĞİNDE BURASI ÇALIŞIR
          showNotification(`🛡️ DAREGUARD REDDETTİ: ${err.message || "Geçersiz kanıt."}`, "WARN"); 
      }
  };

  const handleDeleteDare = async (darePubkey: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!authenticated) return login();
      
      try {
          // GÜVENİLİRLİK İÇİN İMZA TALEBİ (KÜÇÜK BİR İŞLEM)
          showNotification("Silme işlemi için cüzdan onayı bekleniyor... 🔐");
          const signature = await performTransfer(0.001); 
          
          if (supabase) {
              const { error } = await supabase.from('dares').delete().eq('pubkey', darePubkey);
              if (error) throw error;
          }
          
          setDares(prev => prev.filter(d => d.pubkey !== darePubkey));
          showNotification("Meydan Okuma Başarıyla Silindi!", signature);
      } catch (err: any) { 
          showNotification(err.message, "WARN"); 
      }
  };

  const handleVote = async (appId: number, isLike: boolean) => {
      if (!authenticated) return login();
      if (!selectedDare || !supabase) return;

      try {
          // GÜVENİLİRLİK İÇİN İMZA TALEBİ (VOTING ON-CHAIN FEEL)
          showNotification(`${isLike ? "Like" : "Dislike"} işlemi için cüzdan onayı bekleniyor... 🔐`);
          const signature = await performTransfer(0.0005); 
          
          const updatedApplicants = (selectedDare.applicants || []).map(app => {
              if (app.id === appId) {
                  const key = isLike ? 'likes' : 'dislikes';
                  return { ...app, [key]: (app[key] as number || 0) + 1 };
              }
              return app;
          });

          await supabase.from('dares').update({ applicants: updatedApplicants }).eq('pubkey', selectedDare.pubkey);
          
          const updatedDares = dares.map(d => d.pubkey === selectedDare.pubkey ? { ...d, applicants: updatedApplicants } : d);
          setDares(updatedDares);
          setSelectedDare({ ...selectedDare, applicants: updatedApplicants });
          
          showNotification(`${isLike ? "Beğeni" : "Dislike"} başarıyla mühürlendi!`, signature);
      } catch (err: any) {
          showNotification(err.message, "WARN");
      }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedDare && supabase) {
          await supabase.from('dares').update({ applicants: [] }).eq('pubkey', selectedDare.pubkey);
          const updated = dares.map(d => d.pubkey === selectedDare.pubkey ? { ...d, applicants: [] } : d);
          setDares(updated);
          setSelectedDare(prev => prev ? { ...prev, applicants: [] } : null);
          showNotification("Tüm adaylar veritabanından temizlendi.");
      }
  };

  const getBalance = async () => {
    if (!publicKey) return;
    try { setIsRefreshing(true); const lamports = await CONNECTION.getBalance(publicKey); setBalance(lamports / LAMPORTS_PER_SOL); } 
    catch (e) { setBalance(0); } finally { setIsRefreshing(false); }
  };

  // ÖN ANALİZ MOTORU
  useEffect(() => {
      if (!newProof.desc && !newProof.url) { setRealTimeAiScore(0); setAiStatusMsg("🔍 ANALİZ BAŞLATILMAK ÜZERE..."); return; }
      const text = newProof.desc.toLowerCase();
      const url = newProof.url.toLowerCase();
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const uniqueWords = Array.from(new Set(words));
      const isTwitter = url.includes('twitter.com') || url.includes('x.com');
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      if (!isTwitter && !isYoutube && url.length > 10) { setRealTimeAiScore(0); setAiStatusMsg("🔗 GEÇERSİZ KAYNAK!"); return; }
      const dareTitle = selectedDare?.title || "";
      const dareContext = (dareTitle + " " + (selectedDare?.description || "")).toLowerCase();
      const dareKeywords = dareContext.split(/\s+/).filter(w => w.length > 3);
      const contextMatches = uniqueWords.filter(w => w.length > 3 && dareKeywords.some(dk => dk.includes(w) || w.includes(dk)));
      let score = words.length < 8 ? 10 : (contextMatches.length < 1 ? 30 : (contextMatches.length * 15) + (uniqueWords.length * 2) + (isYoutube || isTwitter ? 10 : 0));
      setRealTimeAiScore(Math.min(Math.round(score), 100));
      setAiStatusMsg(score >= 77 ? "✅ ÖN ANALİZ BAŞARILI" : "🔍 ANALİZ EDİLİYOR...");
  }, [newProof, selectedDare]);

  if (!mounted || !ready) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div></div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
       {isAiAnalyzing && (
           <div className="fixed inset-0 bg-black/90 backdrop-blur-[100px] z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="w-40 h-40 bg-gradient-to-tr from-cyan-500 via-fuchsia-600 to-cyan-500 rounded-full animate-pulse shadow-[0_0_100px_rgba(34,211,238,0.6)] relative overflow-hidden mb-12">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-3xl font-black italic uppercase text-cyan-400 mb-2">DareGuard AI Analiz Ediyor</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Video kareleri ve mülkiyet taranıyor...</p>
                <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${aiProgress}%` }}></div></div>
           </div>
       )}

       {/* GLOBAL ACTIVITY TICKER */}
       <div className="w-full bg-cyan-500/10 border-b border-cyan-500/20 py-2 overflow-hidden whitespace-nowrap relative z-50">
           <div className="flex animate-marquee gap-12 items-center">
               {[...Array(10)].map((_, i) => (
                   <div key={i} className="flex items-center gap-4">
                       <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                           <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping"></span>
                           {i % 2 === 0 ? "YENİ MEYDAN OKUMA:" : "KANIT ONAYLANDI:"}
                       </span>
                       <span className="text-[9px] font-bold text-white/60">
                           {i % 2 === 0 ? "5.0 SOL Ödüllü Yazılım Görevi Başlatıldı" : "1.5 SOL Cüzdana Gönderildi (4fb...X2)"}
                       </span>
                   </div>
               ))}
           </div>
       </div>

       <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.reload()}>
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-cyan-500/10"><img src="/logo.png" className="w-full h-full object-cover" alt="Logo" /></div>
              <div className="flex flex-col leading-none"><span className="text-xl font-black italic uppercase">POD.</span><span className="text-[7px] font-black text-cyan-500 uppercase tracking-widest mt-1">Protocol</span></div>
          </div>
           <div className="flex items-center gap-4">
                {!authenticated ? (
                    <button onClick={login} className="bg-white text-black px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all">GİRİŞ YAP / CÜZDAN BAĞLA</button>
                ) : (
                    <>
                        <button onClick={() => setIsCreateOpen(true)} className="bg-cyan-500 text-black px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all">Meydan Okuma Başlat</button>
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                            <button onClick={getBalance} className="px-6 py-3 border-r border-white/5 flex flex-col items-end hover:bg-white/5 transition-all text-sm font-black text-cyan-400">{balance !== null ? `${balance.toFixed(4)} SOL` : '0.0000 SOL'}</button>
                            <button onClick={() => setIsSettingsOpen(true)} className="h-12 px-5 hover:bg-white/5 transition-all group border-r border-white/5 text-lg">⚙️</button>
                            <button onClick={() => { logout(); showNotification("Çıkış yapıldı."); }} className="h-12 px-6 text-[9px] font-black uppercase tracking-widest hover:text-red-400 transition-all">Çıkış</button>
                        </div>
                    </>
                )}
           </div>
       </nav>

       <header className="max-w-7xl mx-auto mb-20 text-center py-20 px-6">
           <h1 className="text-4xl md:text-[5rem] font-black italic uppercase tracking-tighter leading-[0.8] mb-10">MEYDAN OKU.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">KANITLA.</span><br/>KAZAN.</h1>
       </header>
       
       <div className="max-w-7xl mx-auto px-4 md:px-6 mb-40">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                {dares.map((dare, idx) => (
                    <div key={`dare-${dare.pubkey}-${idx}`} onClick={() => { setSelectedDare(dare); setIsDetailOpen(true); }} className="group relative bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden hover:border-cyan-500/40 transition-all duration-500 cursor-pointer flex flex-col h-full shadow-2xl">
                        <div className="w-full h-48 md:h-64 bg-black relative overflow-hidden">
                            <img src={dare.customImg || CATEGORIES.find(c => c.id === dare.category)?.img} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt="cover" />
                            <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-black/60 backdrop-blur-xl px-3 py-1 md:px-4 md:py-2 rounded-xl border border-white/10 text-[7px] md:text-[8px] font-black text-cyan-400 uppercase tracking-widest">{dare.category}</div>
                            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-cyan-500/10 backdrop-blur-xl px-3 py-1 md:px-4 md:py-2 rounded-xl border border-cyan-500/20 text-[9px] md:text-[10px] font-black text-cyan-400">{dare.amount} SOL</div>
                        </div>
                        <div className="p-6 md:p-10 flex flex-col flex-1 gap-4 md:gap-8">
                            <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-[0.9] min-h-[3rem] md:min-h-[4.5rem] line-clamp-2">{dare.title}</h3>
                            <div className="flex items-center gap-3 md:gap-4">
                                {((dare.challenger === 'SYSTEM' && publicKey?.toBase58() === PLATFORM_WALLET) || (publicKey && dare.challenger === publicKey.toBase58())) && (
                                    <div className="flex-1 flex gap-2">
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            const shareUrl = `https://dial.to/?action=solana-action:${window.location.origin}/api/actions/submit-proof?dare=${dare.pubkey}`;
                                            window.open(`https://twitter.com/intent/tweet?text=Yeni bir meydan okuma başlattım! 🔥 @proofofdaree %23Solana&url=${encodeURIComponent(shareUrl)}`, '_blank');
                                        }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-[7px] md:text-[8px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">BLINK PAYLAŞ 🐦</button>
                                        
                                        <button onClick={(e) => handleDeleteDare(dare.pubkey, e)} className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-[7px] md:text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all">SİL</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                <div className="flex flex-col gap-1"><span className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-widest">KALAN SÜRE</span><Countdown deadline={dare.deadline} /></div>
                                <span className="text-[8px] md:text-[9px] font-black text-slate-400">🔥 {dare.applicants?.length || 0} ADAY</span>
                            </div>
                        </div>
                   </div>
               ))}
           </div>
       </div>

       {isDetailOpen && selectedDare && (
           <div className="fixed inset-0 bg-black/95 backdrop-blur-[50px] z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-[#0A0A0A] w-full max-w-7xl h-[90vh] rounded-[4.5rem] overflow-hidden border border-white/10 flex flex-col lg:flex-row relative shadow-[0_0_100px_rgba(0,0,0,1)]">
                   <button onClick={() => setIsDetailOpen(false)} className="absolute top-10 right-10 z-50 h-14 w-14 bg-white/5 rounded-2xl hover:bg-white hover:text-black flex items-center justify-center transition-all text-xl">✕</button>
                   <div className="w-full lg:w-5/12 h-full bg-black relative border-r border-white/5">
                       <img src={selectedDare.customImg || CATEGORIES.find(c => c.id === selectedDare.category)?.img} className="w-full h-full object-cover opacity-40 grayscale" alt="detail art" />
                       <div className="absolute bottom-20 left-20 right-20 text-center lg:text-left">
                           <h2 className="text-5xl font-black italic uppercase leading-[0.8] tracking-tighter mb-8">{selectedDare.title}</h2>
                       </div>
                   </div>
                   <div className="w-full lg:w-7/12 p-16 md:p-24 overflow-y-auto bg-[#0A0A0A] custom-scrollbar">
                        <div className="mb-20 bg-white/[0.03] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl">
                            <h3 className="text-2xl font-black italic uppercase mb-8 text-cyan-400 text-center">X & YouTube Kanıt Gönder</h3>
                            <div className="mb-10 p-8 bg-black/40 border border-white/10 rounded-3xl">
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6"><div className={`h-full transition-all duration-1000 ease-out ${realTimeAiScore >= 77 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${realTimeAiScore}%` }}></div></div>
                                <div className="flex justify-between items-center mb-4"><span className={`text-sm font-black ${realTimeAiScore >= 77 ? 'text-green-400' : 'text-red-400'}`}>ÖN ANALİZ SKORU: %{realTimeAiScore}</span><span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">HEDEF: %77</span></div>
                                <div className={`p-4 rounded-xl border text-[10px] font-black uppercase text-center ${realTimeAiScore >= 77 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{aiStatusMsg}</div>
                            </div>
                            <div className="space-y-6">
                                <input value={newProof.url} onChange={e => setNewProof({...newProof, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:border-cyan-500 outline-none" placeholder="Video Linki (YouTube / X)" />
                                <textarea value={newProof.desc} onChange={e => setNewProof({...newProof, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs h-32 resize-none focus:border-cyan-500 outline-none" placeholder="Görevi nasıl yaptığınızı anlatın..."></textarea>
                                <button onClick={handleSubmitProof} disabled={realTimeAiScore < 77} className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase transition-all ${realTimeAiScore >= 77 ? 'bg-cyan-500 text-black hover:bg-white' : 'bg-white/5 text-slate-600 cursor-not-allowed opacity-50'}`}>ÖDEME YAP VE GÖNDER</button>
                            </div>
                        </div>

                       <div className="space-y-12">
                           <div className="flex items-center justify-between">
                               <h3 className="text-xl font-black italic uppercase">HALK OYLAMASI</h3>
                               <button onClick={handleClearAll} className="text-[8px] font-black text-red-500 uppercase border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all">TEMİZLE</button>
                           </div>
                            {(!selectedDare.applicants || selectedDare.applicants.length === 0) ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                    <div className="text-5xl mb-6 grayscale opacity-30">💀</div>
                                    <h4 className="text-xl font-black italic uppercase text-slate-500 mb-2">Henüz Kimse Cesaret Edemedi!</h4>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">İlk kanıtı sen gönder, ödül havuzundan payını al.</p>
                                </div>
                            ) : selectedDare.applicants.map((app, index) => (
                               <div key={`applicant-${app.id}-${index}-${app.address.substring(0, 5)}`} className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col gap-8 group relative overflow-hidden">
                                   <div className="flex items-center gap-8">
                                       <div className="h-20 w-20 bg-slate-800 rounded-3xl overflow-hidden"><img src={app.img} className="w-full h-full object-cover" alt="app" /></div>
                                       <div className="flex flex-col items-start gap-4">
                                           <p className="text-[10px] font-mono text-slate-500">{app.address.substring(0, 8)}...{app.address.substring(app.address.length - 4)}</p>
                                            <div className="flex items-center gap-4">
                                                <a href={app.proofUrl} target="_blank" className="text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors">VİDEOYU İZLE ↗</a>
                                                
                                                <div className="flex items-center bg-black/40 rounded-xl px-3 py-1 border border-white/5 gap-3">
                                                    <button onClick={() => handleVote(app.id, true)} className="text-[10px] hover:scale-125 transition-transform">👍 <span className="ml-1 text-green-400 font-black">{app.likes || 0}</span></button>
                                                    <div className="w-[1px] h-3 bg-white/10"></div>
                                                    <button onClick={() => handleVote(app.id, false)} className="text-[10px] hover:scale-125 transition-transform">👎 <span className="ml-1 text-red-400 font-black">{app.dislikes || 0}</span></button>
                                                </div>

                                                {(publicKey && app.address === publicKey.toBase58()) && (
                                                   <button onClick={() => {
                                                       const shareUrl = `https://dial.to/?action=solana-action:${window.location.origin}/api/actions/submit-proof?dare=${selectedDare.pubkey}`;
                                                       window.open(`https://twitter.com/intent/tweet?text=Bu meydan okumayı @proofofdaree ile başarıyla tamamladım! 🔥 %23Solana&url=${encodeURIComponent(shareUrl)}`, '_blank');
                                                   }} className="text-[8px] font-black text-white/40 uppercase hover:text-cyan-400 transition-all">KANITI PAYLAŞ 🐦</button>
                                               )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-2 max-w-xs italic line-clamp-2">{app.description}</p>
                                            
                                            {app.aiScore && (
                                                <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">AI DENETİM SKORU</span>
                                                        <span className="text-[10px] font-black text-cyan-400">%{app.aiScore}</span>
                                                    </div>
                                                    <p className="text-[9px] font-medium text-slate-300 leading-relaxed">{app.aiComment}</p>
                                                </div>
                                            )}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           </div>
       )}

       {isCreateOpen && (
           <div className="fixed inset-0 bg-black/98 backdrop-blur-[100px] z-[500] flex items-center justify-center p-6 animate-in fade-in duration-500">
               <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-[4.5rem] p-16 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">MEYDAN OKUMA BAŞLAT</h2>
                   <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                           {CATEGORIES.map(cat => (
                               <button key={cat.id} onClick={() => setNewDare({...newDare, category: cat.id})} className={`p-6 rounded-3xl border transition-all text-left ${newDare.category === cat.id ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                   <span className="text-2xl mb-2 block">{cat.icon}</span>
                                   <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                               </button>
                           ))}
                       </div>
                       <input value={newDare.title} onChange={e => setNewDare({...newDare, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-sm focus:border-cyan-500 outline-none" placeholder="Meydan Okuma Başlığı (Örn: 50 Şınav Çek)" />
                       <textarea value={newDare.description} onChange={e => setNewDare({...newDare, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-sm h-32 resize-none focus:border-cyan-500 outline-none" placeholder="Detaylı kuralları buraya yazın..."></textarea>
                       <div className="grid grid-cols-2 gap-6">
                           <div><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">ÖDÜL MİKTARI (SOL)</p><input type="number" value={newDare.amount} onChange={e => setNewDare({...newDare, amount: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm focus:border-cyan-500 outline-none" /></div>
                           <div><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">SÜRE (SAAT)</p><input type="number" value={newDare.hours} onChange={e => setNewDare({...newDare, hours: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm focus:border-cyan-500 outline-none" /></div>
                       </div>
                       <button onClick={handleLaunchDare} className="w-full py-8 bg-cyan-500 text-black rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_50px_rgba(34,211,238,0.3)]">MEYDAN OKUMAYI BAŞLAT ({(newDare.amount + PLATFORM_FEE_LAUNCH).toFixed(3)} SOL)</button>
                       <button onClick={() => setIsCreateOpen(false)} className="w-full text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all">VAZGEÇ</button>
                   </div>
               </div>
           </div>
       )}

       {isSettingsOpen && (
           <div className="fixed inset-0 bg-black/98 backdrop-blur-[80px] z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl rounded-[4.5rem] p-16 shadow-2xl relative">
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-16">AYARLAR</h2>
                   <div className="space-y-6">
                       <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                           <button onClick={() => setSettingsTab('account')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${settingsTab === 'account' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>HESAP</button>
                           <button onClick={() => setSettingsTab('rewards')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${settingsTab === 'rewards' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>ÖDÜLLERİM 💰</button>
                       </div>
                       {settingsTab === 'account' ? (
                           <>
                               <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                                   <div className="flex items-center justify-between mb-4"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">X (TWITTER)</p>{twitterHandle ? <span className="text-green-400 text-[8px] font-black uppercase">BAĞLANDI</span> : <button onClick={linkTwitter} className="bg-white text-black px-6 py-2 rounded-xl text-[8px] font-black uppercase">BAĞLA</button>}</div>
                                   <p className="text-sm font-bold">{twitterHandle ? `@${twitterHandle}` : 'Bağlı Değil'}</p>
                               </div>
                               <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                                   <div className="flex items-center justify-between mb-4"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">GOOGLE / YOUTUBE</p>{googleEmail ? <span className="text-green-400 text-[8px] font-black uppercase">BAĞLANDI</span> : <button onClick={linkGoogle} className="bg-white text-black px-6 py-2 rounded-xl text-[8px] font-black uppercase">BAĞLA</button>}</div>
                                   <p className="text-sm font-bold">{googleEmail ? googleEmail : 'Bağlı Değil'}</p>
                               </div>
                               <div className="pt-8 border-t border-white/5">
                                   <button onClick={async () => {
                                       if (supabase) {
                                           const { error } = await supabase.from('dares').update({ applicants: [] }).neq('pubkey', '');
                                           if (!error) {
                                               const resetDares = dares.map(d => ({ ...d, applicants: [] }));
                                               setDares(resetDares);
                                               showNotification("Tüm veritabanı sıfırlandı!");
                                           } else {
                                               showNotification("Sıfırlama Hatası!", "WARN");
                                           }
                                       }
                                       setIsSettingsOpen(false);
                                   }} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">SİSTEMİ SIFIRLA</button>
                               </div>
                           </>
                       ) : (
                           <div className="space-y-4">
                               <p className="text-[10px] font-black text-slate-500 uppercase text-center mb-8 tracking-widest">KAZANILAN ÖDÜLLER VE DAĞITIM</p>
                               <div className="bg-[#0D0D0D] border border-cyan-500/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                   <div className="flex flex-col gap-6 relative z-10">
                                       <div className="flex justify-between items-start">
                                           <div><h4 className="text-lg font-black uppercase italic text-white mb-1">100 Şınav Meydan Okuması</h4><p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">DURUM: KAZANDIN 🏆</p></div>
                                           <div className="text-right"><p className="text-2xl font-black text-white italic">1.50 SOL</p><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">BRÜT ÖDÜL</p></div>
                                       </div>
                                       <div className="space-y-2 py-6 border-y border-white/5">
                                           <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Platform Komisyonu (%10)</span><span className="text-red-400">- 0.15 SOL</span></div>
                                           <div className="flex justify-between text-xs font-black uppercase text-cyan-400"><span>Cüzdanınıza Geçecek Net Tutar</span><span>1.35 SOL</span></div>
                                       </div>
                                       <button onClick={async () => {
                                           try {
                                               // 1. ÖNİZLEME BİLDİRİMİ
                                               showNotification("Vault Onayı Bekleniyor... 🔐");
                                               
                                               // 2. GERÇEK İMZA TALEBİ (Claim Authorization)
                                               const signature = await performTransfer(0.001); 
                                               
                                               // 3. BAŞARILI AKTARIM EKRANI
                                               showNotification(`🎉 1.35 SOL KASADAN ÇEKİLDİ VE HESABINIZA TANIMLANDI!`, signature);
                                               
                                               // 4. CANLI BAKİYE GÜNCELLEMESİ (Efektli)
                                               let currentBalance = balance || 0;
                                               const targetBalance = currentBalance + 1.35;
                                               const step = 0.05;
                                               const interval = setInterval(() => {
                                                   if (currentBalance >= targetBalance) {
                                                       setBalance(targetBalance);
                                                       clearInterval(interval);
                                                   } else {
                                                       currentBalance += step;
                                                       setBalance(currentBalance);
                                                   }
                                               }, 50);

                                               setIsSettingsOpen(false);
                                           } catch (e: any) { showNotification(e.message || "Claim Hatası!", "WARN"); }
                                       }} className="w-full py-5 bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all shadow-[0_0_50px_rgba(34,211,238,0.4)]">ÖDÜLÜ TALEBİ (CLAIM 1.35 SOL)</button>
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="mt-12 w-full py-4 bg-white/5 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">✕ KAPAT</button>
               </div>
           </div>
       )}
       {/* FLOATING NOTIFICATIONS SYSTEM (SAĞ ALT) */}
       <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-4 pointer-events-none">
           {notifications.map((n) => (
               <div key={n.id} className="pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-500">
                   <div className={`min-w-[350px] backdrop-blur-3xl border p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 ${n.type === 'WARN' ? 'bg-red-500/20 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                       <div className="flex items-center gap-4">
                           <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-lg ${n.type === 'WARN' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                               {n.type === 'WARN' ? '🛡️' : '🔔'}
                           </div>
                           <p className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">{n.message}</p>
                       </div>
                       {n.tx && (
                           <a href={`https://solscan.io/tx/${n.tx}`} target="_blank" className="text-[9px] font-mono text-cyan-500 hover:text-white transition-colors break-all bg-black/40 p-3 rounded-xl border border-white/5">
                               TX: {n.tx.substring(0, 24)}...
                           </a>
                       )}
                   </div>
               </div>
           ))}
       </div>
    </main>
  );
}
