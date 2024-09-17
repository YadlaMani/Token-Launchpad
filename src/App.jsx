import "./App.css";
import TokenLaunchPad from "./components/TokenLaunchPad";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-indigo-700">
                Solana Token Launchpad
              </h1>
              <div className="mt-4">
                <WalletMultiButton className="bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 transition duration-300" />
              </div>
            </div>

            <TokenLaunchPad />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;
