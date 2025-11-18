import React from 'react';
import AuthForm from './components/AuthForm';
import { Fingerprint } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 md:p-8 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-overlay bg-fixed">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
      
      <header className="relative z-10 mb-8 flex flex-col items-center animate-fade-in">
        <div className="p-3 bg-blue-500/10 rounded-full ring-1 ring-blue-400/30 mb-4">
            <Fingerprint className="w-8 h-8 text-blue-400" />
        </div>
      </header>

      <main className="relative z-10 w-full max-w-5xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        <AuthForm />
      </main>

      <footer className="relative z-10 mt-8 text-slate-500 text-xs text-center max-w-md">
        <p>
            Powered by Face-API.js & TensorFlow.js | 100% Client-Side Processing
        </p>
        <p className="mt-2 opacity-50">
            Privacy Notice: Biometric data is converted to mathematical descriptors and stored only in your browser's LocalStorage. No image data leaves this device.
        </p>
      </footer>
    </div>
  );
}

export default App;