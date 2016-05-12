var errors = {

    not_fields: {
        code: "001",
        message: "Campos no rellenados"
    },

    mongo_save: {
        code: "002",
        message: "Error de Guardado"
    },
    
    mongo_find: {
        code: "003",
        message: "Error de Buscando"
    },
    
    no_users:{
        code:"005",
        message:"Usuario no existe"
        
    }

    
    



}







module.exports = function () {

    return Object.keys(errors).reduce(function (prev, key) {


        prev[key] = function (place, data) {
            var obj = errors[key];
            if (place)
                obj.place = place;
            if (data)
                obj.data = data;

            return obj;

        }

        return prev;

    }, {});


}