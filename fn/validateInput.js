const { sendErrorResponse } = require("../fn/endpointBoilerplate");

function validateInput(res, keyArray, payloadObject) {
  if (keyArray === undefined || keyArray.length === 0) {
    sendErrorResponse(res, "XVL", "XVL-068");
    return false;
  } else if (payloadObject === undefined) {
    sendErrorResponse(res, "PDM", "PDM-880");
    return false;
  } else {
    let missingArgsList = "";
    let missingArgsCount = 0;
    for (let ix = 0; ix < keyArray.length; ix++) {
      if (payloadObject[keyArray[ix]] === undefined) {
        missingArgsList += `Property "${keyArray[ix]}" expected. `;
        missingArgsCount++;
      }
    }
    if (missingArgsCount > 0) {
      sendErrorResponse(res, "MID", missingArgsList);
      return false;
    } else if (missingArgsCount === 0) {
      return true;
    }
  }
}

export { validateInput };
