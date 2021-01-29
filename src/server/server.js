import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
var cors = require('cors')




let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const ACCOUNT_OFFSET = 20;  // 0 => contract owner; 1 - 10 => airlines; 11 - 15 => passengers
const ORACLES_COUNT = 25;   // Start with 25 Oracles for now.

let oracle_accounts = [];

//Unknown (0), On Time (10) or Late Airline (20), Late Weather (30), Late Technical (40), or Late Other (50)
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUS_CODES  = [STATUS_CODE_UNKNOWN,
   STATUS_CODE_ON_TIME, 
   STATUS_CODE_LATE_AIRLINE,
    STATUS_CODE_LATE_WEATHER,
     STATUS_CODE_LATE_TECHNICAL,
      STATUS_CODE_LATE_OTHER];

let eventIndex = null;


function getRandomStatusCode() {
  return STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
}

// Register Oracles
web3.eth.getAccounts((error, accounts) => {

  let contractOwner = accounts[0];

  if(accounts.length < ORACLES_COUNT + ACCOUNT_OFFSET) {
    throw "Error encountered: Please increase the number of accounts to atleast " + (ORACLES_COUNT + ACCOUNT_OFFSET)
  }

  flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: contractOwner }, (error, result) => {
      if(error) {
        console.log(error);
      } else {
        console.log("Registered App as authorized caller.");
      }
    });

  // Resolve Oracle Registration Fee from Contract
  flightSuretyApp.methods
    .REGISTRATION_FEE()
    .call({ from: contractOwner}, (error, result) => {
      if(error) {
        console.log(error);

      } else {
        let registrationFee = result;

        // Register Oracles
        for(let i = ACCOUNT_OFFSET; i < ORACLES_COUNT + ACCOUNT_OFFSET; i++) {
          flightSuretyApp.methods
            .registerOracle()
            .send({ from: accounts[i], value: registrationFee, gas: 4000000}, (reg_error, reg_result) => {
              if(reg_error) {
                console.log(reg_error);

              } else {

                // Fetch Indexes for a specific oracle account
                flightSuretyApp.methods
                  .getMyIndexes()
                  .call({ from: accounts[i]}, (fetch_error, fetch_result) => {
                    if (error) {
                      console.log(fetch_error);

                    } else {
                      // Added registered account to oracle account list
                      let oracle = {
                        address: accounts[i],
                        indexes: fetch_result
                      };

                      oracle_accounts.push(oracle);
                      console.log("Oracle registered: " + JSON.stringify(oracle));
                    }
                  });
              }
            });
        }
      }
    });
});

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: "latest"
}, function (error, event) {
    if (error) {
        console.log(error)
    }
    console.log(event);
    
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;
    let indexes = event.returnValues.indexes;
    let statusCode = event.returnValues.statusCode;

    for(let a=0; a< oracle_address.length; a++){
        console.log("Oracle loop ",a);
        flightSuretyApp.methods
          .submitOracleResponse(indexes, airline,flight,timestamp, statusCode)
          .send({ 
            from: oracle_address[a] 
          }).then(result => {
            console.log(result);
        }).catch(err => {
          console.log("Oracle didn't respond");

        });
    }

});


flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)

  eventIndex = event.returnValues.index;
  console.log(event)
});

const app = express();
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}
app.use(cors(corsOptions));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

app.get('/eventIndex', (req, res) => {
  res.json({
    result: eventIndex
  })
}) 

export default app;