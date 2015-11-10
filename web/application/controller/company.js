/*
 * company module
 */

/**
 * This method read records
 *
 * @param req
 * @param res
 */

var Events;
var lang;
exports.init = function(events) {
    Events = events;
    Events.getData({source: 'lang'}, function(obj) {
        lang = obj.data || {};
    });

};

function getTreeNode(data, id) {
    var nodes = [];
    if (id == 'root')
        //if (Array.isArray(data)) //script list	
        data.forEach(function(key) {
            nodes.push({
                key: key.replace('.js', ''),
                //"iconCls":"icon_menu_cdr",
                id: key,
                //"leaf":true,
                enabled: true
            });
        });
    else {
//if (typeof data === 'object') //script source
        var curNode = data;

        var ids = id.split(":");
        ids.shift();
        ids.forEach(function(key) {
            if (curNode[key])
                curNode = curNode[key];
        });
        for (var key in curNode)
        {
            var node = {
                id: encodeURIComponent(id + ':' + key),
                key: key,
                leaf: false,
                iconCls: "folder-value"
            };
            if (typeof curNode[key] !== 'object') {
                node.value = curNode[key];
                node.leaf = true;
                node.iconCls = "param-value";
            }
            ;
            nodes.push(node);
        }
    }
    return nodes;
}
;

exports.read = function(req, res) {
    var params = req.body;
    var id = req.params['id'];

    var request = {};
    var ids = id.split(":");
    request = {source: 'companyData', id: ids[0]};

    Events.getData(request, function(obj) {
        res.send({success: true, data: getTreeNode(obj.data, id)});
    });
};

var fs = require('fs');
exports.create = function(req, res) {
    if (!req.body['name']) {
        res.end(JSON.stringify({success: false}));
        return;
    }
    var path = './companies/' + req.body['name'] + '.js';
    if (fs.existsSync(path)) {
        res.end(JSON.stringify({success: false, message: lang.fileExist}));
        return;
    }
    ;
    //console.log(path);
    fs.writeFile(path, "exports.src = " + JSON.stringify({}), function(err) {
        var result = {success: !err};
        if (err)
            result.message = lang[err.code] ? lang[err.code] : err.code;
        res.end(JSON.stringify(result));
    });
};

exports.rename = function(req, res) {
    //consol.log(req.params['id']);
    var oldPath = './companies/' + req.body['oldPath'] + '.js';
    var newPath = './companies/' + req.body['newPath'] + '.js';
    //console.log(oldPath, newPath);

    if (!newPath || !oldPath) {
        res.end(JSON.stringify({success: false}));
        return;
    }

    if (fs.existsSync(newPath)) {
        res.end(JSON.stringify({success: false, message: lang.pathExist}));
        return;
    }

    fs.rename(oldPath, newPath, function(err) {
        var result = {success: !err};
        if (err)
            result.message = lang[err.code] ? lang[err.code] : err.code;
        res.end(JSON.stringify(result));
    });
};
exports.delete = function(req, res) {
    var path = '.' + req.body['path'];

    //console.log(path);

    if (!fs.existsSync(path)) {
        res.end(JSON.stringify({success: false, message: lang.pathNotExist}));
        return;
    }
    if (fs.statSync(path).isDirectory())
        fs.rmdir(path, function(err) {
            var result = {success: !err};
            if (err)
                result.message = lang[err.code] ? lang[err.code] : err.code;
            res.end(JSON.stringify(result));
        });
    else
        fs.unlink(path, function(err) {
            var result = {success: !err};
            if (err)
                result.message = lang[err.code] ? lang[err.code] : err.code;
            res.end(JSON.stringify(result));
        });
};