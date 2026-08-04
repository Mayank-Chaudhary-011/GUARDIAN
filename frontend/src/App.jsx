import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import TabBar from './components/TabBar';
import EvalForm from './components/EvalForm';
import ProxyLogs from './components/ProxyLogs';
import DataQuality from './components/DataQuality';
import LandingPage from './components/LandingPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: 1 } },
});

function MainApp() {
  const [view, setView] = useState('dashboard'); // 'landing' | 'dashboard'
  const [activeTab, setActiveTab] = useState('eval');

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('dashboard')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      <Header onHome={() => setView('landing')} />
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 64px' }}>
        <TabBar active={activeTab} onChange={setActiveTab} />
        
        {/* Keep all tabs mounted so state, prompt, eval results & history are 100% preserved when switching tabs */}
        <div style={{ display: activeTab === 'eval' ? 'block' : 'none' }}>
          <EvalForm />
        </div>
        <div style={{ display: activeTab === 'proxy' ? 'block' : 'none' }}>
          <ProxyLogs />
        </div>
        <div style={{ display: activeTab === 'data' ? 'block' : 'none' }}>
          <DataQuality />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
