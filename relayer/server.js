require("dotenv").config();
const express = require("express");
const ethers = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API);
const wallet = new ethers.Wallet(process.env.WALLET_KEY);
const walletWithProvdier = wallet.connect(provider);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/',(req,res)=>{
    return res.json({message:"Server OK"});
})

app.post('/submit-transaction',async (req,res)=>{
    console.log("Received relay request");
    
    try{
        const {txn} = req.body;
        if(!txn){
            return res.json({message:"No signed transaction was sent"});
        }else{
            const tx = await walletWithProvdier.sendTransaction(txn);
            const txReceipt = await tx.wait();
            console.log("Transaction: ",txReceipt);
            console.log("Relay successfull");
            return res.json({message:"Withdraw successfull",receipt:txReceipt});
        }

    }catch(err){
        console.log("Relay failed");
        return res.json({message:err.message});

    }
})

app.listen(PORT,()=>{
    console.log(`Server started on port: ${PORT}`)
})
