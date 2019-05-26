const request = require('request')
const fs = require('fs')

let config = {}
let timeRetrieval = 1000

console.log('\x1b[32m%s\x1b[0m', 'Lori API is now Running. Watch log file for verification under logs directory.')

setInterval(function () {
    fs.readFile("config.json", { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            config = JSON.parse(data)
            timeRetrieval = config.time_retrieval
            fs.readFile(config.filepath, { encoding: 'utf-8' }, function (err, data) {
                fs.writeFile(config.filepath, '', () => { fs.close })
                if (!err && data.length > 0) {
                    var username = config.lori_username
                    var password = config.lori_password
                    if (config.reject_unauthorized) {
                        var cert = fs.readFileSync(config.cert_path)
                    }
                    var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
                    const alerts = data.split('\n').reverse().slice(1).reverse()
                    var body = ''
                    for (const a of alerts) {
                        body += '{"index":{}}\n'
                        body += a + '\n'
                    }
                    body += '\n'
                    request({
                        url: "https://" + config.elastic_server_ip + ":9200/lori_" + config.client_name + "/lori/_bulk",
                        method: "POST",
                        headers: {
                            "Authorization": auth,
                            "content-type": "application/x-ndjson",
                        },
                        body: body,
                        rejectUnauthorized: config.reject_unauthorized,
                        agentOptions: {
                            ca: cert
                        }
                    }, function (error, response) {
                        if (response) {
                            resJson = JSON.parse(response.body)
                            if (resJson.errors == false) {
                                fs.writeFile(config.filepath, '', () => { fs.close }) //Erases the file content
                                fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Pushed new alerts to ELK\n', () => { fs.close })
                            } else {
                                console.log('\x1b[31m%s\x1b[0m', 'An error occurred when pushing alerts to Elastic. Please check the logs logs/lori.log')
                                fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Error: ' + response.body + '\n', () => { fs.close })
                            }
                        } else {
                            fs.writeFile(config.filepath, data, () => { fs.close })
                            console.log('\x1b[31m%s\x1b[0m', 'An error occurred when pushing alerts to Elastic: ' + error)
                            fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Error: ' + error + '\n', () => { fs.close })
                        }
                    })
                } else {
                    if (err)
                        fs.writeFile(config.log_filepath, err, () => { })
                        fs.writeFile(config.filepath, data, () => { fs.close })

                    //fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Nothing to push to ELK\n', () => { fs.close })
                }
            })
        } else {
            console.log(err)
        }
    })
}, timeRetrieval)