import reactLogo from '../assets/react.svg'
import shadowLogo from "../assets/shadowlogo.jpeg";
import { ConnectButton } from '@rainbow-me/rainbowkit';


export default function Navbar(){
    // bg-[#101315]
    return(
        <div >
            <div className='flex border-b-2 border-black justify-between items-center '>
                <div>
                    <img width={100} height={100} src={shadowLogo}></img>
                </div>
                <div className='pr-6'>
                    <ConnectButton/>
                </div>
            </div>

        </div>
    )


}