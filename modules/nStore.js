var dbPath = 'data/cdr.db',
        cdrs,
        dbPathTmp = 'data/tmp.db',
        cdrsTmp,
        startedRotation = false,
        tmpStorageLogs = [],
        counterUpdates = 0,
        UPDATE_FOR_ROTATION = 99,
        fs = require('fs'),
        connection,
        nStore = require('nstore'),
        bus = require('../lib/system/bus'),
        scriptList = [];

nStore = nStore.extend(require('nstore/query')());

function connect() {
    cdrs = nStore.new(dbPath, function () {
        bus.emit('message', {type: 'info', msg: "nStore CDR DB connected"});
        /*
         cdrs.filterFn = function(doc, meta) {
         return doc.lastAccess > Date.now() - 360000;
         };
         */
    });
}

function connectCdrTmp() {
    cdrsTmp = nStore.new(dbPathTmp, function () {
        bus.emit('message', {type: 'info', msg: "nStore TMP DB connected"});
    });
}

function sortHashTableByKey(hash, key_order, desc)
{

    function IsNumeric(num) {
        return (num >= 0 || num < 0);
    }
    ;

    var tmp = [],
            end = [],
            f_order = null;
    desc = (desc.toUpperCase() == 'DESC') || false;
    for (var key in hash)
    {
        if (hash.hasOwnProperty(key))
        {
            tmp.push(hash[key][key_order] + "\t" + key);
        }
    }
    //console.log(tmp);

    if (hash && hash[0] && IsNumeric(hash[0][key_order].split(/\t/)[0]))
    {
        f_order = function (a, b) {
            a = a.split(/\t/)[0];
            b = b.split(/\t/)[0];
            if (desc)
                return b - a;
            return a - b;
        };
    }
    else
    {
        tmp.sort(f_order);
        if (desc)
            tmp.reverse();
    }
    for (var i = 0, l = tmp.length; i < l; i++)
    {
        var key = tmp[i].split(/\t/)[1];
        end.push(hash[key]);
    }
    return end;
}


// Удаление устаревших медиаданных
function deleteOldRecords(mediaFiles) {
    function deleteMediaFile(path) {
        try {
            // Проверка на наличие файла
            fs.exists(path, function(exists) {
                //console.log('exists: ', exists);
                if (exists) {
                    // Удаление файла
                    fs.unlink(path, function (err) {
                        if (err) {
                            bus.emit('message', {category: 'call', type: 'error', msg: "Error deleting file: " + err});
                            console.log("Error deleting file:", err);
                            return;
                        }
                        //console.log('Success delete media file: ', path);
                    });
                }
            });
        } catch (err) {
            if (err) {
                bus.emit('message', {category: 'call', type: 'error', msg: "Error deleting file: " + err});
                console.log("Error deleting file: ", err);
                return;
            }
        }

    }

    // Удаление устаревших медиа данных
    for (var i = 0, l = mediaFiles.length; i < l; i++) {
        var dir = __dirname + '/../rec/' + mediaFiles[i];
        deleteMediaFile(dir + '.wav');
        deleteMediaFile(dir + '.wav.in');
        deleteMediaFile(dir + '.wav.out');
    }
}

// Сохранить во временное хранилище одним объектом
function saveDataAsTmp(data, cb) {
    cdrsTmp.save(null, data, function (err, key) {
        if (err) {
            bus.emit('message', {category: 'rotation', type: 'error', msg: "Error saving data: " + err});
            console.log("Error saving data: ", err, key);
            startedRotation = false;
            return;
        }
        if (cb) { cb(); }
    });
}

// Закрыть основную коллекцию
function closeCdr(cb) {
    fs.close(cdrs.fd, function (err) {
        if (err) {
            bus.emit('message', {category: 'call', type: 'error', msg: "Error close file: " + err});
            console.log("Error close file:", err);
            startedRotation = false;
            return;
        }
        if (cb) { cb(); }
    });
}

// Удалить основную коллекцию
function deleteCdr(cb) {
    fs.unlink(dbPath, function (err) {
        if (err) {
            bus.emit('message', {category: 'call', type: 'error', msg: "Error deleting file: " + err});
            console.log("Error deleting file: ", err);
            startedRotation = false;
            return;
        }
        if (cb) { cb(); }
    });
}

// Соединиться с основной коллекцией
function connectCdr(cb) {
    cdrs = nStore.new(dbPath, function (err) {
        if (err) {
            bus.emit('message', {category: 'rotation', type: 'error', msg: "Error connecting Cdr: " + err});
            console.log("Error connecting Cdr: ", err);
            startedRotation = false;
            return;
        }
        bus.emit('message', {type: 'info', msg: "nStore CDR DB connected"});
        if (cb) cb();
    });
}

// Получить коллекцию из временного хранилища
function getAllTmpData(cb) {
    cdrsTmp.all(function (err, data) {
        if (err) {
            bus.emit('message', {category: 'rotation', type: 'error', msg: "Error get data: " + err});
            console.log("Error get data:", err);
            startedRotation = false;
            return;
        }
        if (cb) cb(data);
    });
}

// Сохранить в основное хранилище из временного
function saveDataCdr(data, cb) {
    var counter = 0;
    for (var key in data) {
        for (var key2 in data[key]) {
            counter++;
        }
    }

    for (var key in data) {
        for (var key2 in data[key]) {
            cdrs.save(key2, data[key][key2], function (err, key2) {
                counter--;
                if (err) {
                    bus.emit('message', {category: 'rotation', type: 'error', msg: "Error saving data: " + err});
                    console.log("Error saving data: ", err, key2);
                    if (counter === 0) startedRotation = false;
                    return;
                }
                if (counter === 0) cb(key2);
            });
        }
    }
}

// Закрыть временную коллекцию
function closeTmpDb(cb) {
    fs.close(cdrsTmp.fd, function (err) {
        if (err) {
            bus.emit('message', {category: 'call', type: 'error', msg: "Error close Tmp DB: " + err});
            console.log("Error close Tmp DB: ", err);
            startedRotation = false;
            return;
        }
        if (cb) cb();
    });
}

// Удалить временную коллекцию
function deleteTmpDb(cb) {
    fs.unlink(dbPathTmp, function (err) {
        if (err) {
            bus.emit('message', {category: 'call', type: 'error', msg: "Error deleting file: " + err});
            console.log("Error deleting file: ", err);
            startedRotation = false;
            return;
        }
        if (cb) cb();
    });
}

// Соединиться с временной коллекцией
function connectTmpDb(cb) {
    cdrsTmp = nStore.new(dbPathTmp, function (err) {
        startedRotation = false;
        if (err) {
            bus.emit('message', {category: 'rotation', type: 'error', msg: "Error connecting Tmp Db: " + err});
            console.log("Error connecting Tmp Db: ", err);
            return;
        }
        bus.emit('message', {type: 'info', msg: "nStore Tmp db connected"});
        if (cb) cb();
    });
}

// Сохранить в основное хранилище из временного
function saveTmpDataCdr(cb) {
    var counter = tmpStorageLogs.length;

    if (counter) {
        for (var i = 0, l = tmpStorageLogs.length; i < l; i++) {
            var rec = tmpStorageLogs[i];

            cdrs.save(null, rec, function (err, key) {
                counter--;
                if (err) {
                    bus.emit('message', {category: 'call', sessionID: data.sessionID, type: 'error', msg: "Error saving data: " + err});
                    if (counter === 0) startedRotation = false;
                    return;
                }
                if (counter === 0) {
                    tmpStorageLogs = [];
                    if (cb) cb();
                }
            });
        }
    } else {
        if (cb) cb();
    }
}

// Ротация данных
function rotationRecords() {
    startedRotation = true;
    // Время жизни записи получить из config
    var daysLife = bus.config.get("dataStorageDays");

    if (daysLife > 0) {
        var expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() - daysLife);
        expiresDate = require('dateformat')(expiresDate, 'yyyy.mm.dd');
        //console.log('expiresDate: ', expiresDate);

        // Поиск актуальных данных
        function getActualData(cb) {
            cdrs.find({"gdate >=": expiresDate}, function (err, data) {
                if (err) {
                    bus.emit('message', {category: 'rotation', type: 'error', msg: "Error find data: " + err});
                    console.log("Error find data: ", err);
                    startedRotation = false;
                    return;
                }
                if (cb) { cb(data); }
            });
        }

        // Удаление старых медиаданных
        cdrs.find({"gdate <": expiresDate}, function (err, data) {
            if (err) {
                bus.emit('message', {category: 'rotation', type: 'error', msg: "Error find data:" + err});
                console.log("Error find data: ", err);
                return;
            }

            var mediaFiles = [];
            for (var key in data) {
                //console.log('key:  ', key, ' gdate: ', data[key].gdate);
                mediaFiles.push(data[key].session_id);
            }
            deleteOldRecords(mediaFiles);

            // Поиск актуальных данных
            getActualData(
                function(data) {
                    // Сохранить во временное хранилище одним объектом
                    saveDataAsTmp(
                        data,
                        function() {
                            // Закрыть основную коллекцию
                            closeCdr(
                                function() {
                                    // Удалить основную коллекцию
                                    deleteCdr(
                                        function() {
                                            // Соединиться с основной коллекцией
                                            connectCdr(
                                                function() {
                                                    // Получить коллекцию из временного хранилища
                                                    getAllTmpData(
                                                        function(data) {
                                                            // Сохранить в основное хранилище из временного
                                                            saveDataCdr(
                                                                data,
                                                                function(data) {
                                                                    // Закрыть временную коллекцию
                                                                    closeTmpDb(
                                                                        function() {
                                                                            // Удалить временную коллекцию
                                                                            deleteTmpDb(
                                                                                function () {
                                                                                    // Соединиться с временной коллекцией
                                                                                    connectTmpDb(
                                                                                        function() {
                                                                                            // Сохранить данные в основную коллекцию из временного хранилища
                                                                                            saveTmpDataCdr(
                                                                                                function() {
                                                                                                }
                                                                                            );
                                                                                        }
                                                                                    );
                                                                                }
                                                                            );
                                                                        }
                                                                    )
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    } else {
        startedRotation = false;
    }
}

bus.on('cdr', function (data) {
    var dtmfString = '';
    var i = 0,
            len = data.dtmfData ? data.dtmfData.length : 1;

    var date = data.dtmfData ? new Date(data.times.ringing) : new Date(data.times.end);
    if (data.dtmfData && data.dtmfData[0] && data.dtmfData[0].keys) {
        dtmfString = String((data.dtmfData[0] && data.dtmfData[0].name ? data.dtmfData[0].name + ': ' : '') + data.dtmfData[0].keys).replace(';', '');
        //console.log(dtmfString);
        while (++i < len)
        {
            dtmfString += ';' + String((data.dtmfData[i] && data.dtmfData[i].name ? data.dtmfData[i].name + ': ' : '') + data.dtmfData[i].keys).replace(';', '');
        }
    }

    var rec = {
        gdate: require('dateformat')(date, 'yyyy.mm.dd HH:MM:ss'),
        step: i,
        session_id: data.sessionID,
        parent_id: data.parentID,
        msisdn: (data.type == 'outgoing') ? data.to : data.from,
        service_contact: (data.type == 'outgoing') ? data.from : data.to,
        script: data.script != undefined ? data.script : '',
        //     data: data.dtmfData ? data.dtmfData[i].keys : '',
        data: dtmfString,
        status: data.status ? data.status : '',
        reason: data.statusReason ? data.statusReason : '',
        duration: data.duration,
        type: data.type,
        pin: data.pin,
        log: data.log.join('\n')
    };

    if (data.refer)
        rec.refer = data.refer;

    if (startedRotation) {
        tmpStorageLogs.push(rec);
    } else {
        cdrs.save(null, rec, function (err, key) {
            if (err) {
                bus.emit('message', {category: 'call', sessionID: data.sessionID, type: 'error', msg: "Error saving data: " + err});
                console.log("Error saving data: ", err, key);
                return;
            }

            // Увеличиваем счетчик количества обновлений хранилища
            counterUpdates++;

            // Запуск процедуры ротации данных на каждые n обновлений хранилища
            if ( (counterUpdates > UPDATE_FOR_ROTATION) && (!startedRotation) ) {
                counterUpdates = 0;
                rotationRecords();
            }
        });
    }
})

bus.onRequest('reportData', function (param, cb) {
    param.query = param.query || {};
    var search = param.query.search && JSON.parse(param.query.search);
    //console.log(param.query);
    //console.log(search);
    //console.log(new Date(search.gdate))
    var start = param.query.start * 1 || 0;
    var limit = param.query.page * param.query.limit * 1 || 50;
    //console.log(start, limit);

    //CONDITION
    var gdateS = require('dateformat')(new Date(), "yyyy.mm.dd") + ' 00:00';
    var gdateE = require('dateformat')((function () {
        var d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    })(), "yyyy.mm.dd") + ' 00:00';
    if (search && search.gdate)
    {
        var gdates = search.gdate.split('|');
        if (gdates[1]) {
            gdateS = gdates[0];
            gdateE = gdates[1];
        }
    }
    ;
    cdrs.find(function (doc, key) {
        if (doc.data && typeof doc.data === "string")
            doc.data = doc.data.replace(/\;/g, '<br>');
        var flag = (doc.gdate >= gdateS && doc.gdate <= gdateE);
        if (!flag)
            return flag;
        if (search)
            for (var k in search)
                if (k != 'gdate')
                    flag = (flag && ((doc[k] + '').search(search[k]) != -1));
        return flag;
        //CONDITION
    }, function (err, results) {
        if (err) {
            console.log('nStore query Error:', err);
            return;
        }
        //console.timeEnd('find');
        //console.time('sort');
        //TOTAL
        var total = 0;
        if (results)
            total = Object.keys(results).length;
        if (param.query.exportToExcel)
        {
            start = 0;
            limit = total;
        }
        //TOTAL

        var data = {total: total, items: []};

        //SORT
        if (param.query.sort) {
            var sort = JSON.parse(param.query.sort);
            if (sort && sort[0] && sort[0].property)
                results = sortHashTableByKey(results, sort[0].property, sort[0].direction);
        }
        //console.timeEnd('sort');
        //console.time('page');
        //SORT
        ;

        //PAGE
        var i = 0;
        for (var id in results) {
            if (i >= limit)
                break;
            if (i >= start) {
                var rec_file = 'rec/' + (results[id] && results[id].session_id) + '.wav';
                if (results[id] && require('fs').existsSync(rec_file))
                    results[id].record = rec_file;
                data.items.push(results[id]);
            }
            ;
            i++;
        }

        cb(null, data);
        //console.timeEnd('page');
        //PAGE
    });
})

connect();
connectCdrTmp();
