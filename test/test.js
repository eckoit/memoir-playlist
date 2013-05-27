var assert = require("assert"),
    couchr = require('couchr'),
    requireMock = require("requiremock")(__filename);

var couchrMock = {
    test: true,
    post: function(url, data, callback) {}
};

requireMock.mock("couchr", couchrMock);

var memoir_playlist = requireMock("../index");

describe('generates a playlist', function(){

    it('should return with timestamps', function(cb){

        var start = 1359175435791,
            end = 1359178606330;

        couchrMock.get = function(url, opts, callback) {
            assert.equal(url, 'http://localhost:5984/my-path/_design/memoir/_view/audio_by_time');
            assert.equal(opts.startkey, start - memoir_playlist.default_config.shoulder_time_ms);
            assert.equal(opts.endkey, end + memoir_playlist.default_config.shoulder_time_ms);
            cb();
        };
        memoir_playlist.query('http://localhost:5984/my-path', start, end);

    });

    it('should return with Dates', function(cb){

        var start = 1359175435791,
            end = 1359178606330;

        couchrMock.get = function(url, opts, callback) {
            assert.equal(url, 'http://localhost:5984/my-path/_design/memoir/_view/audio_by_time');
            assert.equal(opts.startkey, start - memoir_playlist.default_config.shoulder_time_ms);
            assert.equal(opts.endkey, end + memoir_playlist.default_config.shoulder_time_ms);
            cb();
        };
        memoir_playlist.query('http://localhost:5984/my-path', new Date(start), new Date(end));

    });


    var example_resp = [
        {"id":"dfbec144-df81-4a8a-b3de-9e1754a66f47","key":1359174757000,"value":{"_id":"dfbec144-df81-4a8a-b3de-9e1754a66f47","type":"recording","start":1359174757000,"file":{"R_MIC_130125-213237.mp3":{"content_type":"audio/mp3","revpos":2,"digest":"md5-L795XzKWFRSqmwXI6+QCSQ==","length":4800221,"stub":true}},"end":1359175356000}},
        {"id":"142290ec-9944-464f-bd70-e0298e340238","key":1359175358000,"value":{"_id":"142290ec-9944-464f-bd70-e0298e340238","type":"recording","start":1359175358000,"file":{"R_MIC_130125-214238.mp3":{"content_type":"audio/mp3","revpos":2,"digest":"md5-WgB6ULDzQoxHsZN3/4Fl6w==","length":4800430,"stub":true}},"end":1359175957000}},
        {"id":"62c0cc2e-90e0-4723-a19c-8b86f369b31b","key":1359175958000,"value":{"_id":"62c0cc2e-90e0-4723-a19c-8b86f369b31b","type":"recording","start":1359175958000,"file":{"R_MIC_130125-215238.mp3":{"content_type":"audio/mp3","revpos":2,"digest":"md5-0J5lh+Sz8oBs6ThryPx7Fw==","length":4800639,"stub":true}},"end":1359176558000}},
        {"id":"c52214cf-4000-49bb-9c08-cf99847cc945","key":1359176559000,"value":{"_id":"c52214cf-4000-49bb-9c08-cf99847cc945","type":"recording","start":1359176559000,"file":{"R_MIC_130125-220239.mp3":{"content_type":"audio/mp3","revpos":2,"digest":"md5-jBVojit2YAtN7tjQTGQdyw==","length":3247792,"stub":true}},"end":1359176964000}}
    ];

    it('should include audio that the end is between the request start and end', function(cb) {
        memoir_playlist.process(example_resp, 1359175435791, 1359178606330,  function(err, resp){
            assert.ifError(err);
            assert.equal(3, resp.length);
            console.log(resp);
            cb();
        });
    });


    it('should include audio that exact on the request start and end', function(cb) {
        memoir_playlist.process(example_resp, 1359175358000, 1359176558000,  function(err, resp){
            assert.ifError(err);
            assert.equal(2, resp.length);
            cb();
        });
    });


    it('should include audio that around on the request start and end', function(cb) {
        memoir_playlist.process(example_resp, 1359175358001, 1359175956999,  function(err, resp){
            assert.ifError(err);
            assert.equal(1, resp.length);
            cb();
        });
    });


    it('should add the start and end times to help the player', function() {
        var start = 1359175435791;
        var end = 1359178606330;
        var start_ms = start - example_resp[1].value.start;
        var duration_ms = example_resp[1].value.end - example_resp[1].value.start;

        var r = memoir_playlist.transform(example_resp[1], 1359175435791, 1359178606330);
        assert.equal(r.audio_start_ms, start_ms);
        assert.equal(r.audio_end_ms, duration_ms);
        assert.equal(r.path, '142290ec-9944-464f-bd70-e0298e340238/R_MIC_130125-214238.mp3');
    });

    it('should add the start and end times to help the player', function() {
        var start = 1359175435791;
        var end = 1359178606330;
        var start_ms = 0;
        var duration_ms = example_resp[3].value.end - example_resp[3].value.start;

        var r = memoir_playlist.transform(example_resp[3], 1359175435791, 1359178606330);
        assert.equal(r.audio_start_ms, start_ms);
        assert.equal(r.audio_end_ms, duration_ms);
    });



});