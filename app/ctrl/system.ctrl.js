
var C = require("../../config/config");
var CategoryCtrl = require(C.ctrl + "category.ctrl");
var PrePickCtrl = require(C.ctrl + "prePick.ctrl");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var PromotionCtrl = require(C.ctrl + "promotion.ctrl");
var PreferencesCtrl = require(C.ctrl + "preferences.ctrl");
var SystemModel = require(C.models + "system");
var Utils = require(C.lib + "utils");
var async = require("async");
var path = require("path");
var fs = require("fs");
var Controller = {};

//***************CATEGORIES
Controller.searchCategory = function (params, cb) {
    CategoryCtrl.search(params, cb);
}

Controller.newCategory = function (params, cb) {
    CategoryCtrl.new(params, cb);
}

Controller.modifyCategory = function (id, params, cb) {
    CategoryCtrl.modify(id, params, cb);
}

Controller.deleteCategory = function (id, cb) {
    CategoryCtrl.delete(id, cb);
}

Controller.getCategoryById = function (id, cb) {
    CategoryCtrl.findById(id, cb);
}

//******************PREPICKS
Controller.calculatePrePicks = function (params, cb) {
    PrePickCtrl.calculatePrePicks(params, cb);
}

Controller.searchPrePick = function (params, cb) {
    PrePickCtrl.search(0, params, cb);
}

Controller.searchPick = function (params, cb) {
    PickCtrl.search(params, cb);
}

Controller.getPickById = function (id, cb) {
    PickCtrl.findById(id, cb);
}

Controller.deletePick = function (id, cb) {
    PickCtrl.delete(id, cb);
}


//******************SERVICES
Controller.searchService = function (params, cb) {
    ServiceCtrl.search(0, params, cb);
}

Controller.searchServiceName = function (params, cb) {
    ServiceCtrl.searchServiceName(params, cb);
}

Controller.newServiceName = function (params, cb) {
    ServiceCtrl.newServiceName(params, cb);
}

Controller.modifyServiceName = function (id, params, cb) {
    ServiceCtrl.modifyServiceName(id, params, cb);
}

Controller.deleteServiceName = function (id, cb) {
    ServiceCtrl.deleteServiceName(id, cb);
}

Controller.getServiceNameById = function (id, cb) {
    ServiceCtrl.findServiceNameById(id, cb);
}



//****************Preferences


Controller.getPreferences = function (params, cb) {
    PreferencesCtrl.search(params, cb);
}

Controller.newPreference = function (params, cb) {
    PreferencesCtrl.new(params, cb);
}

Controller.getPreferenceById = function (id, params, cb) {
    PreferencesCtrl.modify(id, params, cb);
}

Controller.deletePreference = function (id, cb) {
    PreferencesCtrl.delete(id, cb);
}

Controller.gmodifyPreference = function (id, cb) {
    PreferencesCtrl.findById(id, cb);
}




//*******************Images

Controller.uploadImage = function (type, image, cb) {
    var img = {};
    img.filename = Utils.generateID();



    async.waterfall([function download(next) {

        switch (type) {
            case "url": {
                img.ext = path.extname(image.url);
                img.filename += img.ext;

                Utils.download(image.url, img.filename, function (mimeType) {
                    img.mimeType = mimeType;
                    next(null, img);
                });
                break;
            }

            case "data": {
                img.ext = path.extname(image.filename);
                img.filename += img.ext;

                var buffer = new Buffer(image.base64, 'base64');
                fs.writeFile(img.filename, buffer, function (err) {
                    if (err) return next(err);
                    img.mimeType = image.filetype;
                    next(null, img);
                });
                break;
            }

            default: next("No data");

        }
    }, function getCDNclient(img, next) {
        SystemModel.getDriveClient(function (err, client) {
            if (err) return next(err);
            next(null, img, client);
        });
    },

        function upload(img, client, next) {

            client.drive.files.insert({
                resource: {
                    title: img.filename,
                    mimeType: img.mimeType,
                    parents: [
                        {
                            "kind": "drive#fileLink",
                            "id": "0B-TPTaV5ouD7TUtDXzVxQmhYa1E"
                        }
                    ]
                },
                media: {
                    mimeType: img.mimeType,
                    body: fs.createReadStream(img.filename)
                }
            }, function (err) {
                if(err)return next(err);
                var url=client.hostname+img.filename;
                 fs.unlink(img.filename, function(err){
                     console.log(err);
                 });
                next(null, url);
            });


        }], function (err, result) {
            if(err)return cb(err);
            cb(null, {src:result});
        });

}







module.exports = Controller;
