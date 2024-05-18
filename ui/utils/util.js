const  utils = {

    BNToBinary: (str) =>{
        let r = BigInt(str).toString(2);
        let prePadding = "";
        let paddingAmount = 256 - r.length;
        for(let i=0; i < paddingAmount; i++){
            prePadding += "0";
        }
        return prePadding + r;
    }


}
export default utils;

