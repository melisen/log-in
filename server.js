
const express = require("express")
const session = require("express-session");
const MongoStore = require("connect-mongo");
const {Server: HTTPServer} = require("http")
const {Server: IOServer} = require("socket.io");
const {faker} = require("@faker-js/faker");
const  {mongoose}  = require("mongoose");
const handlebars = require('express-handlebars');


const {normalizr, normalize, schema, denormalize} = require("normalizr");

const app = express()
const httpServer = new HTTPServer(app)
const io = new IOServer(httpServer)


app.use(express.urlencoded({extended: true}))
app.use(express.json())

//PERSISTENCIA PRODUCTOS
const {optionsSQL} = require("./options/mysql.js");
const Contenedor = require('./clase-contenedor.js');
const arrayProductos = new Contenedor(optionsSQL, "productos");

app.use(express.static('views'));



//*HANDLEBARS

app.set('views', './views/')
 const hbs = handlebars.engine({
   extname: "hbs",
   layoutsDir: "./views/layouts/",
 });
 app.engine("hbs", hbs);
 app.set("view engine", "hbs");




//productos-test
let listaProductos = [];
function crearProductosRandom(){
    for(let i=0; i<5; i++){
        listaProductos.push( 
            {
                title: faker.commerce.product().toString(),
                price: faker.commerce.price(100, 200, 0, '$').toString(),
                thumbnail: faker.image.imageUrl(100, 100).toString()
            } 
        )
    }
    return listaProductos;
}

// PERSISTENCIA MENSAJES
const ContenedorFS =  require('./contenedor-fs.js');
const mensajesFS = new ContenedorFS('./mensajes.json')





//RUTAS

//SESSION

app.use(
    session({
      store: MongoStore.create({
        mongoUrl:
          "mongodb+srv://melisen:EFFkTlygr79N2nYi@cluster0.gvsgobk.mongodb.net/?retryWrites=true&w=majority",
        mongoOptions: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
      }),
  
      secret: "secreto",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 600000
      }
    })
  );

//LOGIN
app.get("/", (req, res) => {
  return res.redirect("/login")
})

  app.get("/login", (req, res) => {
    res.render("main", { layout: "login"})
  });

  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username == "pepe" || password == "pepepass") {
      req.session.user = username;
      req.session.password = password;
      res.redirect("/api/productos");  
      
    }else{
      res.send("login failed")
    }
  })




//AUTH
  function auth(req, res, next) {
    if (req.session && req.session?.user === "pepe" && req.session?.password === "pepepass") {
      return next();
    } else {
      return res.status(401).send("error de autorización!");
    }
  }

  app.get("/api/productos", auth, async (req, res) => {
    try{
        const listaProductos = await arrayProductos.getAll();
        if(listaProductos){
            res.render("main", { layout: "vista-productos", productos: listaProductos});
        }else{
            res.render("main", {layout: "error"})
        }
    }
    catch(err){
        console.log(err)
    }
  });

  app.get('/api/productos-test', auth, async (req, res)=>{
    res.render("main", { layout: "productos-test"})
})

//LOGOUT
app.get("/logout", (req, res) => {
  const {username} = req.body;
    req.session.destroy((err) => {
      if (err) {        
        console.log(err)
            res.send("no se pudo deslogear");
      } else {
            res.render("main",{ layout: "logout", username: username });
            //setTimeout(res.render("main",{ layout: "login" }), 2000) 
        }
    });
  });


//NORMALIZACION
function normlizarChat(messages){
            //esquemas para normalizacion
            const author = new schema.Entity('author',{}, { idAttribute: 'email' });

            const message = new schema.Entity('message', 
            { author: author }, 
            { idAttribute: "id" })

            const schemaMessages = new schema.Entity("messages", { messages:[message] })
    
            const dataNormalizada = normalize({ id: "messages", messages }, schemaMessages)
        

 return dataNormalizada
}

//*WEBSOCKET PRODUCTOS Y MENSAJES
//'1) conexión del lado del servidor
io.on('connection', async (socket) =>{
    console.log(`io socket conectado ${socket.id}`)
        const listaMensajes = await mensajesFS.getAll();
        
        //const normalizado = normlizarChat(listaMensajes)
        //console.log("normalizado", JSON.stringify(normalizado, null, 4));
        //const desnormalizado = denormalize(normalizado.result, TodosLosMensajesSchema, normalizado.entities);
        //console.log("desnormalizado", desnormalizado);
        socket.emit("mensajes", listaMensajes)
        socket.emit("productos", await arrayProductos.getAll())
        socket.emit("prod-test", crearProductosRandom())

                //' 3) escuchar un cliente (un objeto de producto)
                socket.on('new_prod', async (data) =>{
                    await arrayProductos.save(data)
                    const listaActualizada = await arrayProductos.getAll();
                    //' 4) y propagarlo a todos los clientes: enviar mensaje a todos los usuarios conectados: todos pueden ver la tabla actualizada en tiempo real
                    io.sockets.emit('productos', listaActualizada)
                })                
                socket.on('new_msg', async (data)=>{
                    await mensajesFS.save(data);
                    const listaMensajes = await mensajesFS.getAll();
                    io.sockets.emit('mensajes', listaMensajes)            
                })          
})

        httpServer.listen(8080, ()=>{
            console.log('servidor de express iniciado')
        
        })