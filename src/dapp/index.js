
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

let result = null;
let airlines = null;
let flightName = null;
let depature = null;



(async() => {

    let result = null;

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
      }

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                airlines = result.airline;
                depature = result.timestamp;
                flightName = result.flight;
                console.log(result);
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        // GEt oracles response
        DOM.elid('oracle-response').addEventListener('click', () => {
            
             
            fetchOracleIndex();

            sleep(500).then(() => {
                let airline = airlines;
                    let flight = flightName;
                    let timestamps = depature;
                let eventIndex_ = DOM.elid('holdIndex').innerHTML;
                
                contract.submitOracleResponse(parseInt(eventIndex_), airline, flight, timestamps, (error, result) => {
                    console.log("The value event is ",eventIndex_);

                    DOM.elid("oracle-response").style.display="block";

                    //Unknown (0), On Time (10) or Late Airline (20), Late Weather (30), Late Technical (40), or Late Other (50)
                    let statusMessage = "Unknown"
                    if(result.statusCode == "10")
                        statusMessage = "On Time"
                    if(result.statusCode == "20")
                        statusMessage = "Late Airline"  
                    if(result.statusCode == "30")
                        statusMessage = "Late Weather"  
                    if(result.statusCode == "40")
                        statusMessage = "Late Technical"  
                    if(result.statusCode == "50")
                        statusMessage = "Late Other"


                     displayResult('flight-status','Flight', '', [ { label: 'Status', error: '', value: statusMessage} ]);

                                    
                     });
                })

             });


      


        // Listen to pay insurance event
        DOM.elid('purchase-insurance').addEventListener('click', () => {
            let price = DOM.elid('insurance').value;
            let fid = DOM.elid('insured_flights').value;
            let fdate = DOM.elid('flightDate').value;
            contract.buy(price,fid, (error, result)=> {
                console.log("Insurance purchased with", price);
                displayResult('insurance-status','Insurance', '', [ { label: 'Assurance Detail', 
                error: error, value: "Flight Name: "+fid+" | Depature Date: "+fdate+" | Assurance Paid: "+price+" ether"+ " | Paid on Delay: "+price*1.5+" ether"}]);
            });
        });

        DOM.elid('status').addEventListener('click', () => {
            let fid = DOM.elid('flights').value;
            contract.status(fid, (error, result)=> {
                displayResult('flight-all-status','Flight', '', [ { label: 'Status', error: error, value: result} ]);

            });
        });

        

        // Passenger withdraw funds
        DOM.elid('withdraw-funds').addEventListener('click', () => {
            contract.withdraw((error, result) => {

                DOM.elid('withdraw-funds').style.display = "none"; 
                DOM.elid('table-report').style.display = "none"; 

                DOM.elid("withdrawn-value").innerHTML = DOM.elid("delay").innerHTML;
                DOM.elid("withdrawn").style.display = "block";
                console.log('Successfull');
            });

        })
        // end insurance purchase function


    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displayResult(id,title, description, results) {
    let displayDiv = DOM.elid(id);
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function fetchOracleIndex(response){
    // Fetch flight status
            const responseURL = 'http://localhost:3000/eventIndex';  //our url here

            fetch(responseURL)  
            .then(  
                function(res) {  
                    if (res.status !== 200) {  
                        console.warn('Looks like there was a problem. Status Code: ' + res.status);  
                        return;  
                    }

                    // Examine the text in the response
                    res.json().then(function(dataf) {  
                        let p = document.getElementById('holdIndex');  
                        dataf = dataf.result;
                        p.innerHTML = parseInt(dataf);
                    }); 
                }  
            )  
            .catch(function(err) {  
                console.error('Fetch Error -', err);  
            });
         
        }






