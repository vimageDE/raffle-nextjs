import { ConnectButton } from 'web3uikit';

export default function Header() {
  return (
    <div className="p-5 border-b-2 border-white border-opacity-0 flex flex-row bg-teal-800 bg-opacity-0 text-white">
      <h1 className="py-4 px-4 font-blog text-4xl font-black">Decentralized Lottery</h1>
      <div className="ml-auto py-4 px-4">
        <ConnectButton moralisAuth={false} />
      </div>
    </div>
  );
}
