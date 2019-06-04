exports.data = function vencimento(checar) {
let data = new Date (checar)
let day = data.getDay();
let fds = (day === 6) || (day === 0);   
if (fds == false){
    return checar

}else if(fds == true){
    let result = checar
    result.setDate(result.getDate() + 2);
    return result
}
}
