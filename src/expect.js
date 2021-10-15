import { check, group } from "k6";
import Ajv from 'https://jslib.k6.io/ajv/6.12.5/index.js';

import { expect, util, Assertion, AssertionError, config } from "https://cdnjs.cloudflare.com/ajax/libs/chai/4.3.4/chai.min.js";

const truncateString = (str, len) => str.length > len ? `${str.substring(0, len)}...` : str;

config.truncateValueThreshold = 100; // individual variables should be up to 100 chars.
config.truncateMsgThreshold = 300; // whole check() message must be below 300 chars.

function k6getMessage(obj, args){
  var negate = util.flag(obj, 'negate')
    , val = util.flag(obj, 'object')
    , expected = args[3]
    , actual = util.getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = util.flag(obj, 'message')
    , anonymizeMsgFunction = util.flag(obj, 'anonymizeMsgFunction');

  if(anonymizeMsgFunction){
    msg = anonymizeMsgFunction(msg)
  }

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return truncateString(util.objDisplay(val), config.truncateValueThreshold) })
    .replace(/#\{act\}/g, function () { return truncateString(util.objDisplay(actual), config.truncateValueThreshold) })
    .replace(/#\{exp\}/g, function () { return truncateString(util.objDisplay(expected), config.truncateValueThreshold) });
config.truncateValueThreshold
  msg = flagMsg ? flagMsg + ': ' + msg : msg;

  return truncateString(msg, config.truncateMsgThreshold);
}

/*
Hacking the Chai library to use k6 checks.
*/
util.overwriteMethod(Assertion.prototype, 'assert', function (_super) {
  return function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (false !== showDiff) showDiff = true;
    if (undefined === expected && undefined === _actual) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    msg = k6getMessage(this, arguments);

    var actual = util.getActual(this, arguments);
    var assertionErrorObjectProperties = {
        actual: actual
      , expected: expected
      , showDiff: showDiff
    };

    var operator = util.getOperator(this, arguments);
    if (operator) {
      assertionErrorObjectProperties.operator = operator;
    }

    if (!ok) {

      check(null, {
        [msg]: false
      })
      throw new AssertionError(
        msg,
        assertionErrorObjectProperties,
        (config.includeStack) ? this.assert : util.flag(this, 'ssfi'));
    }
    else{
      check(null, {
        [msg]: true
      })
    }
  };
});



const _ajv = new Ajv();

util.addMethod(Assertion.prototype, 'matchApiSchema', function (schema) {
  var data = util.flag(this, 'object');
  // var data = util.flag(this, 'apiSchemaMessage', "Hejo");

  // new chai.Assertion(obj).to.be.equal(str);
  let validate = _ajv.compile(schema);

  let is_valid = validate(data, schema);

  // optional. It records specific error messages as checks.
  if (!is_valid) {
    console.error(JSON.stringify(validate.errors));

    validate.errors.forEach(error => {
      check(is_valid, {
        [`XXX ${error.dataPath} ${error.message}`]: (is_valid) => is_valid
      });
    });
  }

  this.assert(
    is_valid
  , "expected to match API schema"
  , "expected to not not match the API schema"
  , null   // expected
  , null   // actual
  );  
});

util.addMethod(Assertion.prototype, 'anonymize', function (anonymizeMsgFunction) {
  anonymizeMsgFunction = anonymizeMsgFunction || function(msg) {
    return msg.replace(/#\{this\}/g, function () { return "<anonymized>"; })
  }

  util.flag(this, 'anonymizeMsgFunction', anonymizeMsgFunction);
});


util.addMethod(Assertion.prototype, 'validJsonBody', function () {

  var response = util.flag(this, 'object');

  let checkIsSuccessful = true;
  try {
    response.json();
  }
  catch (e) {
    checkIsSuccessful = false;
  }

  this.assert(
    checkIsSuccessful
  , `has valid json body`
  , "does not have a valid json body"
  , null   // expected
  , null   // actual
  );    

});

function handleUnexpectedException(e, testName) {
  console.error(`Exception raised in test "${testName}". Failing the test and continuing. \n${e}`)

  check(null, {
    [`Exception raised "${e}"`]: false
  });
}

// function runStep(stepName, stepFunction){
//   let t = {
//     expect,
//   };
//   let success = true;
//   group(stepName, () => {
//     try {
//       stepFunction(t);
//       success = true;
//     }
//     catch (e) {
//       if (e.brokenChain) { // legacy way
//         success = false;
//       }
//       else if (e.name === "AssertionError" ) { // chai way
//         success = false;
//       }
//       else {
//         success = false;
//         handleUnexpectedException(e, stepName)
//       }
//     }
//   });
//   return success;
// }

// let flowSteps = [];

// let workflow = function (flowName, flowFunction){

//   group(flowName, () => {
//     flowSteps = [];
//     flowFunction();
//     console.log(JSON.stringify(flowSteps, null, 2));

//     for(let step of flowSteps){
//       const success = runStep(step.stepName, step.stepFunction)
//       if(!success) break;
//     }

//   });
// }
// let describe = function (stepName, stepFunction) {
//     flowSteps.push({stepName, stepFunction});
// }

let describe = function (stepName, stepFunction) {

  let success = true;

  group(stepName, () => {
    try {
      stepFunction();
      success = true;
    }
    catch (e) {
      if (e.brokenChain) { // legacy way
        success = false;
      }
      else if (e.name === "AssertionError" ) { // chai way
        success = false;
      }
      else {
        success = false;
        handleUnexpectedException(e, stepName)
      }
    }
  });
  return success;
};


export {
  describe,
  expect,
  // workflow,
}