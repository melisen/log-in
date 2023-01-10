const {optionsSQL} = require("./options/mysql.js");
const knex = require("knex")(optionsSQL);


knex.schema
.createTable("productos", (table) =>{
    table.increments("id"), 
    table.string("title"), 
    table.integer("price"),
    table.string("thumbnail")
})
.then(()=>{
    console.log("todo bien");
})
.catch((err)=>{
    console.log(err);
    throw new Error(err);

})


knex("productos")
.insert({title: "billetera", price:8000, thumbnail:"https://www.xlshop.com.ar/arquivos/ids/201380-1000-1000/XT2SLI17B0626.jpg?v=638011776835970000Ñ"})
.then(()=>{
    console.log("logré insertar");
})
.catch((err)=>{
    console.log(err);
})
.finally(()=>{
    knex.destroy();
})
/*
knex.from("productos")
.where("id", "=", 1)
.del()
.catch((e)=>{
    console.log(e)
}).finally(()=>{
    knex.destroy()
})

*/

