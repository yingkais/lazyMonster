var numeral = require('numeral');
var dateFormat = require('dateformat');
var PythonShell = require('python-shell');
var fs = require('fs');
var mkdirp = require('mkdirp');
var multer = require('multer');
var path = require('path');
var qPCRQCSummary = require('../models/qPCRQCSummary');
var qPCRrawDataAggregation = require('../models/qPCRrawDataAggregation');
var qPCRretestInfoAggregation = require('../models/qPCRretestInfoAggregation');
var qPCRQCinDetail = require('../models/qPCRQCinDetail');
var mongoose = require('mongoose');
var rimraf = require('rimraf');

Date.prototype.yyyymmddhhmm = function () {
    var yyyy = this.getFullYear();
    var mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
    var dd = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
    var hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
    var min = this.getMinutes() < 10 ? "0" + this.getMinutes() : this.getMinutes();
    return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min);
};

exports.loggedIn = function (req, res, next) {
    if (req.session.user) { // req.session.passport._id
        next();
    } else {
        res.redirect('/login');
    }
}

exports.home = function (req, res) {
    res.render('home.ejs', {
        error: req.flash("error"),
        success: req.flash("success"),
        session: req.session,
    });
}

exports.signup = function (req, res) {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('signup', {
            error: req.flash("error"),
            success: req.flash("success"),
            session: req.session
        });
    }
}

exports.login = function (req, res) {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('login', {
            error: req.flash("error"),
            success: req.flash("success"),
            session: req.session
        });
    }
}

exports.upload = function (req, res) {
    var dir_name = Date.now();
    console.log(req.session.user._id);
    console.log(req.user._id);
    console.log(req.params.operation);
    mkdirp('uploads/' + dir_name, function (err) {
        var storage = multer.diskStorage({
            destination: 'uploads/' + dir_name,
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        });
        var upload = multer({
            storage: storage,
            fileFilter: function (req, file, callback) {
                var ext = path.extname(file.originalname);
                if (ext !== '.xlsx') {
                    return callback(null, false);
                }
                callback(null, true)
            }
        }).any();
        upload(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file.");
            }
            else {
                // var files = req.files;
                // for (var i = 0; i < files.length; i++) {
                //   console.log('type %s', files[i].mimetype);
                //   console.log('original name：%s', files[i].originalname);
                //   console.log('size：%s', files[i].size);
                //   console.log('save path：%s', files[i].path);
                // }
                var filepath = path.join(__dirname + "../../../uploads/" + dir_name);
                var savepath = path.join(__dirname + "../../../downloads/" + req.session.user._id);
                var d = new Date();
                var filename = d.yyyymmddhhmm();
                mkdirp('downloads/' + req.session.user._id, function (err) {
                    var options = {
                        mode: 'json',
                        pythonOptions: ['-u'], // get print results in real-time
                        scriptPath: path.join(__dirname + "../../../python"),
                        args: [filepath, req.params.operation]
                    };
                    var shell = new PythonShell('qPCR_aggregation_v2.py', options);
                    shell.on('message', function (message) {
                        if (req.params.operation == 'qPCRqc') {
                            // console.log(message);
                            for (var i = 0; i < message.length; i++) {
                                var elem = new qPCRQCSummary({
                                    UserId: req.session.user._id,
                                    PCRRunNumber: message[i].PCRRunNumber,
                                    ExtractionDate: message[i].ExtractionDate,
                                    SampleName: message[i].SampleName,
                                    WellPosition: message[i].WellPosition,
                                    CtMean: message[i].CtMean,
                                    CtSD: message[i].CtSD,
                                    QuantityMeanPer10uL: message[i].QuantityMeanPer10uL,
                                    QuantitySDPer10uL: message[i].QuantitySDPer10uL,
                                    QuantityCVPer10uL: message[i].QuantityCVPer10uL,
                                    QuantityNominalPer10uL: message[i].QuantityNominalPer10uL,
                                    PercentRE: message[i].PercentRE,
                                    QC: message[i].QC
                                });
                                elem.save();
                            }
                        } else if (req.params.operation == 'qPCRraw') {
                            // console.log(message);
                            for (var i = 0; i < message.length; i++) {
                                var elem = new qPCRrawDataAggregation({
                                    UserId: req.session.user._id,
                                    ExtractionNumber: message[i].ExtractionNumber,
                                    PCRRunNumber: message[i].PCRRunNumber,
                                    ExtractionSampleNumber: message[i].ExtractionSampleNumber,
                                    PunchNumber: message[i].PunchNumber,
                                    AnimalID: message[i].AnimalID,
                                    TissueorSampleType: message[i].TissueorSampleType,
                                    CollectionDate: message[i].CollectionDate,
                                    DNAPerrxn: message[i].DNAPerrxn,
                                    SampleName: message[i].SampleName,
                                    WellPosition: message[i].WellPosition,
                                    CtMean: message[i].CtMean,
                                    CtSD: message[i].CtSD,
                                    QuantityMean: message[i].QuantityMean,
                                    QuantitySD: message[i].QuantitySD,
                                    QtyCVPercent: message[i].QtyCVPercent,
                                    CNPerug: message[i].CNPerug,
                                    Flag: message[i].Flag,
                                    QC: message[i].QC
                                });
                                elem.save();
                            }
                        } else if (req.params.operation == 'qPCRretest') {
                            // console.log(message);
                            for (var i = 0; i < message.length; i++) {
                                var elem = new qPCRretestInfoAggregation({
                                    UserId: req.session.user._id,
                                    ExtractionNumber: message[i].ExtractionNumber,
                                    PCRRunNumber: message[i].PCRRunNumber,
                                    ExtractionSampleNumber: message[i].ExtractionSampleNumber,
                                    PunchNumber: message[i].PunchNumber,
                                    AnimalID: message[i].AnimalID,
                                    TissueorSampleType: message[i].TissueorSampleType,
                                    CollectionDate: message[i].CollectionDate,
                                    DNAPerrxn: message[i].DNAPerrxn,
                                    SampleName: message[i].SampleName,
                                    WellPosition: message[i].WellPosition,
                                    CtMean: message[i].CtMean,
                                    CtSD: message[i].CtSD,
                                    QuantityMean: message[i].QuantityMean,
                                    QuantitySD: message[i].QuantitySD,
                                    QtyCVPercent: message[i].QtyCVPercent,
                                    CNPerug: message[i].CNPerug,
                                    Flag: message[i].Flag,
                                    QC: message[i].QC
                                });
                                elem.save();
                            }
                        } else if (req.params.operation == 'qPCReachqc') {
                            // console.log(message);
                            for (var i = 0; i < message.length; i++) {
                                var elem = new qPCRQCinDetail({
                                    UserId: req.session.user._id,
                                    PCRRunNumber: message[i].PCRRunNumber,
                                    ExtractionDate: message[i].ExtractionDate,
                                    Well: message[i].Well,
                                    WellPosition: message[i].WellPosition,
                                    Omit: message[i].Omit,
                                    SampleName: message[i].SampleName,
                                    TargetName: message[i].TargetName,
                                    Task: message[i].Task,
                                    Reporter: message[i].Reporter,
                                    Quencher: message[i].Quencher,
                                    CT: message[i].CT,
                                    CtMean: message[i].CtMean,
                                    CtSD: message[i].CtSD,
                                    Quantity: message[i].Quantity,
                                    QuantityMean: message[i].QuantityMean,
                                    QuantitySD: message[i].QuantitySD
                                });
                                elem.save();
                            }
                        } else {
                            console.log(message);
                        }
                    });
                    shell.end(function (err) {
                        console.log('The script work has been finished.');
                        if (err) {
                            res.status(200).send({error: err});
                        }
                        else {
                            rimraf(filepath, function (err) {
                                if (err) throw err;
                                res.redirect('/' + req.params.operation);
                            });
                        }
                    });
                });

            }
        });
    });
}
