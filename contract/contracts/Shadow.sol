// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./MiMCSponge.sol";
import "./ReentrancyGuard.sol";

contract Shadow is ReentrancyGuard {
    Hasher hasher;

    uint8 public treeLevel = 10;
    uint256 public denomination = 0.001 ether;
    uint256 nextLeafIdx = 0;

    mapping(uint256 => bool) public roots; //Hashed root
    mapping(uint8 => uint256) lastLevelHash; //Latest hashed root
    mapping(uint256 => bool) public nullifierHashes; 
    mapping(uint256 => bool) public commitments;

    event Deposit(uint256 root, uint256[10] hashPairings, uint8[10] pairDirection);
    event Withdrawal(address to, uint256 nullifierHash);

    uint256[10] levelDefaults = [
        23183772226880328093887215408966704399401918833188238128725944610428185466379,
        24000819369602093814416139508614852491908395579435466932859056804037806454973,
        90767735163385213280029221395007952082767922246267858237072012090673396196740,
        36838446922933702266161394000006956756061899673576454513992013853093276527813,
        68942419351509126448570740374747181965696714458775214939345221885282113404505,
        50082386515045053504076326033442809551011315580267173564563197889162423619623,
        73182421758286469310850848737411980736456210038565066977682644585724928397862,
        60176431197461170637692882955627917456800648458772472331451918908568455016445,
        105740430515862457360623134126179561153993738774115400861400649215360807197726,
        76840483767501885884368002925517179365815019383466879774586151314479309584255
    ];

    constructor(address _hasher,address _verifier){
        hasher = Hasher(_hasher);

    }

    function deposit(uint256 _commitment) external payable nonReentrant{
        require(msg.value == denomination, "Only deposit of 0.001 ETH is allowed");
        require(!commitments[_commitment], "Duplicate commitment");
        require(nextLeafIdx < 2 ** treeLevel, "Merkle tree has been filled. No more deposit can be made");

        uint256 newRoot;
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint256 currentIdx = nextLeafIdx;
        uint256 currentHash = _commitment;

        uint256 left;
        uint256 right;
        uint256[2] memory ins; //For sponge

        for(uint8 i=0; i < treeLevel; i++){
            lastLevelHash[treeLevel] = currentHash;

            //If the node is on left
            if(currentIdx % 2 == 0){
                left = currentIdx;
                right = levelDefaults[i];
                hashPairings[i] = levelDefaults[i];
                hashDirections[i] = 0; //Left
            }else{
                left = lastLevelHash[i];
                right = currentHash;
                hashPairings[i] = lastLevelHash[i]; //Sibling pairing of the current commitment
                hashDirections[i] = 1; //Right

                ins[0] = left;
                ins[1] = right;

                (uint256 h) = hasher.MiMC5Sponge{gas: 150000}(ins, _commitment);
                currentHash = h;
                currentIdx = currentIdx / 2;
            }
        }
        newRoot = currentHash;
        roots[newRoot] = true;
        nextLeafIdx += 1;
        commitments[_commitment] = true;
        emit Deposit(newRoot, hashPairings, hashDirections);
}

}


