// Contracts.js
import React, { createContext, useState, useEffect } from 'react';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { ethers } from 'ethers';
import { contractAddresses, abi, luckyTokenAddresses, abiToken } from '../constants';

export const Contracts = createContext();

export const ContractEngine = ({ children }) => {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex, environment } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const [provider, setProvider] = useState('');
  const [signer, setSigner] = useState('');
  const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  const tokenAddress = chainId in luckyTokenAddresses ? luckyTokenAddresses[chainId][0] : null;
  const [raffleContract, setContract] = useState('');
  const [tokenContract, setTokenContract] = useState('');
  const [entranceFee, setEntranceFee] = useState('0');
  const [numPlayers, setNumPlayers] = useState('0');
  const [recentWinner, setRecentWinner] = useState('0');
  const [players, setPlayers] = useState([]);
  const [timeStamp, setTimeStamp] = useState('0');
  const [raffleState, setRaffleState] = useState('0');
  const [currentSignature, setCurrentSignature] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [signerAddress, setSignerAddress] = useState('');

  // Update UI When isWeb3 is Enabled
  useEffect(() => {
    if (isWeb3Enabled) {
      updateContract();
      updateUIValues();
    }
  }, [isWeb3Enabled]);

  // Update UI
  async function updateUIValues() {
    const entranceFeeFromCall = (await getEntranceFee()).toString();
    const numPlayersFromCall = (await getNumberOfPlayers()).toString();
    const recentWinnerFromCall = (await getRecentWinner()).toString();
    const allPlayersFromCall = await getAllPlayers();
    const timeLeftFromCall = (await getLastTimeStamp()).toString();
    const raffleStateFromCall = (await getRaffleState()).toString();

    setEntranceFee(entranceFeeFromCall);
    setNumPlayers(numPlayersFromCall);
    setRecentWinner(recentWinnerFromCall);
    setPlayers(allPlayersFromCall);
    setTimeStamp(timeLeftFromCall);
    setRaffleState(raffleStateFromCall);
  }

  // Set Raffel Contract
  async function updateContract() {
    const p = new ethers.providers.Web3Provider(window.ethereum);
    const s = p.getSigner();
    const sa = await s.getAddress();
    const c = new ethers.Contract(raffleAddress, abi, p);
    const tc = new ethers.Contract(tokenAddress, abiToken, p).connect(s);
    setProvider(p);
    setSigner(s);
    setSignerAddress(sa);
    setContract(c);
    setTokenContract(tc);
    const tokenBalanceFromCall = (await tc.balanceOf(sa)).toString();
    setTokenBalance(tokenBalanceFromCall);
    console.log(`Lucky token Amount ${tokenBalanceFromCall}`);
    // console.log('Setting Raffle Contract -:', raffleContract);

    // const signer = provider.getSigner();
    // raffleContract = raffleContract.connect(signer);
  }

  // Update tokenAmount
  async function updateTokens() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    const tokenBalanceFromCall = (await tokenContract.balanceOf(signerAddress)).toString();
    setTokenBalance(tokenBalanceFromCall);
    console.log(`Lucky token Amount ${tokenBalanceFromCall}`);
  }

  // Contracts
  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'enterRaffle',
    params: {},
    msgValue: entranceFee,
  });
  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: 'getEntranceFee',
    params: {},
  });
  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: 'getNumberOfPlayers',
    params: {},
  });
  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: 'getRecentWinner',
    params: {},
  });
  const { runContractFunction: getAllPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getAllPlayers',
    params: {},
  });
  const { runContractFunction: getLastTimeStamp } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getLatestTimeStamp',
    params: {},
  });
  const { runContractFunction: getRaffleState } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: 'getRaffleState',
    params: {},
  });
  const { runContractFunction: approveToken } = useWeb3Contract({
    abi: abiToken,
    contractAddress: tokenAddress,
    functionName: 'approve',
    params: { tokenAddress, entranceFee },
  });
  const { runContractFunction: getTokenBalance } = useWeb3Contract({
    abi: abiToken,
    contractAddress: tokenAddress,
    functionName: 'balanceOf',
    params: {},
  });

  // Export Variables
  return (
    <Contracts.Provider
      value={{
        // Const Variables
        chainId,
        provider,
        signer,
        signerAddress,
        raffleAddress,
        tokenAddress,
        // State Variables
        raffleContract,
        setContract,
        tokenContract,
        setTokenContract,
        entranceFee,
        setEntranceFee,
        numPlayers,
        setNumPlayers,
        recentWinner,
        setRecentWinner,
        players,
        setPlayers,
        timeStamp,
        setTimeStamp,
        raffleState,
        setRaffleState,
        currentSignature,
        setCurrentSignature,
        // Functions
        updateUIValues,
        // Contract Functions,
        enterRaffle,
        isLoading,
        isFetching,
        approveToken,
        tokenBalance,
        updateTokens,
      }}
    >
      {children}
    </Contracts.Provider>
  );
};
