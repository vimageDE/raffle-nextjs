// Contracts.js
import React, { createContext, useState } from 'react';
import { useMoralis } from 'react-moralis';
import { contractAddresses, abi, luckyTokenAddresses, abiToken } from '../constants';

export const Contracts = createContext();

export const ContractEngine = ({ children }) => {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex, environment } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  const tokenAddress = chainId in luckyTokenAddresses ? luckyTokenAddresses[chainId][0] : null;

  // Export Variables
  return <Contracts.Provider value={{ chainId, raffleAddress, tokenAddress }}>{children}</Contracts.Provider>;
};
