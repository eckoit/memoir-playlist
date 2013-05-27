// http://stackoverflow.com/questions/11268756/ffmpeg-start-and-duration-in-fps
// https://ffmpeg.org/trac/ffmpeg/wiki/How%20to%20concatenate%20(join%2C%20merge)%20media%20files#samecodec
// https://github.com/maxogden/stenographer/blob/master/index.js

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('couchr'));
    } else if (typeof define === 'function' && define.amd) {
        define(['couchr'],factory);
    } else {
        root.memoir_playlist = factory(root.couchr);
    }
}(this, function (couchr) {

    // SOME PREDEFINED THINGS
    var default_config = {
        ddoc: '/_design/memoir',
        view: '/_view/audio_by_time',
        shoulder_time_ms: 60 * 1000 * 15  // 15 minutes
    };



 function query(couchdb, start, end, /*optional*/ config,  callback) {
    if (!callback) {
        config = default_config;
        callback = config;
    } else {
        config.ddoc = config.ddoc || default_config.ddoc;
        config.view = config.view || default_config.view;
        config.shoulder_time_ms = config.shoulder_time_ms || default_config.shoulder_time_ms;
    }

    var startts = start,
        endts = end;

    // support people sending Date objects
    if (start instanceof Date) {
        startts = start.getTime();
    }
    if (end instanceof Date) {
        endts = end.getTime();
    }

    // adjust query based on shoulder_time_ms
    var q = {
        startkey: startts - config.shoulder_time_ms,
        endkey: endts + config.shoulder_time_ms,
        include_docs: false
    };
    var url = [couchdb, config.ddoc, config.view].join('');

    couchr.get(url, q, function(err, resp) {
        if (err) return callback(err);
        process(resp.rows, startts, endts, callback);
    });
 }

 function process(rows, startts, endts, callback) {
    var results = [];
    rows.forEach(function(row){
        // filter
        if (row.value.end < startts ) return; // discard, came from shoulder_time_ms
        if (row.value.start > endts) return;  // discard, came from shoulder_time_ms
        results.push(transform(row, startts, endts));
    });
    callback(null, results);
 }

 function transform(row, startts, endts) {
    var r = row.value;
    r.audio_start_ms = 0;
    r.audio_end_ms = r.end - r.start;

    if (r.start < startts) r.audio_start_ms =  startts - r.start;
    if (r.end > endts) r.audio_end_ms = r.end - endts;

    r.path = r._id + '/' + Object.keys(r.file)[0];


    return r;
 }


 if (couchr.test) return {
    query: query,
    process: process,
    transform: transform,
    default_config: default_config
 };

 return query;


}));