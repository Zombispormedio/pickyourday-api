var errors = {

    not_fields: {
        code: "001",
        message: "Campos no rellenados"
    },

    mongo_save: {
        code: "002",
        message: "Error guardando"
    },

    mongo_find: {
        code: "003",
        message: "Error buscando"
    },
	
	mongo_update:{
		 code: "004",
        message: "Error actualizando"
	},

    no_users: {
        code: "005",
        message: "Usuario no existe"

    },

    no_authenticate: {
        code: "006",
        message: "Contraseña no valida"
    },

    no_data: {
        code: "007",
        message: "No hay Datos"
    },

    no_authorization: {
        code: "008",
        message: "No tienes autorización"
    },

    refresh: {
        code: "009",
        message: "Error refrescando"
    },

    mongo_count: {
        code: "010",
        message: "Error realizando el recuento"
    },

    writing_file: {
        code: "011",
        message: "Error escribiendo fichero"
    },

    drive_insert: {
        code: "012",
        message: "Error insertando en Google Drive"
    },

    no_role: {
        code: "013",
        message: "Rol no existe"
    },

    mongo_remove: {
        code: "014",
        message: "Error eliminando"
    },

    forgot_social: {
        code: "015",
        message: "Registrado con terceros"
    }







}







module.exports = function () {

    return Object.keys(errors).reduce(function (prev, key) {


        prev[key] = function (place, data) {
            var obj = errors[key];

            obj.place = [];

            if (place)
                obj.place.push(place);

            if (data)
                obj.data = data;

            return obj;

        }

        return prev;

    }, {});


}