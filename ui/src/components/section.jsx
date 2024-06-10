import { useState,useMemo } from "react";
import {ethers,providers} from "ethers";
import wc from "../../utils/witness_calculator";
import utils from "../../utils/util";
import {abi as ShadowABI} from "../../utils/ABI/shadowabi.json";
import shadowBG from "../assets/shadowbg.png";
import { useAccount, useConnectorClient } from 'wagmi'
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width:'50%',
  },
};

Modal.setAppElement('#root');

export default function Section(){

    const [isDeposit,setIsDeposit] = useState(true);
    const [secretValue, setSecretValue] = useState('');
    const [proofElements,updateProofElements] = useState(null);
    const [modalIsOpen, setIsOpen] = useState(false);

    const { chainId,address } = useAccount();
    const shadowInterface  = new ethers.utils.Interface(ShadowABI);
    const shadowAddress = "0xF94ba41BCC0bb7f700BeeB1086Ee8eC9b3ad2eda";

    const clientToSigner = (client)=> {
        const { account, chain, transport } = client
        const network = {
          chainId: chain.id,
          name: chain.name,
          ensAddress: chain.contracts?.ensRegistry?.address,
        }
        const provider = new providers.Web3Provider(transport, network)
        const signer = provider.getSigner(account.address)
        return signer
    }

    /** Hook to convert a Viem Client to an ethers.js Signer. */
    const useEthersSigner = ()=> {
        const { data: client } = useConnectorClient({ chainId })
        return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
    }

    const txnSigner = useEthersSigner();
    console.log("Connected address: ",address);
    console.log("Signer: ",txnSigner);

    const openModal = ()=> {
        setIsOpen(true);
    }

    const closeModal = ()=> {
        setIsOpen(false);
    }

    // Deposit
    const depositEther = async () =>{
        const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        const input = {
            secret: utils.BNToBinary(secret).split(""),
            nullifier: utils.BNToBinary(nullifier).split("")
        }

        let res = await fetch("../../utils/deposit.wasm");
        let buffer = await res.arrayBuffer(res);
        let depositWC = await wc(buffer);
        const r = await depositWC.calculateWitness(input,0);
        const commitment = r[1];
        const nullifierHash = r[2];

        console.log("Commitment: ",commitment);
        console.log("Nullifier: ",nullifierHash);
        const value = ethers.BigNumber.from("1000000000000000").toHexString(); //0.001 ether

        const tx = {
            to: shadowAddress,
            from :address,
            value:value,
            data: shadowInterface.encodeFunctionData("deposit",[commitment])
        }
        // Send transaction
        try{
            const txHash = await txnSigner.sendTransaction(tx);
            const receipt = await txHash.wait();
            const log = receipt.logs[0];
            const logData = log.data;
            const logTopic = log.topics;

            const decodedData = shadowInterface.decodeEventLog("Deposit",logData,logTopic);

            const proofElements = {
                root:utils.BNToDecimal(decodedData.root),
                nullifierHash: `${nullifierHash}`,
                secret: secret,
                nullifier: nullifier,
                commitment: `${commitment}`,
                hashPairings: decodedData.hashPairings.map((n)=>(utils.BNToDecimal(n))),
                hashDirections: decodedData.pairDirection
            };
            console.log("Proof elements: ",proofElements);
            updateProofElements(btoa(JSON.stringify(proofElements)));
            //Open modal
            openModal();
        }catch(e){
            console.log(e);
        }
    }


    const depositElement = () =>{
        return(
            <>
                <div className="flex justify-between">
                    <div>
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-6 w-full hover:opacity-85">ETH</button>
                    </div>
                    <div className="pl-4">
                    </div>
                    <div className="w-full ">
                        <button className="border-2 border-black text-black font-semibold py-2 px-4 w-full hover:cursor-auto">0.01 ETH</button>
                    </div>
                </div>
                <div>
                    <div className="pt-2">
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-4 w-full hover:opacity-85" onClick={depositEther}>Deposit</button>
                    </div>
                </div>                

            </>
        )

    }

    const withdrawElement = () =>{

        return(

            <>
                <div className="flex justify-between">
                    <div>
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-6 w-full hover:opacity-85" >Secret</button>
                    </div>
                    <div className="pl-4">
                    </div>
                    <div className="w-full ">
                        <input className="border-2 border-black text-black font-semibold py-2 px-4 w-full hover:cursor-auto" value={secretValue} onChange={(e)=>setSecretValue(e.target.value)} placeholder="Place your secret value"></input>
                    </div>
                </div>
                <div className="pt-2">

                </div>

                <div className="flex justify-between">
                    <div>
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-6 w-full hover:opacity-85" >Address</button>
                    </div>
                    <div className="pl-4">
                    </div>
                    <div className="w-full ">
                        <input className="border-2 border-black text-black font-semibold py-2 px-4 w-full hover:cursor-auto" value={secretValue} onChange={(e)=>setSecretValue(e.target.value)} placeholder="Place your recepient address"></input>
                    </div>
                </div>

                <div>
                    <div className="pt-2">
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-4 w-full hover:opacity-85">Withdraw</button>
                    </div>
                </div>  
            
            </>
        )
    }

    
    return(
        <>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="Save your secret"
            >
                <p className="border-solid border-2 overflow-x-auto h-32">{proofElements}</p>
                <div>
                    <button className="border-2 border-black bg-black text-white font-semibold py-2 px-4 w-full hover:opacity-85" onClick={async ()=>{await navigator.clipboard.writeText(proofElements)}}>Copy secret</button>
                </div>
            </Modal>
            <div className="flex h-full">
                <div className="min-h-full basis-3/5 flex justify-center items-center" >

                    <div className="border-x-2 border-b-2 border-black flex flex-col w-1/2 justify-center">
                        

                        <div className="flex justify-between">
                            <div>
                                <button className="text-white bg-black font-semibold py-2 px-4 hover:opacity-85" onClick={()=>{setIsDeposit(true)}}>Deposit</button>
                            </div>
                            <div className="border-y border-black w-full h-1 self-center">
                            </div>
                            <div>
                                <button className="text-white bg-black font-semibold py-2 px-4 hover:opacity-85" onClick={()=>{setIsDeposit(false)}}>Withdraw</button>
                            </div>

                        </div>
                        <div className="p-2">
                            {isDeposit?depositElement():withdrawElement()}
                        </div>
                    </div>

                </div>

                <div className="basis-2/5">
                    <img src={shadowBG}></img>
                </div>
            </div>
        </>
    )
}