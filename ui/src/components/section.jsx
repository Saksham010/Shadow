import { useState } from "react";
import {ethers} from "ethers";
import wc from "../../utils/witness_calculator";
import utils from "../../utils/util";
import {abi as ShadowABI} from "../../utils/ABI/shadowabi.json";
import shadowBG from "../assets/shadowbg.png";
export default function Section(){

    const [isDeposit,setIsDeposit] = useState(true);
    const [secretValue, setSecretValue] = useState('');

    const shadowInterface  = new ethers.utils.Interface(ShadowABI);
    const shadowAddress = "";

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
        const value = ethers.BigNumber.from("10000000000000000").toHexString();

        const tx = {
            to: shadowAddress,
            from :,
            value:value,
            data: shadowInterface.encodeFunctionData("deposit",[commitment])
        }
        // Send transaction
        try{
            const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });

            const proofElements = {
                nullifierHash: `${nullifierHash}`,
                secret: secret,
                nullifier: nullifier,
                commitment: `${commitment}`,
                txHash: txHash
            };

            console.log("Transaction hash: ",txHash);
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