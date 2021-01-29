import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

var BigNumber = require('bignumber.js');

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.weiMultiple = (new BigNumber(10)).pow(18);
        

        // Watch contract events
        const STATUS_CODE_UNKNOWN = 0;
        const STATUS_CODE_ON_TIME = 10;
        const STATUS_CODE_LATE_AIRLINE = 20;
        const STATUS_CODE_LATE_WEATHER = 30;
        const STATUS_CODE_LATE_TECHNICAL = 40;
        const STATUS_CODE_LATE_OTHER = 50;

        this.STATUS_CODES = Array(STATUS_CODE_UNKNOWN, STATUS_CODE_ON_TIME, STATUS_CODE_LATE_AIRLINE, STATUS_CODE_LATE_WEATHER, STATUS_CODE_LATE_TECHNICAL, STATUS_CODE_LATE_OTHER);

    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
     
            
            while(this.airlines.length < 5) {
                // Register the airlines
                this.registerAirline(accts[counter]);
                this.airlines.push(accts[counter]);
                counter++;
            }
            // Fund this airline to be used in the project.
            this.fundAirline(this.airlines[2]);
            console.log(this.airlines);


            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    registerAirline(airlineAddress){
        let self =this;
        self.flightSuretyApp.methods
            .registerAirline(airlineAddress)
            .send({from: this.owner}, (error, result) => {

            });
    }
    fundAirline(airlineAddress){
        let self = this;
        let fee = Web3.utils.toWei(("10").toString(), "ether")

        self.flightSuretyApp.methods
            .fund()
            .send({from: airlineAddress, value: fee}, (error, result) =>{
                console.log("ERROR "+error);
                console.log("RESULT "+result);
            });

    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    submitOracleResponse(indexes, airline, flight, timestamp, callback){
        let self = this;


        let payload = {
            indexes: indexes,
            airline: self.airlines[2],
            flight: flight,
            timestamp: timestamp,
            statusCode: self.STATUS_CODES[Math.floor(Math.random()*self.STATUS_CODES.length)]
        }

        console.log(payload);

        self.flightSuretyApp.methods
            .submitOracleResponse(payload.indexes, payload.airline, payload.flight, payload.timestamp, payload.statusCode)
            .send({from: self.owner}, (error, result) =>{
                callback(error, payload);

            });

    }

    

    buy(price,fid, callback){
        let self = this;
        self.price = Number(price);

        let payload = {
            airline: this.airlines[2],
            passenger: self.passengers[1],
            price_wei:   Web3.utils.toWei("1", "ether")
        }
        console.log(payload);
        self.flightSuretyApp.methods
            .buy(payload.airline)
            .send({from: payload.passenger, value: payload.price_wei}, (error, result) => {
                console.log(error);
                callback(error, result);
            });
    }

    withdraw(callback){
        let self = this;
        let payload = {
            airline :   self.airlines[2],
            passenger: self.passengers[1]
        }
        self.flightSuretyData.methods
        .withdraw()
        .send({from: payload.passenger}, (error, result) => {
            callback(error, payload);
        });
        
    }

    

    status(flight,callback){
        let self = this;
        self.flightSuretyData.methods
        .getAirlineStatusInfo( this.airlines[flight])
        .send({from: this.owner}, (error, result) => {
            callback(error, result);
        });
        
    }


}