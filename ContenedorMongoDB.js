const  {mongoose}  = require("mongoose");
const  {connect}  = require("mongoose");

mongoose.set('strictQuery', false)

class ContenedorMongoDB{
    constructor( rutaConnect, modelo, baseDeDatos, coleccion ){
        this.rutaConnect = rutaConnect;
        this.modelo = modelo;
        this.baseDeDatos = baseDeDatos;
        this.coleccion = coleccion;
    }

    async connectMG() {
        try {
          await connect(this.rutaConnect, { useNewUrlParser: true });
        } catch (e) {
          console.log(e);
          throw 'cannot connect to the db';
        }
      }


    async listarTodos(){
        const todos = await this.modelo.find({})
        return todos
    }



    async guardar(objeto){
        const nuevoObjeto = new this.modelo({
            email: objeto.email,
            nombre: objeto.nombre,
            apellido: objeto.apellido,
            edad: objeto.edad,
            alias: objeto.alias,
            avatar: objeto.avatar,
            text: objeto.text
        });
        const objGuardado = await nuevoObjeto.save();
    }

    async borrarTodo(){ 
      const todos = await this.modelo.deleteMany({})
    }

}

module.exports = ContenedorMongoDB