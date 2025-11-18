import React, { useState, useEffect, useCallback } from 'react';
import Camera from './Camera';
import { faceService } from '../services/faceService';
import { AuthStatus, DetectionResult } from '../types';
import { ShieldCheck, UserPlus, LogIn, RefreshCw, Trash2, AlertCircle, Scan, Mail, CheckCircle2, LogOut, LayoutDashboard, FileText, Settings, Bell } from 'lucide-react';

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Session State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(null);

  const [message, setMessage] = useState<string>('Initialize camera to begin');
  const [pendingDescriptor, setPendingDescriptor] = useState<Float32Array | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await faceService.loadModels();
        setModelLoaded(true);
        setMessage('System Ready. Enter email to begin.');
      } catch (err) {
        setMessage('Error loading models. Check internet connection.');
        console.error(err);
      }
    };
    init();
  }, []);

  const reset = () => {
    setStatus(AuthStatus.IDLE);
    setPendingDescriptor(null);
    setMessage('Ready.');
    // We do not clear email/name immediately to allow user correction
  };

  const handleFaceDetected = useCallback(async (descriptor: Float32Array, detection: DetectionResult) => {
    if (status !== AuthStatus.IDLE && status !== AuthStatus.DETECTING) return;
    
    if (mode === 'login') {
      // Logic: Must have email entered + Face Match
      if (!email.trim() || !email.includes('@')) {
         setMessage("Please enter a valid email first.");
         return;
      }

      setStatus(AuthStatus.DETECTING);
      const match = faceService.matchFace(descriptor);
      
      // Verify if the face matches the entered email
      if (match.label !== 'unknown' && match.email === email) {
        const userProfile = faceService.getUserByEmail(match.email);
        if (userProfile) {
            setStatus(AuthStatus.SUCCESS);
            setMessage(`Identity Verified: ${userProfile.name}`);
            
            // Delay to show success animation before logging in
            setTimeout(() => {
                setCurrentUser({ name: userProfile.name, email: userProfile.email });
                setIsLoggedIn(true);
                setStatus(AuthStatus.IDLE);
            }, 1500);
        }
      } else if (match.label !== 'unknown' && match.email !== email) {
         // Face recognized but doesn't match the email entered
         setMessage("Face does not match the provided email.");
         // Don't set FAILED immediately, allow retry
      } else {
         setMessage("Face not recognized in database.");
      }
    } else if (mode === 'register') {
       if (!pendingDescriptor) {
          setPendingDescriptor(descriptor);
          setMessage("Face captured. Complete form to register.");
       }
    }
  }, [mode, status, email, pendingDescriptor]);

  const handleRegister = async () => {
    if (!pendingDescriptor || !name.trim() || !email.trim()) return;
    
    setStatus(AuthStatus.REGISTERING);
    try {
        await faceService.registerUser(name, email, pendingDescriptor);
        setStatus(AuthStatus.SUCCESS);
        setMessage(`Registration successful! Please Login.`);
        
        // Reset form for login
        setTimeout(() => {
            setMode('login');
            setPendingDescriptor(null);
            setName('');
            reset();
        }, 2000);
    } catch (e: any) {
        setStatus(AuthStatus.FAILED);
        setMessage(e.message || 'Registration failed.');
        setTimeout(() => setStatus(AuthStatus.IDLE), 2000);
    }
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setEmail('');
      setPendingDescriptor(null);
      setStatus(AuthStatus.IDLE);
      setMessage('Logged out securely.');
  };

  const handleClearData = () => {
      if(confirm('ATENÇÃO: Isso apagará todos os usuários registrados. Continuar?')) {
          faceService.clearUsers();
          setMessage("Base de dados limpa.");
          reset();
          handleLogout();
      }
  }

  // --- DASHBOARD VIEW (AFTER LOGIN) ---
  if (isLoggedIn && currentUser) {
      return (
        <div className="w-full p-8 animate-fade-in">
             <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-green-500" /> 
                        Sistema Seguro
                    </h1>
                    <p className="text-slate-400 text-sm">Painel de Controle Biométrico</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-white font-medium">{currentUser.name}</p>
                        <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
                        {currentUser.name.charAt(0)}
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="ml-4 p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-green-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Autenticação Bem-sucedida</h3>
                    <p className="text-slate-400 text-sm">
                        Seu acesso foi validado utilizando reconhecimento facial de alta precisão. Sessão ativa e segura.
                    </p>
                 </div>
                 
                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                        <LayoutDashboard className="text-blue-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Status do Sistema</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm text-green-400">Operacional</span>
                    </div>
                 </div>

                 <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Bell className="text-purple-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Notificações</h3>
                    <p className="text-slate-400 text-sm">Você não tem novas notificações de segurança pendentes.</p>
                 </div>
             </div>

             <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                     <h4 className="font-semibold text-slate-300 flex items-center gap-2">
                         <FileText className="w-4 h-4" /> Logs de Acesso Recente
                     </h4>
                     <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
                 </div>
                 <div className="p-0">
                     <table className="w-full text-sm text-left text-slate-400">
                         <thead className="text-xs text-slate-500 uppercase bg-slate-950">
                             <tr>
                                 <th className="px-6 py-3">Evento</th>
                                 <th className="px-6 py-3">Data/Hora</th>
                                 <th className="px-6 py-3">Status</th>
                                 <th className="px-6 py-3">IP (Simulado)</th>
                             </tr>
                         </thead>
                         <tbody>
                             <tr className="bg-slate-900 border-b border-slate-800">
                                 <td className="px-6 py-4 font-medium text-white">Login Biométrico</td>
                                 <td className="px-6 py-4">{new Date().toLocaleString()}</td>
                                 <td className="px-6 py-4"><span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">Sucesso</span></td>
                                 <td className="px-6 py-4 font-mono">192.168.1.105</td>
                             </tr>
                         </tbody>
                     </table>
                 </div>
             </div>
        </div>
      )
  }

  // --- LOGIN / REGISTER VIEW ---
  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
      
      {/* Left Column: Camera */}
      <div className="flex flex-col space-y-4 order-2 lg:order-1">
        <Camera 
          mode={mode} 
          status={status} 
          onFaceDetected={handleFaceDetected} 
          isModelLoaded={modelLoaded}
        />
        
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Security Terminal
            </h3>
            <div className="h-20 overflow-y-auto font-mono text-xs text-green-400 bg-slate-950 p-3 rounded border border-slate-800">
                <p className="opacity-50">[{new Date().toLocaleTimeString()}] System initialized...</p>
                {modelLoaded && <p className="opacity-50">[{new Date().toLocaleTimeString()}] Models loaded.</p>}
                <p className="mt-1">> {message}</p>
            </div>
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="flex flex-col justify-center space-y-6 order-1 lg:order-2">
        
        <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                BioAuth FaceID
            </h1>
            <p className="text-slate-400">Secure Client-Side Biometric Login</p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-slate-800 p-1 rounded-lg inline-flex w-full shadow-inner">
            <button 
                onClick={() => { setMode('login'); reset(); }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
            >
                <LogIn className="w-4 h-4" /> Login
            </button>
            <button 
                onClick={() => { setMode('register'); reset(); }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
            >
                <UserPlus className="w-4 h-4" /> Registrar
            </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {mode === 'login' ? (
                <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                           <Mail className="w-3 h-3" /> E-mail
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value); 
                                setStatus(AuthStatus.IDLE);
                            }}
                            placeholder="user@company.com"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
                        />
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4 py-4 border-t border-slate-800/50">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${status === AuthStatus.SUCCESS ? 'bg-green-500/20 ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-800 ring-1 ring-slate-700'}`}>
                            {status === AuthStatus.SUCCESS ? (
                                <ShieldCheck className="w-8 h-8 text-green-400" />
                            ) : (
                                <Scan className={`w-8 h-8 ${status === AuthStatus.DETECTING ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className={`text-lg font-medium ${status === AuthStatus.FAILED ? 'text-red-400' : 'text-white'}`}>
                                {status === AuthStatus.SUCCESS ? 'Acesso Permitido' : status === AuthStatus.FAILED ? 'Falha na Autenticação' : 'Aguardando Face...'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                                {status === AuthStatus.SUCCESS 
                                    ? 'Redirecionando para o painel...' 
                                    : !email ? 'Digite seu e-mail para ativar o scanner.' : 'Posicione seu rosto na câmera para validar.'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Nome Completo</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">E-mail Corporativo</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joao@empresa.com"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-200/70 leading-relaxed">
                            Os dados são armazenados localmente no navegador. Nenhum dado sai deste dispositivo.
                        </p>
                    </div>

                    <button 
                        onClick={handleRegister}
                        disabled={!pendingDescriptor || !name || !email}
                        className={`w-full py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2
                            ${pendingDescriptor && name && email
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }
                        `}
                    >
                        <UserPlus className="w-5 h-5" />
                        {pendingDescriptor ? 'Finalizar Cadastro' : 'Detectando Rosto...'}
                    </button>
                </div>
            )}
        </div>

        {!isLoggedIn && (
            <div className="pt-4 text-center">
                <button 
                    onClick={handleClearData}
                    className="text-[10px] text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto uppercase tracking-widest"
                >
                    <Trash2 className="w-3 h-3" /> Limpar Banco de Dados
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default AuthForm;