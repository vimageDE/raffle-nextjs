import {useWeb3Contract} from "react-moralis"
import { contractAddresses, abi } from "../constants"
import{useMoralis} from "react-moralis"
import{useEffect, useState} from "react"
import {ethers} from "ethers"

export default function LotteryEntrance() {
    const { Moralis, isWeb3Enabled, chainId: chainIdHex, environment } = useMoralis()
    const chainId = parseInt(chainIdHex);
    console.log("Chain Idd: ", chainId);
    console.log("ContractAddresses: ", contractAddresses);
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
    console.log("RaffleAddress: ", raffleAddress);
    const [entranceFee, setEntranceFee] = useState("0")
    
    const {runContractFunction: enterRaffle} = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })
    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress, // specify the networkId
        functionName: "getEntranceFee",
        params: {},
    })

    async function updateUIValues() {
        // Another way we could make a contract call:
        // const options = { abi, contractAddress: raffleAddress }
        // const fee = await Moralis.executeFunction({
        //     functionName: "getEntranceFee",
        //     ...options,
        // })
        const entranceFeeFromCall = await getEntranceFee();
        console.log("This is what the function returns: " , entranceFeeFromCall);
        if(entranceFeeFromCall){
            setEntranceFee(entranceFeeFromCall.toString());
        }else{
            console.error('getEntranceFee returned undefined or null');
        }

    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUIValues()
        }
    }, [isWeb3Enabled])

    return(
        <div>
            Lottery Entrance
            <div>
                <button onClick={async function() {
                    await enterRaffle();
                }}>Enter Raffle</button>
                { raffleAddress ? <div>EntranceFee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div> : <div>No Raffle Address Detected</div>}
            </div>
        </div>
    )
}