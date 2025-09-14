function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export { ab2str };