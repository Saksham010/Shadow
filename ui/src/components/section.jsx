import { useState,useMemo } from "react";
import {ethers,providers} from "ethers";
import wc from "../../utils/witness_calculator";
import utils from "../../utils/util";
import {abi as ShadowABI} from "../../utils/ABI/shadowabi.json";
import shadowBG from "../assets/shadowbg.png";
import { useAccount, useConnectorClient } from 'wagmi'
import Modal from 'react-modal';
import { toast } from 'react-toastify';


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
    const [withdrawalAddress,setWithdrawalAddress] = useState('');
    const [proofElements,updateProofElements] = useState(null);
    const [modalIsOpen, setIsOpen] = useState(false);

    const { chainId,address } = useAccount();
    const shadowInterface  = new ethers.utils.Interface(ShadowABI);
    const shadowAddress = "0x4e78d4b152a0B251f3FF19f241893Afc17980C3E";

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

        if(address == undefined){
            return toast.error("Wallet not connected");
        }

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
            const receipt = await toast.promise(txHash.wait(),{
                pending:"Depositing funds 😎",
                error:"Deposit failed 😔",
                success:"Deposit successfull 🤯"
            });
            const log = receipt.logs[0];
            console.log("Log: ",log);
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

    //Withdraw 
    const withdrawEther = async () =>{
        if(address == undefined){
            return toast.error("Wallet not connected");
        }

        //Validate inputs are not empty
        if(withdrawalAddress == '' || secretValue == ''){
            alert("Empty field is not allowed");
        }else{
            try{
                const proofString = secretValue;
                const proofElements = JSON.parse(atob(proofString));
                const SnarkJS = window['snarkjs'];

                const proofInput = {
                    "root":proofElements.root,
                    "nullifierHash":proofElements.nullifierHash,
                    "recipient":utils.BNToDecimal(withdrawalAddress),
                    "secret":utils.BNToBinary(proofElements.secret).split(""),
                    "nullifier":utils.BNToBinary(proofElements.nullifier).split(""),
                    "hashPairings":proofElements.hashPairings,
                    "hashDirections":proofElements.hashDirections,
                }
                console.log("Proof of input later: ",proofInput)
                const {proof,publicSignals} = await SnarkJS.groth16.fullProve(proofInput,'../../utils/withdraw.wasm','../../utils/setup_final.zkey');
                console.log("Proof: ",proof);
                console.log("Public signal: ",publicSignals);
                const callInputs = [
                    proof.pi_a.slice(0, 2).map(utils.BN256ToHex),
                    proof.pi_b.slice(0, 2).map((row) => (utils.reverseCoordinate(row.map(utils.BN256ToHex)))),
                    proof.pi_c.slice(0, 2).map(utils.BN256ToHex),
                    publicSignals.slice(0, 2).map(utils.BN256ToHex),
                    withdrawalAddress
                ];
                const callData = shadowInterface.encodeFunctionData("withdraw",callInputs);
        
                const tx = {
                    to: shadowAddress,
                    from: address,
                    data: callData
                }
                
                const toastId = toast.loading("Sending withdrawal request 😎")
                fetch('http://127.0.0.1:3000/submit-transaction',{
                    method:'POST',
                    body: JSON.stringify({ txn: tx}),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((response)=>{
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    if(response.status != 200){
                        throw new Error("Withdrawal failed");
                    }
                    return response.json(); // Parse response body as JSON

                }).then((txResponse)=>{
                    toast.update(toastId, { render: "Withdrawal successfull 🤯", type: "success", isLoading: false,autoClose:5000,hideProgressBar: false});
                    console.log("Transaction Response: ",txResponse);
                }).catch(error => {
                    toast.update(toastId, { render: "Withdraw failed 😔", type: "error", isLoading: false, autoClose:5000,hideProgressBar: false});
                    console.error('Withdraw failed:', error);
                });

                // const txHash = await txnSigner.sendTransaction(tx);
                // const receipt = await txHash.wait();
                // console.log("Withdraw receipt: ",receipt);
            }catch(err){    
                console.log(err);
            }
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
                        <input className="border-2 border-black text-black font-semibold py-2 px-4 w-full hover:cursor-auto" value={withdrawalAddress} onChange={(e)=>setWithdrawalAddress(e.target.value)} placeholder="Place your recepient address"></input>
                    </div>
                </div>

                <div>
                    <div className="pt-2">
                        <button className="border-2 border-black bg-black text-white font-semibold py-2 px-4 w-full hover:opacity-85" onClick={withdrawEther}>Withdraw</button>
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
                shouldCloseOnOverlayClick={false}
            >
                <div className="h-44 overflow-x-auto">
                    <p className="break-words">{proofElements}</p>
                </div>
                <br></br>
                <div>
                    <button className="border-2 border-black bg-black text-white font-semibold py-2 px-4 w-full hover:opacity-85" onClick={async ()=>{
                        await navigator.clipboard.writeText(proofElements);
                        setIsOpen(val => !val);
                    }}>Copy secret</button>
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