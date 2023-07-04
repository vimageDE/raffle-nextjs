import { useWeb3Contract } from 'react-moralis';
import { contractAddresses, abi, luckyTokenAddresses, abiToken } from '../constants';
import { useMoralis } from 'react-moralis';
import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNotification } from 'web3uikit';
import Modal from 'react-modal';
import { FaCrown } from 'react-icons/fa';
import TimeAgo from 'react-timeago';
import { Contracts } from './Contracts';

const wheelBg = '/luckyWheel1_bg.png';
const wheelFg = '/luckyWheel1_fg.png';

export default function LotteryEntrance() {
  const { Moralis, isWeb3Enabled, environment } = useMoralis();
  const {
    chainId,
    provider,
    signer,
    signerAddress,
    raffleAddress,
    tokenAddress,
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
    updateUIValues,
    enterRaffle,
    isLoading,
    isFetching,
    approveToken,
  } = useContext(Contracts);
  console.log('Chain Idd: ', chainId);
  console.log('RaffleAddress: ', raffleAddress);
  console.log('LuckyTokenAddress: ', tokenAddress);
  const [eventIds, setEventIds] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [wheelActiveWin, setWheelActiveWin] = useState(false);
  const [wheelActiveLose, setWheelActiveLose] = useState(false);
  const [wheelWin, setWheelWin] = useState(false);
  const [wheelLose, setWheelLose] = useState(false);
  let interval = 450;

  const dispatch = useNotification();

  // Functions ---------------------------

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

  // Events
  useEffect(() => {
    if (!(isWeb3Enabled && raffleContract && tokenContract)) return;

    let cleanupFunc; // To keep a reference to the cleanup function
    CheckTimerActive();

    const fetchAndListen = async () => {
      const currentBlock = await provider.getBlockNumber();
      console.log('CurrentBlock: ', currentBlock);

      // Raffle Entered Event
      raffleContract.on(raffleContract.filters.RaffleEnter(), async (player, event) => {
        currentBlock = await provider.getBlockNumber();
        if (event.blockNumber < currentBlock) return;
        if (checkTransactioHashIncluded(event.transactionHash)) return;
        handleRaffleEnter(player);
        setEventIds((prevEventIds) => [...prevEventIds, event.transactionHash]);
      });
      // Winner Picked Event
      raffleContract.on(raffleContract.filters.WinnerPicked(), async (winner, amount, event) => {
        currentBlock = await provider.getBlockNumber();
        if (event.blockNumber < currentBlock) return;
        if (checkTransactioHashIncluded(event.transactionHash)) return;
        handleWinner(winner, amount);
        setEventIds((prevEventIds) => [...prevEventIds, event.transactionHash]);
      });
      // Token payment free
      tokenContract.on(tokenContract.filters.PaymentFree(), async (from, amount, event) => {
        currentBlock = await provider.getBlockNumber();
        if (event.blockNumber < currentBlock) return;
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();
        if (address != signerAddress) return;
        if (checkTransactioHashIncluded(event.transactionHash)) return;
        handleTokensFree();
        setEventIds((prevEventIds) => [...prevEventIds, event.transactionHash]);
      });
      // Token payment double
      tokenContract.on(tokenContract.filters.PaymentDoubled(), async (address, amount, event) => {
        currentBlock = await provider.getBlockNumber();
        console.log(`Double Event ${event.blockNumber} - ${currentBlock} - ${event.transactionHash}`);
        console.log(`Double Event - SavedEvents: ${eventIds}`);
        if (event.blockNumber < currentBlock) return;
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();
        if (address != signerAddress) return;
        if (checkTransactioHashIncluded(event.transactionHash)) return;
        handleTokensDoubled();
      });

      // Cleanup function to remove listener
      cleanupFunc = () => {
        raffleContract.off(raffleContract.filters.RaffleEnter());
        raffleContract.off(raffleContract.filters.WinnerPicked());
        tokenContract.off(tokenContract.filters.PaymentFree());
        tokenContract.off(tokenContract.filters.PaymentDoubled());
      };
    };

    fetchAndListen();

    return () => cleanupFunc && cleanupFunc(); // Returning the cleanup function from useEffect
  }, [isWeb3Enabled, raffleContract, tokenContract]);

  // Check Event transactionhash
  const checkTransactioHashIncluded = function (hash) {
    const eventsLoaded = eventIds.length != 0;
    let ei;
    if (!eventsLoaded) {
      ei = sessionStorage.getItem('eventIds');
      ei = ei ? JSON.parse(ei) : [];
    } else {
      ei = eventIds;
    }

    const eventHandled = ei.includes(hash);
    if (eventHandled) {
      if (!eventsLoaded && ei.length > 0) {
        setEventIds(ei);
      }
      return true;
    }

    ei.push(hash);
    console.log(`This should now have saved this hash: ${hash}`);
    // Save in eventIds State Variable
    setEventIds(ei);
    // Save in eventIds SessionVariable
    sessionStorage.setItem('eventIds', JSON.stringify(ei));
    return false;
  };

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
    CheckTimerActive();
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
    CheckTimerActive();
  };
  const handleTest = async function () {
    const currentUser = ethereum.selectedAddress;
    console.log('Current user: ', currentUser);
  };
  const handleTokensFree = async function (amount) {
    console.log(`Your Transaction of ${amount} LCY was FREE!`);
    setWheelActiveWin(true);
    // Setting the wheel to be inactive after 5 seconds
    setTimeout(() => setWheelWin(true), 2200);
  };
  const handleTokensDoubled = async function (amount) {
    console.log(`Your Transaction of ${amount} LCY was DOUBLED!`);
    setWheelActiveLose(true);
    setTimeout(() => setWheelLose(true), 2200);
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

  // Sign & Verify Message
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
      Message: [{ name: 'myValue', type: 'string' }],
    };
    // Define the message
    const input = document.querySelector('#inputSign').value.toString();
    const value = {
      myValue: input, // 'aua',
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
    const input = document.querySelector('#inputVerify').value.toString();
    const value = {
      myValue: input, // 'aua',
    };

    try {
      // pass the parameters to `verify`
      console.log('Verify with variables: ', signature, signerAddress, value.myValue, chainId);
      const result = await raffleContract.getSigner(value.myValue, signature);
      console.log('Verify Address: ', result);
      console.log('Verify Address: ', result == signerAddress);
    } catch (err) {
      console.error(err);
    }
  };

  // Enter Raffle with Lucky Token
  const approveTransaction = async function () {
    try {
      console.log('Approve transfer of tokens');
      const tx = await tokenContract.approve(raffleAddress, entranceFee);
      // const tx = await approveToken();
      const receipt = await tx.wait();
      console.log('Token Transaction Approved!');
    } catch (error) {
      console.error(`Failed to approve tokens: ${error}`);
    }
  };

  const enterRaffletokens = async function () {
    try {
      console.log('Enter Lottery with tokens');
      // Get needed Data
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = raffleContract.connect(signer);
      const tokenFactor = await tokenContract.getFactor();
      console.log(`Token Factor: ${tokenFactor}`);

      // Approve Token transaction
      try {
        console.log('approve transfer of Tokens...');
        const entranceFeeBigInt = BigInt(entranceFee);
        const tokenFactorBigInt = BigInt(tokenFactor);
        const tokenAmount = entranceFeeBigInt * tokenFactorBigInt;
        console.log(`Eth amount: ${entranceFeeBigInt.toString()}`);
        console.log(`Token amount: ${tokenAmount.toString()}`);
        const tx_token = await tokenContract.approve(raffleAddress, tokenAmount);
        const receipt_token = await tx_token.wait();
        console.log('Token Transaction Approved!');
      } catch (e) {
        console.error(`Failed to approve tokens: ${e}`);
        return;
      }

      // Token Transaktion
      console.log(`Signer: ${tokenFactor}`);
      console.log(`token Factor: ${tokenFactor}`);
      console.log(`ETH entrance Fee: ${entranceFee}`);
      const tx = await contract.enterRaffle_Token(entranceFee);
      // const tx = await raffleContract.enterRaffle_Token(entranceFee);
      const receipt = await tx.wait();
      console.log('Raffle Entered with token!');
    } catch (error) {
      console.error(`Failed to approve tokens: ${error}`);
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
      <div className="flex flex-col items-center pt-20 mb-8">
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
        <div className="space-x-4">
          <button
            className="bg-gold hover:bg-yellow-700 py-2 px-4 rounded font-black uppercase w-40"
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
              <div>Enter (ETH)</div>
            )}
          </button>
          <button
            className="bg-gold hover:bg-yellow-700 py-2 px-4 rounded font-black uppercase w-40"
            onClick={enterRaffletokens}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              <div>Enter (LCY)</div>
            )}
          </button>
        </div>

        <div className="text-xs pt-2"> Only {ethers.utils.formatUnits(entranceFee, 'ether')} ETH </div>
      </div>
      <div className="pb-40 space-y-8">
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
        <div>
          <button className="mx-4" onClick={handleTokensFree}>
            Test Free
          </button>
          <button className="mx-4" onClick={handleTokensDoubled}>
            Test Doubled
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
      <Modal
        isOpen={wheelActiveWin || wheelActiveLose}
        onRequestClose={() => {
          setWheelActiveWin(false);
          setWheelActiveLose(false);
          setWheelLose(false);
          setWheelWin(false);
        }}
        contentLabel="Lucky Wheel"
        className="bg-opacity-0 mx-auto my-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-90 flex"
      >
        <div>
          <div className="text-center font-black text-3xl">Lucky Token Wheel</div>
          <div className="w-80 h-80 mx-auto">
            <div className="w-80 h-80 bg-cover absolute" style={{ backgroundImage: `url(${wheelBg})` }}></div>
            <div
              className={`w-80 h-80 bg-cover absolute ${
                wheelActiveWin ? 'animate-spin-to-minted' : 'animate-spin-to-burned'
              } `}
              style={{ backgroundImage: `url(${wheelFg})` }}
            ></div>
          </div>
          {wheelWin || wheelLose ? (
            wheelActiveWin ? (
              <div className="text-center text-gold font-black text-3xl">Tokens Refunded!</div>
            ) : (
              <div className="text-center text-red-700 font-black text-3xl">Tokens Doubled!</div>
            )
          ) : (
            <div className="text-center text-3xl">...</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
