function charCodeArrayToString(charCodeArray: number[]) {
  let str = "";
  for (let i = 0; i < charCodeArray.length; i++) {
    str += String.fromCharCode(charCodeArray[i]);
  }
  return str;
}

function stringToCharCodeArray(str: any) {
  let stringActual = str;
  if (str === undefined) {
    throw new Error("stringToCharCodeArray: str is undefined");
  } else {
    if (typeof str !== "string") {
      stringActual = str.toString();
    }
  }
  const charCodeArray = [];
  for (let i = 0; i < stringActual.length; i++) {
    //@ts-expect-error
    charCodeArray.push(stringActual.charCodeAt(i));
  }
  return charCodeArray;
}

export { stringToCharCodeArray, charCodeArrayToString };
