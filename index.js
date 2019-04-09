const request = require('request')
const fs = require('fs')

let config = {}

fs.readFile("config.json", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        config = JSON.parse(data)
        fs.readFile(config.filepath, {encoding: 'utf-8'}, function(err,alerts){
            if (!err) {
                //var newData = alerts
                request({
                    url: "http://127.0.0.1:3000/" + config.client_name,
                    method: "POST",
                    headers: {
                        "content-type": "text/plain",  // <--Very important!!!
                    },
                    body: alerts
                }, function (error, response, body){
                    console.log(response)
                    if(response.body == 'Log saved!')
                        fs.writeFile(config.filepath, '', function(){console.log('done')}) //Erases the file content
                })
            } else {
                console.log(err)
            }
        })
    } else {
        console.log(err)
    }
})


function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}