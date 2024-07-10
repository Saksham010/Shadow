require("dotenv").config();
const express = require("express");
const ethers = require("ethers");
const cors = require("cors");

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API);
const wallet = new ethers.Wallet(process.env.WALLET_KEY);
const walletWithProvdier = wallet.connect(provider);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    return res.status(200).json({message:"Server OK"});
})

app.post('/submit-transaction',async (req,res)=>{
    console.log("Received relay request");
    console.log("Request txn: ",req.body.txn);
    
    try{
        const {txn} = req.body;
        if(!txn){
            return res.status(400).json({message:"No signed transaction was sent"});
        }else{
            console.log("Entry");
            console.log("Wallet provider: ",walletWithProvdier);
            const forwarderAddress = walletWithProvdier.address;
            const forwardedTxn = {...txn,from:forwarderAddress};
            const tx = await walletWithProvdier.sendTransaction(forwardedTxn);
            const txReceipt = await tx.wait();
            console.log("Transaction: ",txReceipt);
            console.log("Relay successfull");
            return res.status(200).json({message:"Withdraw successfull",receipt:txReceipt});
        }

    }catch(err){
        console.log("Relay failed: ",err.message);
        return res.status(400).json({message:err.message});

    }
})

app.listen(PORT,()=>{
    console.log(`Server started on port: ${PORT}`)
})
