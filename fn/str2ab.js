function str2ab(str) {
    const enc = new TextEncoder();
    return enc.encode(str);
}


export { str2ab }