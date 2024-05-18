import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  sepolia
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";


const config = getDefaultConfig({
  appName: 'Shadow',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true
});
const queryClient = new QueryClient();


ReactDOM.createRoot(document.getElementById('root')).render(
    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider coolMode >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
    </WagmiProvider>
)
