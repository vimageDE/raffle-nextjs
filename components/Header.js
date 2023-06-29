import { ConnectButton } from 'web3uikit';
import React, { useState } from 'react';
import Modal from 'react-modal';
import { ImCross } from 'react-icons/Im';
import { chainId } from './LotteryEntrance';

const bgImage = '/bg-market1.jpg';

export default function Header() {
  const [marketIsOpen, setMarketIsOpen] = useState(false);

  return (
    <div className="flex p-5 border-b-2 border-white border-opacity-0 bg-teal-800 bg-opacity-0">
      <div className="my-auto">
        <h1 className="font-blog text-4xl font-black">Decentralized Lottery</h1>
      </div>
      <div className="my-auto ml-auto">
        <button
          onClick={() => setMarketIsOpen(true)}
          className="flex flex-row bg-emerald-600 px-4 py-1.5 rounded-full font-black hover:bg-emerald-500"
        >
          <h5 className="my-auto">Buy</h5>
          <img src="/hero-image0.png" className="max-h-8 my-auto"></img>
          <h5 className="my-auto">Sell</h5>
        </button>
      </div>
      <div className="my-auto">
        <ConnectButton moralisAuth={false} />
      </div>
      <Modal
        isOpen={marketIsOpen}
        onRequestClose={() => setMarketIsOpen(false)}
        contentLabel="LuckyToken Market"
        className="m-auto bg-emerald-800 w-1/2 h-3/4 rounded-xl shadow max-h-[500px] max-w-[400px]"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex"
      >
        <div className="m-auto text-center bg-cover min-h-full">
          <div className="bg-white bg-cover mb-4 rounded" style={{ backgroundImage: `url(${bgImage})` }}>
            <h2 className="text-3xl  font-black py-16 uppercase">Lucky Tokens</h2>
          </div>
          <div className="flex justify-center items-center mb-4">
            <img src="/hero-image0.png" className="max-h-32"></img>
            <div className="pr-8">
              <p className="text-2xl">1 ETH</p>
              <p className="text-2xl">10 LCY</p>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-row items-center space-x-4">
              <input className="rounded-full w-32 h-8 text-black px-4 text-center" type="text" value="10"></input>
              <button className="bg-emerald-600 px-4 h-10 rounded-full font-black hover:bg-emerald-500 w-28">
                Buy
              </button>
            </div>
            <div className="flex flex-row items-center space-x-4">
              <input className="rounded-full w-32 h-8 text-black px-4 text-center" type="text" value="10"></input>
              <button className="bg-emerald-600 px-4 h-10 rounded-full font-black hover:bg-emerald-500 w-28">
                Sell
              </button>
            </div>
          </div>
          <p>Test {chainId}</p>

          <button className="absolute right-4 top-4" onClick={() => setMarketIsOpen(false)}>
            <ImCross />
          </button>
        </div>
      </Modal>
    </div>
  );
}
