const request = require('request')
const fs = require('fs')

let config = {}

console.log('\x1b[32m%s\x1b[0m', 'Lori API is now Running. Watch log file for verification under logs directory.')

setInterval(function () {
    fs.readFile("config.json", { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            config = JSON.parse(data)
            fs.readFile(config.filepath, { encoding: 'utf-8' }, function (err, data) {
                fs.writeFile(config.filepath, '', () => { fs.close })
                if (!err && data.length > 0) {
                    const alerts = data.split('\n').reverse().slice(1).reverse()
                    var body = ''
                    for (const a of alerts) {
                        body += '{"index":{}}\n'
                        body += a + '\n'
                    }
                    body += '\n'
                    request({
                        url: "https://" + config.elastic_server_ip + ":9200/lori/" + config.client_name + "/_bulk",
                        method: "POST",
                        headers: {
                            "content-type": "application/x-ndjson",
                        },
                        body: body
                    }, function (error, response) {
                        if (response) {
                            resJson = JSON.parse(response.body)
                            if (resJson.errors == false) {
                                fs.writeFile(config.filepath, '', () => { fs.close }) //Erases the file content
                                fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Pushed new alerts to ELK\n', () => { fs.close })
                            } else {
                                console.log('\x1b[31m%s\x1b[0m', 'An error occurred during updating alerts in Elastic. Please check the logs logs/lori.log')
                                fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Error: ' + response.body + '\n', () => { fs.close })
                            }
                        } else {
                            fs.writeFile(config.filepath, data, () => { fs.close })
                            console.log('\x1b[31m%s\x1b[0m', 'An error occurred during updating alerts in Elastic.')
                        }
                    })
                } else {
                    if (err)
                        fs.writeFile(config.log_filepath, err, () => { })
                        fs.writeFile(config.filepath, data, () => { fs.close })

                    fs.appendFile(config.log_filepath, (new Date()).toJSON().slice(0, 19).replace(/[-T]/g, ':') + ' Nothing to push to ELK\n', () => { fs.close })
                }
            })
        } else {
            console.log(err)
        }
    })
}, 1000)