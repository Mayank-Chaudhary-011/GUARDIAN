import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import TabBar from './components/TabBar';
import EvalForm from './components/EvalForm';
import ProxyLogs from './components/ProxyLogs';
import DataQuality from './components/DataQuality';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: 1 } },
});

function MainApp() {
  const [activeTab, setActiveTab] = useState('eval');
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 64px' }}>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'eval'  && <EvalForm />}
        {activeTab === 'proxy' && <ProxyLogs />}
        {activeTab === 'data'  && <DataQuality />}
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
