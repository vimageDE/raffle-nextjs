import { useWeb3Contract } from 'react-moralis';
import { contractAddresses, abi } from '../constants';
import { useMoralis } from 'react-moralis';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNotification } from 'web3uikit';
import { FaCrown } from 'react-icons/fa';
import TimeAgo from 'react-timeago';

export default function LotteryEntrance() {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex, environment } = useMoralis();
  const chainId = parseInt(chainIdHex);
  console.log('Chain Idd: ', chainId);
  console.log('ContractAddresses: ', contractAddresses);
  const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  console.log('RaffleAddress: ', raffleAddress);
  const [raffleContract, setContract] = useState('');
  const [entranceFee, setEntranceFee] = useState('0');
  const [numPlayers, setNumPlayers] = useState('0');
  const [recentWinner, setRecentWinner] = useState('0');
  const [players, setPlayers] = useState([]);
  const [timeStamp, setTimeStamp] = useState('0');
  const [raffleState, setRaffleState] = useState('0');
  const [timerActive, setTimerActive] = useState(false);
  let interval = 450;

  const [currentSignature, setCurrentSignature] = useState(false);

  const dispatch = useNotification();

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

  // Functions ---------------------------

  // Set Raffel Contract
  async function updateRaffleContract() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setContract(new ethers.Contract(raffleAddress, abi, provider));
    // console.log('Setting Raffle Contract -:', raffleContract);

    // const signer = provider.getSigner();
    // raffleContract = raffleContract.connect(signer);
  }

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
    CheckTimerActive();

    console.log('Last Timestamp: ', timeLeftFromCall);
    console.log('Last Raffle State: ', raffleStateFromCall);
  }

  // Check if Timer active
  function CheckTimerActive() {
    console.log(
      'Timer: ',
      players.length,
      ' - ',
      raffleState,
      ' -- ',
      (parseInt(timeStamp) + interval) * 1000 > Date.now()
    );
    const timer = players.length > 0 && raffleState == 0 && (parseInt(timeStamp) + interval) * 1000 > Date.now();
    setTimerActive(timer);
  }

  useEffect(() => {
    const checkingTimer = setInterval(() => {
      if (timerActive) {
        CheckTimerActive();
      }
    }, 1000);
    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(checkingTimer);
  }, []);

  // Update UI When isWeb3 is Enabled
  useEffect(() => {
    if (isWeb3Enabled) {
      updateRaffleContract();
      updateUIValues();
    }
  }, [isWeb3Enabled]);

  // Events
  useEffect(() => {
    if (!(isWeb3Enabled && raffleAddress)) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(raffleAddress, abi, provider);
    let cleanupFunc; // To keep a reference to the cleanup function

    const fetchAndListen = async () => {
      const currentBlock = await provider.getBlockNumber();
      console.log('CurrentBlock: ', currentBlock);

      contract.on(contract.filters.RaffleEnter(), (player, event) => {
        if (event.blockNumber <= currentBlock) return;
        handleRaffleEnter(player);
      });
      contract.on(contract.filters.WinnerPicked(), (winner, amount, event) => {
        if (event.blockNumber <= currentBlock) return;
        handleWinner(winner, amount);
      });

      // Cleanup function to remove listener
      cleanupFunc = () => {
        contract.off(contract.filters.RaffleEnter(), handleRaffleEnter);
        contract.off(contract.filters.WinnerPicked(), handleWinner);
      };
    };

    fetchAndListen();

    return () => cleanupFunc && cleanupFunc(); // Returning the cleanup function from useEffect
  }, [isWeb3Enabled, raffleAddress]);

  // Handle Feedback
  const handleTransaction = async function (tx) {
    sendNotification('info', 'Transaction Started', 'Waiting for confirmation to enter raffle...');
    updateUIValues();
  };
  const handleRaffleEnter = async function (player) {
    const currentUser = ethereum.selectedAddress;
    if (player.toLowerCase() == currentUser.toLowerCase()) {
      // current user has entered the raffle
      console.log('You have entered the Raffle!');
      sendNotification('success', 'Raffle Entered', 'Your transaction was confirmed!');
    } else {
      // other user has entered the raffle
      console.log('A user has entered the Raffle!');
      sendNotification('info', 'User Entered', 'A user has entered the raffle');
    }
    updateUIValues();
  };
  const handleWinner = async function (winner, amount) {
    const currentUser = ethereum.selectedAddress;
    console.log('Winner is: ', winner);
    if (winner.toLowerCase() === currentUser.toLowerCase()) {
      sendNotification('success', 'You won!', `You have won ${ethers.utils.formatUnits(amount, 'ether')} eth`);
    } else {
      sendNotification('warning', 'You lose...', 'Another player has won the lottery');
    }
    updateUIValues();
  };
  const handleTest = async function () {
    const currentUser = ethereum.selectedAddress;
    console.log('Current user: ', currentUser);
  };

  // Notification
  const sendNotification = function (type, title, message, position) {
    dispatch({
      type: type,
      message: message,
      title: title,
      position: position || 'topR',
      icon: 'bell',
    });
  };

  // Verify Message
  const signMessage = async function () {
    // Define the EIP-712 domain - All properties on a domain are optional
    const domain = {
      name: 'Ethereum Lottery',
      version: '1',
      chainId: chainId, // Replace this with the actual chainId
      verifyingContract: raffleAddress, // Replace this with the actual contract address
    };
    // This JSON object structure describes the "type" of the message
    const types = {
      /*
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],*/
      Message: [{ name: 'myValue', type: 'uint256' }],
    };
    // Define the message
    const input = document.querySelector('#inputSign').value.toString();
    const value = {
      myValue: 1,
    };

    console.log('Sign Message');

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    const signature = await signer._signTypedData(domain, types, value);
    setCurrentSignature(signature);

    console.log('Message:', value['myValue']);
    console.log('Signature:', signature);
    console.log('Addresse: ', signerAddress);

    console.log('------');
    return;
    const recoveredAddress = ethers.utils.verifyTypedData(domain, types, value, signature);
    console.log(`Recovered address: ${recoveredAddress}`);
    console.log('The addresses should be the same: ', recoveredAddress == signerAddress);
  };

  const verifyMessage = async function () {
    /*if (!currentSignature) {
      return;
    }*/

    console.log('Verifying Message');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // the expected address
    const signerAddress = await signer.getAddress();

    // The signature
    const signature = currentSignature;

    // The Message
    // const input = document.querySelector('#inputVerify').value.toString();
    const value = {
      myValue: 1,
    };

    try {
      // pass the parameters to `verify`
      console.log('Verify with variables: ', signature, signerAddress, value.myValue);
      const result = await raffleContract.getSigner(1, signature, raffleAddress);
      console.log('Verify was: ', result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pt-16 text-center">
      <div className="flex flex-col items-center">
        <img src="/hero-image0.png" alt="Ethereum Lottery" className="max-h-40" />
        <h4 className="text-2xl font-black">Ethereum based Lottery</h4>
        <p className="text-xl font-light">
          Welcome to this decentralized, ethereum based lottery! <br /> When entering, you will participate in winning
          the price pool of all entries.
        </p>
      </div>
      <div className="flex flex-col items-center pt-20 pb-40">
        <div>
          <div className="font-black text-3xl"> Next Jackpot:</div>
          <div className="pt-3 pb-8">
            {players.length > 0 ? (
              <>
                <div className="flex items-center space-x-8">
                  <div>
                    <div> Current Players:</div>
                    <div className="font-black">{numPlayers}</div>
                  </div>
                  <div>
                    <div> Current price pool:</div>
                    <div className="font-black">{ethers.utils.formatUnits(entranceFee * numPlayers, 'ether')} ETH</div>
                  </div>
                </div>
                <div className="pt-4">
                  <div>Time left:</div>
                  <div>
                    {!timerActive ? (
                      <div> -Calculating Winner-</div>
                    ) : (
                      <TimeAgo date={new Date((parseInt(timeStamp) + interval) * 1000)} />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="">
                <div className="uppercase">Waiting for players...</div>
                <div>Be the first to enter!</div>
              </div>
            )}
          </div>
          {/* {players.length > 0 ? (
            <>
              <div>Players:</div>
              <div>
                {players.map((element, index) => (
                  <div key={index}>{element.toString()}</div>
                ))}
              </div>
            </>
          ) : (
            <div />
          )} */}
        </div>
        <button
          className="bg-gold hover:bg-yellow-700 py-2 px-4 rounded font-black uppercase"
          onClick={async function () {
            await enterRaffle({
              onSuccess: handleTransaction,
              onError: (error) => console.log(error),
            });
          }}
          disabled={isLoading || isFetching}
        >
          {isLoading || isFetching ? (
            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
          ) : (
            <div>Enter Raffle</div>
          )}
        </button>
        <div className="text-xs pt-2"> Only {ethers.utils.formatUnits(entranceFee, 'ether')} ETH </div>
      </div>
      <div className="-my-20 space-y-8">
        <div className="space-x-8">
          <input type="text" id="inputSign" name="inputSign" className="rounded-sm text-black px-4 w-28"></input>
          <button
            className="bg-gold hover:bg-yellow-700 py-2 px-4 rounded font-black uppercase w-28"
            onClick={signMessage}
          >
            Sign
          </button>
        </div>
        <div className="space-x-8">
          <input type="text" id="inputVerify" name="inputVerify" className=" rounded-sm text-black px-4 w-28"></input>
          <button
            className="bg-emerald-600 hover:bg-emerald-500 py-2 px-4 rounded font-black uppercase w-28"
            onClick={verifyMessage}
          >
            Verify
          </button>
        </div>
      </div>
      {raffleAddress ? (
        <div className="fixed bottom-0 w-full text-center">
          <div className="bg-emerald-600 text-white py-6">
            <div className="flex justify-center items-center space-x-2">
              <span>
                <FaCrown />
              </span>
              <span>Last Raffle Winner</span>
              <span>
                <FaCrown />
              </span>
            </div>
            <span>{recentWinner}</span>
          </div>
        </div>
      ) : (
        <div>No Raffle Address Detected</div>
      )}
    </div>
  );
}
