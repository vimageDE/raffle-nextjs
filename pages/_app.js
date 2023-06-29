import { MoralisProvider } from 'react-moralis';
import { NotificationProvider } from 'web3uikit';
import '../styles/globals.css';
import { ContractEngine } from '../components/Contracts';

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider initializeOnMount={false}>
      <NotificationProvider>
        <ContractEngine>
          <Component {...pageProps} />
        </ContractEngine>
      </NotificationProvider>
    </MoralisProvider>
  );
}

export default MyApp;
