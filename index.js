var organizer = require('./organizer/organizer.js');
const fastify = require('fastify')({
    logger: true
})
const path = require('path')
const fs = require('fs');
const PATH = fs.readFileSync("path.txt").toString().replace("\n", "").replace("\r", "").trim()
const CryptoJS = require("crypto-js");

const master = 'SHA512 of the master key';

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'static'),
    decorateReply: false
})

fastify.register(require('@fastify/static'), {
    root: PATH,
    prefix: "/cdn/",
    decorateReply: false
})

fastify.addContentTypeParser('application/json', {
    parseAs: 'string'
}, function(req, body, done) {
    try {
        var json = JSON.parse(body)
        done(null, json)
    } catch (err) {
        err.statusCode = 400
        done(err, undefined)
    }
})

// Declare routes
fastify.get('/path', async (request, reply) => {
    reply.send(PATH)
})

fastify.get('/retrieve', async (request, reply) => {
    var folder = 'libraries/'
    var lib_arr = {}
    fs.readdirSync(folder).forEach(function(file) {
        new_file = folder + '/' + file;
        lib_arr[file] = JSON.parse(fs.readFileSync(new_file))
    });
    reply.send(JSON.stringify(lib_arr))
})

fastify.post('/scan', async (request, reply) => {
    if (!request.body.hasOwnProperty("name")) {
        reply.send(JSON.stringify({
            sucess: false,
            error: "No 'name' argument passed"
        }))
        return
    }
    if (request.body.name.trim() == "") {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Empty 'name' argument"
        }))
        return
    }
    var lib_path = 'libraries/' + request.body.name
    var library;
    try {
        library = JSON.parse(fs.readFileSync(lib_path))
    } catch (err) {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Library not found"
        }))
        return
    }
    try {
        library.lib = await organizer.folder(library.path, library.type)
    } catch (err) {
        reply.send(JSON.stringify({
            sucess: false,
            error: "An error has occured while parsing the library"
        }))
        console.log(err)
        return
    }
    fs.writeFileSync(lib_path, JSON.stringify(library), function(err) {
        if (err) throw err;
    });
    console.log('Library "' + request.body.name + '" scaned !');
    reply.send(JSON.stringify({
        sucess: true
    }))
})

fastify.post('/del', async (request, reply) => {
    if (!request.body.hasOwnProperty("name") ||
        !request.body.hasOwnProperty("pwd")) {
        reply.send(JSON.stringify({
            sucess: false,
            error: "No 'name' argument passed"
        }))
        return
    }
    if (request.body.name.trim() == "") {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Empty 'name' argument"
        }))
        return
    }
    var hash;
    try {
        hash = CryptoJS.SHA512(request.body.pwd).toString();
    } catch {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Authentification failed, please retry."
        }))
        return
    }
    if (hash === master) {
        var lib_path = 'libraries/' + request.body.name
        var library;
        try {
            fs.unlinkSync(lib_path);
        } catch (err) {
            reply.send(JSON.stringify({
                sucess: false,
                error: "Library not found"
            }))
            return
        }
        reply.send(JSON.stringify({
            sucess: true
        }))
    } else {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Wrong password."
        }))
        return
    }
})

fastify.post('/add', async (request, reply) => {
    if (!request.body.hasOwnProperty("pwd") ||
        !request.body.hasOwnProperty("path") ||
        !request.body.hasOwnProperty("type") ||
        !request.body.hasOwnProperty("name")) {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Please fill all the fields."
        }))
        return
    }
    if (request.body.pwd.trim() == "" ||
        request.body.path.trim() == "" ||
        request.body.type.trim() == "" ||
        request.body.name.trim() == "") {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Please fill all the fields."
        }))
        return
    }
    var hash;
    try {
        hash = CryptoJS.SHA512(request.body.pwd).toString();
    } catch {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Authentification failed, please retry."
        }))
        return
    }
    if (hash === master) {
        if (request.body.path != request.body.path.replace(/\/\.\./g, '')) {
            reply.send(JSON.stringify({
                sucess: false,
                error: "Invalid path"
            }))
            return
        }
        var lib;
        try {
            lib = await organizer.folder(PATH + request.body.path, request.body.type)
        } catch (err) {
            reply.send(JSON.stringify({
                sucess: false,
                error: "An error has occured while parsing the library"
            }))
            console.log(err)
        }
        var path = 'libraries/' + request.body.name
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify({
                path: PATH + request.body.path,
                type: request.body.type,
                lib: lib
            }), function(err) {
                if (err) throw err;
            });
            console.log('New library added !');
            reply.send(JSON.stringify({
                sucess: true
            }))
        } else {
            reply.send(JSON.stringify({
                sucess: false,
                error: "This name is already use for another library"
            }))
        }
    } else {
        reply.send(JSON.stringify({
            sucess: false,
            error: "Wrong password."
        }))
        return
    }
})

// Run the server!
const start = async () => {
    try {
        await fastify.listen({
            port: 2000,
            host: '0.0.0.0'
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
