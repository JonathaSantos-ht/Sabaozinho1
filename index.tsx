
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- Tipagens ---
interface ExtraItem {
  name: string;
  quantity: number;
}

interface PieceBreakdown {
  camisa: number;
  moletom: number;
  camiseta: number;
  calca: number;
  terno: number;
  tbanho: number;
  trosto: number;
  lencol: number;
  extraItems: ExtraItem[];
}

interface Appointment {
  id: string;
  name: string;
  phone: string;
  quantity: number;
  breakdown: PieceBreakdown;
  services: string[];
  date: string;
  time: string;
  obs: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'Pendente' | 'Lavando' | 'Pronto' | 'Entregue';
}

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface MonthlyStat {
  monthYear: string;
  totalOrders: number;
  totalPieces: number;
  servicesBreakdown: Record<string, number>;
  piecesBreakdown: {
    camisa: number;
    moletom: number;
    camiseta: number;
    calca: number;
    terno: number;
    tbanho: number;
    trosto: number;
    lencol: number;
    extras: number;
  };
}

// --- Dados Iniciais ---
const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Lavagem Profissional', icon: '👕', description: 'Tratamento completo para roupas brancas e coloridas do dia a dia.' },
  { id: '2', name: 'Roupas Delicadas', icon: '🎀', description: 'Processo ultra-suave para rendas, sedas e vestidos delicados.' },
  { id: '3', name: 'Linha Executiva', icon: '👔', description: 'Lavagem e passadoria impecável para ternos e camisaria social.' },
  { id: '4', name: 'Cama e Banho', icon: '🏡', description: 'Higienização profunda de edredons, montas e peças de cama.' },
  { id: '5', name: 'Limpeza de Calçados', icon: '👟', description: 'Restauração e limpeza detalhada de calçados esportivos e casuais.' },
  { id: '6', name: 'Passadoria Master', icon: '💨', description: 'Sua roupa impecável e pronta para o uso, passada com cuidado e precisão milimétrica.' }
];

const PIECE_LABELS: Record<string, { label: string; icon: string }> = {
  camisa: { label: 'Camisas', icon: '👔' },
  moletom: { label: 'Moletons', icon: '🧥' },
  camiseta: { label: 'Camisetas', icon: '👕' },
  calca: { label: 'Calças', icon: '👖' },
  terno: { label: 'Ternos', icon: '🕴️' },
  tbanho: { label: 'T. Banho', icon: '🛁' },
  trosto: { label: 'T. Rosto', icon: '🧼' },
  lencol: { label: 'Lençóis', icon: '🛏️' },
  extras: { label: 'Itens Extras', icon: '📦' }
};

// --- Componente Principal ---
const App = () => {
  const [view, setView] = useState<'home' | 'services' | 'login' | 'admin'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [services, setServices] = useState<Service[]>(() => JSON.parse(localStorage.getItem('sbz_services_v6') || JSON.stringify(DEFAULT_SERVICES)));
  const [appointments, setAppointments] = useState<Appointment[]>(() => JSON.parse(localStorage.getItem('sbz_appts_v6') || '[]'));
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [adminTab, setAdminTab] = useState<'appts' | 'svcs' | 'reports'>('appts');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);

  useEffect(() => {
    localStorage.setItem('sbz_services_v6', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('sbz_appts_v6', JSON.stringify(appointments));
  }, [appointments]);

  const navigateTo = (newView: 'home' | 'services' | 'login' | 'admin') => {
    setView(newView);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const openBooking = (preSelected: string[] = []) => {
    setSelectedServices(preSelected);
    setExtraItems([]);
    setIsBookingOpen(true);
  };

  const addExtraItemRow = () => setExtraItems([...extraItems, { name: '', quantity: 1 }]);
  const removeExtraItemRow = (index: number) => setExtraItems(extraItems.filter((_, i) => i !== index));
  const updateExtraItem = (index: number, field: keyof ExtraItem, value: string | number) => {
    const updated = [...extraItems];
    if (field === 'quantity') updated[index].quantity = Math.max(1, Number(value));
    else updated[index].name = String(value);
    setExtraItems(updated);
  };

  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fixedPieces = {
      camisa: parseInt(formData.get('q-camisa') as string) || 0,
      moletom: parseInt(formData.get('q-moletom') as string) || 0,
      camiseta: parseInt(formData.get('q-camiseta') as string) || 0,
      calca: parseInt(formData.get('q-calca') as string) || 0,
      terno: parseInt(formData.get('q-terno') as string) || 0,
      tbanho: parseInt(formData.get('q-tbanho') as string) || 0,
      trosto: parseInt(formData.get('q-trosto') as string) || 0,
      lencol: parseInt(formData.get('q-lencol') as string) || 0,
    };
    const validExtraItems = extraItems.filter(item => item.name.trim() !== '');
    const breakdown: PieceBreakdown = { ...fixedPieces, extraItems: validExtraItems };
    const totalQty = Object.values(fixedPieces).reduce((a, b) => a + b, 0) + validExtraItems.reduce((a, b) => a + b.quantity, 0);

    if (totalQty === 0) return alert("Adicione pelo menos uma peça.");
    if (selectedServices.length === 0) return alert("Selecione ao menos um serviço.");

    const newAppt: Appointment = {
      id: Date.now().toString(),
      name: formData.get('b-name') as string,
      phone: formData.get('b-phone') as string,
      quantity: totalQty,
      breakdown,
      services: selectedServices,
      date: formData.get('b-date') as string,
      time: formData.get('b-time') as string,
      obs: formData.get('b-obs') as string,
      pickupAddress: formData.get('b-pickup') as string || '',
      deliveryAddress: formData.get('b-delivery') as string || '',
      status: 'Pendente'
    };
    setAppointments(prev => [...prev, newAppt]);
    alert("Agendamento solicitado com sucesso!");
    setIsBookingOpen(false);
  };

  const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newService: Service = {
      id: Date.now().toString(),
      name: formData.get('s-name') as string,
      icon: formData.get('s-icon') as string || '✨',
      description: formData.get('s-desc') as string,
    };
    setServices(prev => [...prev, newService]);
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Deseja remover este serviço permanentemente?")) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;

    if (user === 'dono1' && pass === '312546!!') {
      setIsLoggedIn(true);
      setView('admin');
    } else {
      alert("Login ou senha incorretos.");
    }
  };

  const monthlyStats = useMemo(() => {
    const stats: Record<string, MonthlyStat> = {};
    appointments.forEach(appt => {
      const date = new Date(appt.date);
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthYear = `${monthNames[date.getMonth()]} / ${date.getFullYear()}`;
      
      if (!stats[monthYear]) {
        stats[monthYear] = {
          monthYear,
          totalOrders: 0,
          totalPieces: 0,
          servicesBreakdown: {},
          piecesBreakdown: { camisa: 0, moletom: 0, camiseta: 0, calca: 0, terno: 0, tbanho: 0, trosto: 0, lencol: 0, extras: 0 }
        };
      }
      
      const s = stats[monthYear];
      s.totalOrders += 1;
      s.totalPieces += appt.quantity;
      appt.services.forEach(svc => s.servicesBreakdown[svc] = (s.servicesBreakdown[svc] || 0) + 1);
      
      const b = appt.breakdown;
      s.piecesBreakdown.camisa += b.camisa || 0;
      s.piecesBreakdown.moletom += b.moletom || 0;
      s.piecesBreakdown.camiseta += b.camiseta || 0;
      s.piecesBreakdown.calca += b.calca || 0;
      s.piecesBreakdown.terno += b.terno || 0;
      s.piecesBreakdown.tbanho += b.tbanho || 0;
      s.piecesBreakdown.trosto += b.trosto || 0;
      s.piecesBreakdown.lencol += b.lencol || 0;
      s.piecesBreakdown.extras += b.extraItems?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
    });
    return Object.values(stats);
  }, [appointments]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* NAVEGAÇÃO */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-4">
        <div className="max-w-6xl mx-auto glass rounded-3xl h-20 px-8 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-brand-200 shadow-lg transition-transform group-hover:scale-105">S</div>
            <span className="text-2xl font-extrabold tracking-tight text-brand-900 group-hover:text-brand-600 transition-colors">Sabãozinho</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigateTo('home')} className={`text-sm font-bold transition-all ${view === 'home' ? 'text-brand-600' : 'text-neutral-600 hover:text-brand-600'}`}>Início</button>
            <button onClick={() => navigateTo('services')} className={`text-sm font-bold transition-all ${view === 'services' ? 'text-brand-600' : 'text-neutral-600 hover:text-brand-600'}`}>Serviços</button>
            <button onClick={() => isLoggedIn ? navigateTo('admin') : navigateTo('login')} className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-md">
              {isLoggedIn ? 'Painel' : 'Proprietário'}
            </button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 bg-brand-50 text-brand-600 rounded-xl">
            {isMobileMenuOpen ? '✖' : '☰'}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-4 top-28 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 animate-fade-in border border-white/50">
            <div className="flex flex-col space-y-4">
              <button onClick={() => navigateTo('home')} className="p-4 bg-brand-50 rounded-2xl text-brand-900 font-bold text-left">🏠 Início</button>
              <button onClick={() => navigateTo('services')} className="p-4 bg-brand-50 rounded-2xl text-brand-900 font-bold text-left">🧺 Serviços</button>
              <button onClick={() => isLoggedIn ? navigateTo('admin') : navigateTo('login')} className="p-4 bg-brand-600 text-white rounded-2xl font-bold text-left">👤 {isLoggedIn ? 'Painel Administrativo' : 'Área do Proprietário'}</button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow pt-32 px-4 md:px-8">
        {/* VISTAS */}
        {view === 'home' && (
          <div className="space-y-32 mb-20">
            {/* HERO SECTION */}
            <section className="animate-fade-in max-w-7xl mx-auto py-12 lg:grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-block px-4 py-2 mb-6 text-xs font-black text-brand-600 bg-brand-50 rounded-full uppercase tracking-widest border border-brand-100">✨ Lavanderia 5 Estrelas</div>
                <h1 className="text-6xl md:text-7xl font-extrabold mb-8 text-neutral-dark tracking-tighter leading-tight">Suas roupas <br/><span className="text-brand-600">merecem esse brilho.</span></h1>
                <p className="text-lg text-neutral-500 mb-10 max-w-md leading-relaxed">Deixe o trabalho pesado conosco. Lavagem profissional e entrega rápida direto na sua porta.</p>
                <div className="flex gap-4">
                  <button onClick={() => openBooking()} className="px-10 py-5 bg-brand-600 text-white font-bold rounded-3xl shadow-xl hover:bg-brand-700 transition-all">Solicitar Coleta</button>
                  <button onClick={() => navigateTo('services')} className="px-10 py-5 bg-white text-neutral-dark font-bold rounded-3xl border shadow-sm hover:bg-neutral-50 transition-all">Ver Serviços</button>
                </div>
              </div>
              <div className="hidden lg:block">
                <img src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=2071&auto=format&fit=crop" className="rounded-[4rem] shadow-2xl floating border-8 border-white object-cover aspect-square" />
              </div>
            </section>

            {/* CURADORIA DE CUIDADOS - 6 TIPS GUIDE */}
            <section className="max-w-7xl mx-auto py-20 px-6 bg-white rounded-[4rem] shadow-sm border border-brand-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="relative z-10 text-center max-w-3xl mx-auto mb-20">
                  <span className="text-brand-600 font-black text-[10px] uppercase tracking-widest mb-4 block">Guia de Conservação</span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-dark mb-6">Pequenos hábitos, <span className="text-brand-500">grandes resultados.</span></h2>
                  <p className="text-neutral-500 text-lg">Confira nossas 6 dicas essenciais para manter suas peças favoritas com aspecto de novas por muito mais tempo.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {[
                    { title: "Lave do Avesso", desc: "Isso protege as fibras externas e evita o desbotamento precoce e bolinhas indesejadas.", icon: "🔄", color: "bg-brand-50" },
                    { title: "Água Fria Sempre", desc: "A água quente encolhe as fibras e pode danificar permanentemente tecidos como seda.", icon: "❄️", color: "bg-blue-50" },
                    { title: "Menos é Mais", desc: "O excesso de sabão impregna no tecido, deixando as roupas rígidas e opacas após a secagem.", icon: "🧼", color: "bg-emerald-50" },
                    { title: "Secagem à Sombra", desc: "O sol direto queima as cores e resseca as fibras. Seque sempre em locais ventilados.", icon: "☂️", color: "bg-orange-50" },
                    { title: "Use Cabides", desc: "Evite dobras permanentes em camisas e vestidos usando cabides adequados de madeira.", icon: "👔", color: "bg-purple-50" },
                    { title: "Zíperes Fechados", desc: "Feche zíperes e colchetes antes de lavar para evitar que prendam e desfiem outras peças.", icon: "🔗", color: "bg-rose-50" }
                  ].map((item, idx) => (
                    <div key={idx} className="group cursor-default h-full">
                      <div className={`relative p-10 rounded-[2.5rem] h-full shadow-sm border border-white flex flex-col items-center justify-center text-center transition-all group-hover:shadow-xl group-hover:-translate-y-2 ${item.color}`}>
                        <div className="text-6xl mb-6 group-hover:scale-125 transition-transform duration-500">{item.icon}</div>
                        <h4 className="text-xl font-bold text-neutral-dark mb-4">{item.title}</h4>
                        <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
               </div>

               {/* SEÇÃO CHAMATIVA DE CUIDADO PROFISSIONAL */}
               <div className="mt-20 p-12 bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-900 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 space-y-8">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Cuidado Profissional Sabãozinho</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black leading-tight">
                       Suas roupas merecem <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-white">tratamento real.</span>
                    </h3>
                    <p className="text-brand-100 max-w-3xl mx-auto text-lg md:text-2xl font-light leading-relaxed">
                      Tecidos finos como linho, seda e lã exigem técnica. No Sabãozinho, utilizamos os melhores processos para preservar a maciez e as cores de suas peças favoritas.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                      <button onClick={() => navigateTo('services')} className="group flex items-center justify-center gap-3 px-14 py-6 bg-white text-brand-900 font-black rounded-3xl shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
                        <span>Nossos Serviços</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                      <button onClick={() => openBooking()} className="px-14 py-6 bg-brand-500/30 backdrop-blur-md border border-white/40 text-white font-bold rounded-3xl hover:bg-white/10 transition-all">
                        Solicitar Coleta
                      </button>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {view === 'services' && (
          <section className="animate-fade-in max-w-7xl mx-auto py-20 px-4">
            <div className="text-center mb-20 space-y-4">
              <span className="inline-block px-4 py-2 bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-brand-200">Menu de Cuidados</span>
              <h2 className="text-5xl md:text-6xl font-black text-neutral-dark tracking-tighter">O que podemos <span className="text-brand-600">lavar hoje?</span></h2>
              <p className="text-neutral-500 max-w-2xl mx-auto text-lg">Soluções completas para todos os tipos de tecidos e ocasiões. Escolha o serviço ideal para suas necessidades.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.map((s, idx) => (
                <div 
                  key={s.id} 
                  className="group relative bg-white rounded-[3rem] p-10 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.08)] border border-brand-50/50 hover:shadow-[0_40px_80px_-20px_rgba(124,58,237,0.15)] hover:border-brand-200 transition-all duration-500 flex flex-col h-full"
                >
                  {/* Accent Line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-brand-200 rounded-b-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Service Number/Tag */}
                  <div className="absolute top-8 right-8 text-[10px] font-black text-brand-100 uppercase tracking-widest group-hover:text-brand-400 transition-colors">
                    Service 0{idx + 1}
                  </div>

                  {/* Icon Wrapper */}
                  <div className="mb-10 relative">
                    <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-5xl group-hover:bg-brand-100 group-hover:rotate-6 transition-all duration-500 shadow-sm border border-brand-100/30">
                      {s.icon}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-200 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-500">
                      <span className="text-sm font-bold">✨</span>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-grow space-y-4 mb-10">
                    <h3 className="text-2xl font-black text-brand-900 tracking-tight group-hover:text-brand-600 transition-colors">{s.name}</h3>
                    <div className="w-10 h-1 bg-brand-100 group-hover:w-20 transition-all duration-500 rounded-full"></div>
                    <p className="text-neutral-500 leading-relaxed font-medium">{s.description}</p>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => openBooking([s.name])} 
                    className="w-full flex items-center justify-between px-8 py-5 bg-brand-50 group-hover:bg-brand-600 text-brand-700 group-hover:text-white font-black rounded-2xl transition-all duration-300"
                  >
                    <span>Solicitar agora</span>
                    <span className="text-xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'login' && (
          <section className="animate-fade-in max-w-md mx-auto py-24">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border">
              <h2 className="text-2xl font-black text-center mb-10">Acesso Restrito</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Usuário</label>
                  <input name="user" required placeholder="Digite seu usuário" className="w-full p-5 bg-neutral-50 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Senha</label>
                  <input name="pass" type="password" required placeholder="Digite sua senha" className="w-full p-5 bg-neutral-50 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <button type="submit" className="w-full py-5 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:bg-brand-700 transition-all">Entrar</button>
              </form>
            </div>
          </section>
        )}

        {view === 'admin' && (
          <section className="animate-fade-in max-w-7xl mx-auto py-12">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-extrabold text-neutral-dark">Painel Administrativo</h1>
                <p className="text-neutral-500">Gestão e Relatórios da Sabãozinho</p>
              </div>
              <button onClick={() => { setIsLoggedIn(false); setView('home'); }} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold">Sair</button>
            </div>

            <div className="flex flex-wrap gap-4 mb-10 p-2 bg-white rounded-3xl w-fit shadow-sm border">
              <button onClick={() => setAdminTab('appts')} className={`px-8 py-3 rounded-2xl font-bold transition-all ${adminTab === 'appts' ? 'bg-brand-600 text-white' : 'text-neutral-500 hover:text-brand-400'}`}>📋 Pedidos</button>
              <button onClick={() => setAdminTab('svcs')} className={`px-8 py-3 rounded-2xl font-bold transition-all ${adminTab === 'svcs' ? 'bg-brand-600 text-white' : 'text-neutral-500 hover:text-brand-400'}`}>🛠️ Serviços</button>
              <button onClick={() => setAdminTab('reports')} className={`px-8 py-3 rounded-2xl font-bold transition-all ${adminTab === 'reports' ? 'bg-brand-600 text-white' : 'text-neutral-500 hover:text-brand-400'}`}>📊 Relatórios Mensais</button>
            </div>

            {adminTab === 'appts' && (
              <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                      <th className="px-8 py-6">Cliente / Contato</th>
                      <th className="px-8 py-6">Peças Detalhadas</th>
                      <th className="px-8 py-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {appointments.slice().reverse().map(a => (
                      <tr key={a.id} className="hover:bg-neutral-50">
                        <td className="px-8 py-6">
                          <div className="font-bold">{a.name}</div>
                          <div className="text-brand-600 font-medium text-xs">{a.phone}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(a.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-8 py-6 max-w-sm">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(a.breakdown).map(([k, v]) => {
                              if (typeof v === 'number' && v > 0 && PIECE_LABELS[k]) {
                                return <span key={k} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] rounded font-bold">{PIECE_LABELS[k].icon} {v}</span>;
                              }
                              return null;
                            })}
                            {a.breakdown.extraItems.map((ex, i) => (
                              <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded font-bold">📦 {ex.name}: {ex.quantity}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <select 
                            value={a.status} 
                            onChange={(e) => setAppointments(prev => prev.map(item => item.id === a.id ? {...item, status: e.target.value as any} : item))}
                            className="p-2 bg-neutral-100 rounded-xl text-xs font-bold outline-none border focus:ring-2 focus:ring-brand-200"
                          >
                            <option value="Pendente">Aguardando</option>
                            <option value="Lavando">Lavando</option>
                            <option value="Pronto">Pronto</option>
                            <option value="Entregue">Entregue</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'svcs' && (
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-brand-100 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                  <h2 className="text-2xl font-extrabold text-neutral-dark">Gestão de Serviços</h2>
                  <button onClick={() => setIsServiceModalOpen(true)} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-brand-200 transition-all">+ Novo Serviço</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(s => (
                    <div key={s.id} className="p-6 bg-neutral-soft rounded-3xl border border-white flex flex-col gap-4 relative group hover:border-brand-200 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{s.icon}</span>
                        <div>
                          <p className="font-bold text-neutral-dark">{s.name}</p>
                          <p className="text-xs text-neutral-400 line-clamp-2">{s.description}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteService(s.id)} className="absolute top-4 right-4 text-red-200 hover:text-red-500 transition-colors p-2 text-xl">
                        🗑️
                      </button>
                    </div>
                  ))}
                  {services.length === 0 && <p className="col-span-full py-10 text-center text-neutral-400 italic">Nenhum serviço cadastrado.</p>}
                </div>
              </div>
            )}

            {adminTab === 'reports' && (
              <div className="space-y-12">
                {monthlyStats.length === 0 ? (
                  <div className="py-20 text-center text-neutral-400 italic">Nenhum dado disponível ainda para relatórios.</div>
                ) : monthlyStats.map(stat => (
                  <div key={stat.monthYear} className="bg-white p-10 rounded-[3rem] shadow-xl border border-brand-100 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                      <h3 className="text-3xl font-extrabold text-neutral-dark flex items-center gap-3">
                        <span className="w-3 h-10 bg-brand-600 rounded-full"></span>
                        {stat.monthYear}
                      </h3>
                      <div className="flex gap-4">
                        <div className="px-6 py-3 bg-brand-50 rounded-2xl text-center">
                          <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Pedidos</div>
                          <div className="text-2xl font-bold text-brand-700">{stat.totalOrders}</div>
                        </div>
                        <div className="px-6 py-3 bg-emerald-50 rounded-2xl text-center">
                          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Peças</div>
                          <div className="text-2xl font-bold text-emerald-700">{stat.totalPieces}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                      {Object.entries(stat.piecesBreakdown).map(([key, value]) => (
                        <div key={key} className="p-6 bg-neutral-soft rounded-3xl border border-white hover:border-brand-100 transition-all group">
                          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{PIECE_LABELS[key]?.icon || '✨'}</div>
                          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{PIECE_LABELS[key]?.label || 'Outros'}</div>
                          <div className="text-2xl font-extrabold text-neutral-dark">{value}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-10 p-6 bg-brand-50/50 rounded-3xl border border-brand-100 flex flex-wrap gap-8 items-center">
                      <div className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Top Serviços do Mês:</div>
                      {Object.entries(stat.servicesBreakdown).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([name, count]) => (
                        <div key={name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                          <span className="text-sm font-bold text-neutral-700">{name}: <span className="text-brand-600">{count}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-brand-100 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-left">
          <div className="space-y-6">
            <div className="text-3xl font-black text-brand-900 tracking-tight">Sabãozinho</div>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xs font-light">Especialistas em cuidado têxtil em Santo Antônio do Amparo. Qualidade profissional para suas roupas mais queridas.</p>
            <div className="p-5 bg-brand-50 rounded-[2rem] border border-brand-100">
              <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Horário de Funcionamento</div>
              <div className="text-xs font-bold text-brand-900 leading-relaxed">
                Segunda a Sexta: 07h às 18:30h<br/>
                Sábado: 07h às 12h
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-sm font-black text-neutral-dark uppercase tracking-widest">Contatos</h4>
            <div className="space-y-6">
              <a href="https://wa.me/5535997501569" target="_blank" className="flex items-center gap-4 text-neutral-600 text-sm group">
                <span className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.631 1.436h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </span>
                <div>
                  <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">WhatsApp</div>
                  <div className="font-bold text-neutral-800">35 99750-1569</div>
                </div>
              </a>
              <a href="https://www.instagram.com/lavanderiasabaozinho?igsh=MXQwODE3OWJ4Z3k0aA==" target="_blank" className="flex items-center gap-4 text-neutral-600 text-sm group">
                <span className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </span>
                <div>
                  <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Instagram</div>
                  <div className="font-bold text-neutral-800">@lavanderiasabaozinho</div>
                </div>
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-black text-neutral-dark uppercase tracking-widest">Localização</h4>
            <div className="flex items-start gap-4 text-neutral-600 text-sm">
              <span className="w-12 h-12 bg-neutral-soft rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </span>
              <div>
                <div className="font-bold text-neutral-800">Lavanderia Sabãozinho</div>
                <div className="font-light leading-relaxed mt-1">
                  Rua Joaquim Luís do Nascimento, 257<br/>
                  Lava-pés, Santo Antônio do Amparo - MG<br/>
                  CEP: 37262-000
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-brand-50">
               <div className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em]">Atendimento Local</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-brand-100/50 text-center">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">© 2025 Sabãozinho Lavanderia - Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* MODAL: BOOKING */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xl">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(124,58,237,0.3)] overflow-hidden max-h-[90vh] flex flex-col animate-fade-in border border-brand-100">
            <div className="p-10 border-b flex justify-between items-center bg-brand-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-200">S</div>
                <div>
                   <h2 className="text-2xl font-black text-brand-900 tracking-tight">Novo Agendamento</h2>
                   <p className="text-brand-400 text-xs font-bold uppercase tracking-widest">Preencha os detalhes abaixo</p>
                </div>
              </div>
              <button onClick={() => setIsBookingOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-neutral-400 hover:text-red-500 hover:rotate-90 transition-all duration-300">
                <span className="text-3xl font-light">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar bg-white">
              
              {/* SEÇÃO DE DATA E HORA EM DESTAQUE */}
              <div className="p-8 bg-brand-900 rounded-[2.5rem] text-white shadow-xl shadow-brand-100/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                   <span className="text-2xl">🗓️</span>
                   <span className="text-sm font-black uppercase tracking-widest opacity-80">Quando deseja sua coleta?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-200">Data Preferencial</label>
                    <input type="date" name="b-date" required className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-brand-900 transition-all text-white font-bold cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-200">Melhor Horário</label>
                    <input type="time" name="b-time" required className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-brand-900 transition-all text-white font-bold cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* DADOS PESSOAIS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Identificação</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input name="b-name" required placeholder="Nome Completo *" className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm" />
                  <input name="b-phone" required placeholder="WhatsApp (DDD) *" className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm" />
                </div>
              </div>

              {/* LOGÍSTICA E ENDEREÇOS (OPCIONAIS) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Logística (Retirada e Entrega)</label>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 items-start animate-fade-in">
                  <span className="text-xl">⚠️</span>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    <strong>Aviso importante:</strong> A solicitação de coleta ou entrega em domicílio terá um acréscimo de taxa no valor final do pedido. Se preferir, você pode trazer as roupas diretamente em nossa unidade.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Endereço de Coleta (Opcional)</label>
                    <input name="b-pickup" placeholder="Rua, número, bairro..." className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Endereço de Entrega (Opcional)</label>
                    <input name="b-delivery" placeholder="Rua, número, bairro..." className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              {/* PEÇAS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Peças</label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 bg-brand-50 rounded-[2.5rem] border border-brand-100/50 shadow-inner">
                  {Object.keys(PIECE_LABELS).map(key => (
                    key !== 'extras' && (
                      <div key={key} className="space-y-2 text-center group">
                        <span className="text-[9px] font-black text-brand-900 uppercase opacity-60 group-hover:opacity-100 transition-opacity block">{PIECE_LABELS[key].label}</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">{PIECE_LABELS[key].icon}</span>
                          <input type="number" name={`q-${key}`} min="0" defaultValue="0" className="w-full p-3 pl-10 border border-brand-200 rounded-xl bg-white text-center font-bold text-brand-900 outline-none focus:ring-2 focus:ring-brand-400" />
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* EXTRAS */}
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Itens Especiais</label>
                  </div>
                  <button type="button" onClick={addExtraItemRow} className="text-[10px] font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl border border-brand-200 hover:bg-brand-600 hover:text-white transition-all">+ Adicionar Outro</button>
                </div>
                <div className="space-y-3">
                  {extraItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center animate-fade-in bg-white p-2 border rounded-2xl shadow-sm">
                      <input value={item.name} onChange={(e) => updateExtraItem(index, 'name', e.target.value)} placeholder="O que é? (Ex: Tapete, Cortina...)" className="flex-grow p-4 bg-neutral-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-brand-200" />
                      <div className="flex items-center gap-2 bg-neutral-50 px-4 rounded-xl border">
                        <span className="text-[9px] font-black text-neutral-400">QTD</span>
                        <input type="number" value={item.quantity} onChange={(e) => updateExtraItem(index, 'quantity', e.target.value)} className="w-12 p-3 bg-transparent text-center font-black text-brand-700 outline-none" />
                      </div>
                      <button type="button" onClick={() => removeExtraItemRow(index)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">✖</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SERVIÇOS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Serviços Desejados</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(s => (
                    <label key={s.id} className={`flex items-center gap-4 p-5 border rounded-3xl cursor-pointer transition-all ${selectedServices.includes(s.name) ? 'bg-brand-900 border-brand-900 text-white shadow-xl shadow-brand-100 scale-[1.02]' : 'bg-white hover:border-brand-200 text-neutral-700'}`}>
                      <input type="checkbox" checked={selectedServices.includes(s.name)} onChange={() => setSelectedServices(prev => prev.includes(s.name) ? prev.filter(x => x !== s.name) : [...prev, s.name])} className="hidden" />
                      <span className="text-3xl">{s.icon}</span>
                      <div className="flex-grow">
                        <span className="text-sm font-black block leading-none mb-1">{s.name}</span>
                        <span className={`text-[10px] leading-tight opacity-60 block line-clamp-1`}>Cuidado profissional especializado</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.includes(s.name) ? 'bg-emerald-400 border-emerald-400' : 'border-neutral-200'}`}>
                        {selectedServices.includes(s.name) && <span className="text-white text-xs">✓</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <textarea name="b-obs" placeholder="Alguma recomendação especial para suas roupas? Digite aqui..." className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[2rem] resize-none h-32 outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm"></textarea>
              </div>

              <div className="flex flex-col gap-4 pt-6">
                 <button type="submit" className="w-full py-7 bg-brand-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all text-xl tracking-tight">Confirmar meu Agendamento</button>
                 <p className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Retiramos e entregamos no seu endereço!</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO SERVIÇO (ADMIN) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-neutral-900/50 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-extrabold text-neutral-dark tracking-tight">Novo Serviço</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-3xl font-light">&times;</button>
            </div>
            <form onSubmit={handleAddService} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Nome</label>
                <input name="s-name" required placeholder="Ex: Lavagem a Seco" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Ícone (Emoji)</label>
                <input name="s-icon" placeholder="🧥" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Descrição</label>
                <textarea name="s-desc" required placeholder="Descreva o serviço..." className="w-full p-4 border rounded-2xl h-28 resize-none outline-none focus:ring-2 focus:ring-brand-500"></textarea>
              </div>
              <button type="submit" className="w-full py-5 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:bg-brand-700 transition-all">Salvar Serviço</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
