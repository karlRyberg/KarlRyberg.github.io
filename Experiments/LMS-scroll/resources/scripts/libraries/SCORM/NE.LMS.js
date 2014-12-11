﻿/// <reference path="NE.infrastructure.js" />

var NE = NE || {};

NE.LMS = (function () {

    var _startTime = new Date().getTime();
    var _eventList = {};


    function _addEvent(eventName, listener, scope) {
        scope = scope || window;
        _eventList[eventName] = _eventList[eventName] || [];
        var eventSlot = _eventList[eventName];
        if (eventSlot) {
            eventSlot.push({
                'listener': listener,
                'scope': scope
            });
        }
    }

    function _dispatchEvent(eventName, argsArray) {

        var eventSlot = _eventList[eventName];
        if (!eventSlot) return;
        for (var i = 0; i < eventSlot.length; i++) {
            eventSlot[i].listener.apply(eventSlot[i].scope, argsArray);
        }
    }

    function _setSCOCompletion() {

        var secs = NE.LMS.Sections.GetSections();
        var completion_status = 'incomplete';

        var objectiveTotal = secs.length;
        var objectiveMessure = 0;

        for (var i = 0; i < secs.length; i++) {

            if (NE.LMS.Sections.GetState(secs[i].ID) === 'completed') {
                objectiveMessure += 1;
            }
        }

        var result = objectiveMessure == objectiveTotal ? 'completed' : 'incomplete';
        NE.Infrastructure.SetValue('cmi.completion_status', result);

        var prog_messure = parseFloat((objectiveMessure / objectiveTotal).toFixed(1));
        prog_messure = isNaN(prog_messure) ? 0 : prog_messure;

        NE.Infrastructure.SetValue('cmi.progress_measure', prog_messure);

        _dispatchEvent(NE.LMS.ON_PROGRESS_MESSURE_CHANGED, [{ 'progress': prog_messure }]);
        _dispatchEvent(NE.LMS.ON_COMPLETION_STATUS_CHANGED, [{ 'status': result }]);

    }


    function _setSCOScores() {
        var r = isNaN(NE.LMS.ScoScore.Result) ? 0 : NE.LMS.ScoScore.Result;
        var m = isNaN(NE.LMS.ScoScore.Max) ? 0 : NE.LMS.ScoScore.Max;

        var scaled = m == 0 ? 0 : parseFloat((r / m).toFixed(1));
        NE.Infrastructure.SetValue('cmi.score.scaled', scaled);
    }

    function _setSCOSuccess() {
        var successStatus = "failed";

        if (NE.LMS.ScoScore.Max > 0 && NE.LMS.ScoScore.Result >= NE.LMS.ScoScore.Min) {
            successStatus = "passed";
        }
        else if (NE.LMS.ScoScore.Max <= 0 && NE.Infrastructure.GetValue('cmi.completion_status') === 'completed') {
            successStatus = "passed";
        }

        NE.Infrastructure.SetValue("cmi.success_status", successStatus);
        _dispatchEvent(NE.LMS.ON_SUCCESS_STATUS_CHANGED, [{ 'status': successStatus }]);
    }


    function _exitLMS() {
        NE.LMS.UpdateSCOCompletion();
        NE.Infrastructure.SetValue('cmi.session_time', NE.LMS.GetSessionTime());
        NE.Infrastructure.Commit();
        NE.Infrastructure.Terminate();
    }

    (function () {

        try {
            NE.Infrastructure.Initialize();
        }
        catch (ex) {
            throw ex;
        }

        if (window.addEventListener) { // W3C DOM
               window.addEventListener('unload', _exitLMS, false);
        }
        else if (window.attachEvent) { // IE DOM
               window.attachEvent('onunload', _exitLMS);
        }

    })();

    return {

        ON_COMPLETION_STATUS_CHANGED: 'NE.LMS.CompletionStatusChanged',
        ON_SUCCESS_STATUS_CHANGED: 'NE.LMS.SuccessStatusChanged',
        ON_PROGRESS_MESSURE_CHANGED: 'NE.LMS.ProgressMessureChanged',

        GetSessionTime: function () {
            var endTime = new Date().getTime();
            var totalSeconds = Math.round((endTime - _startTime) / 1000);
            return 'PT' + totalSeconds + 'S';
        },

        GetTimeStamp: function () {

            dateObj = new Date();

            var dateString = ''
            + dateObj.getFullYear()
            + '-'
            + ('0' + (dateObj.getMonth() + 1)).slice(-2)
            + '-'
            + ('0' + dateObj.getDate()).slice(-2)
            + 'T'
            + ('0' + dateObj.getHours()).slice(-2)
            + ':'
            + ('0' + dateObj.getMinutes()).slice(-2)
            + ':'
            + ('0' + dateObj.getSeconds()).slice(-2);


            return dateString;

        },

        ScoScore: {
            Min: 0,
            Max: 0,
            Result: 0
        },

        UpdateSCOCompletion: function () {
            _setSCOCompletion();
            _setSCOScores();
            _setSCOSuccess();
            NE.LMS.Objectives.Register();
        },

        AddEvent: function (eventName, listener, scope) {
            _addEvent(eventName, listener, scope);
        },

        DispatchEvent: function (eventName, argsArray) {
            _dispatchEvent(eventName, argsArray);
        },

        Exit: function () {
            _exitLMS();
        }

    };

})();

NE.LMS.Bookmark = (function () {

    var _bookmark;

    return {

        GetBookmark: function () {
            return NE.Infrastructure.GetValue('cmi.location');;
        },

        SetBookmark: function (id) {
            NE.Infrastructure.SetValue('cmi.location', id);
            _bookmark = id;
        }

    };

})();


NE.LMS.Navigation = (function () {

    return {

        Exit: function () {
            NE.Infrastructure.SetValue("adl.nav.request", "exitAll");
            return NE.LMS.Exit();
        },

        SCO: function (id) {
            NE.Infrastructure.SetValue("adl.nav.request", "{target=" + id + "}choice");
            return NE.LMS.Exit();
        }

    };

})();


NE.LMS.QuizData = function (id, description_opt, correctResponses_opt, learnerResponse_opt, weighting_opt) {

    if (!id) {
        throw Error('NE.LMS.QuizData: \'id\' is not valid');
    }

    var _description = description_opt || '';
    var _correctResponses = correctResponses_opt || [];
    var _learnerResponse = learnerResponse_opt || '';
    var _weighting = weighting_opt || '';

    return {
        ID: id,
        Description: _description,
        CorrectResponses: _correctResponses,
        LearnerResponse: _learnerResponse,
        Weighting: _weighting
    }
}

NE.LMS.Interactions = (function () {


    var _reportedIDs = {};

    function _calcResult(respons, correctResponses) {
        for (var i = 0; i < correctResponses.length; i++) {
            if (correctResponses[i].toString().toLowerCase() === respons.toString().toLowerCase()) {
                return 'correct';
            }
        }
        return 'incorrect';
    }

    return {

        ReportQuiz: function (sectionID, QuizDataList) {

            var sec = NE.LMS.Sections.GetSectionByID(sectionID);
            if (!sec) { throw Error('NE.LMS.Section \'' + id.toString() + '\' is null or undefined') }

            NE.LMS.ScoScore.Result -= sec.LearnerScore || 0;
            sec.LearnerScore = 0;

            for (var i = 0; i < QuizDataList.length; i++) {

                var currentQuizData = QuizDataList[i];

                var n = typeof _reportedIDs[currentQuizData.ID] !== 'undefined' ? _reportedIDs[currentQuizData.ID] : i;

                var interAction = 'cmi.interactions.' + n;
                NE.Infrastructure.SetValue(interAction + '.id', currentQuizData.ID);
                NE.Infrastructure.SetValue(interAction + '.type', 'multiple_choice');
                NE.Infrastructure.SetValue(interAction + '.timestamp', NE.LMS.GetTimeStamp());

                if (typeof currentQuizData.CorrectResponses == "string") {
                    currentQuizData.CorrectResponses = [currentQuizData.CorrectResponses];
                }

                for (var j = 0; j < currentQuizData.CorrectResponses.length; j++) {
                    NE.Infrastructure.SetValue(interAction + '.correct_responses.' + j + '.pattern', currentQuizData.CorrectResponses[j]);
                }

                if (Object.prototype.toString.call(currentQuizData.LearnerResponse) == '[object Array]') {
                    currentQuizData.LearnerResponse = currentQuizData.LearnerResponse.join('[,]');
                }

                var learnerResult = _calcResult(currentQuizData.LearnerResponse, currentQuizData.CorrectResponses);

                NE.Infrastructure.SetValue(interAction + '.learner_response', currentQuizData.LearnerResponse);
                NE.Infrastructure.SetValue(interAction + '.result', learnerResult);
                NE.Infrastructure.SetValue(interAction + '.latency', NE.LMS.GetSessionTime());
                NE.Infrastructure.SetValue(interAction + '.description', currentQuizData.Description);


                if (learnerResult === 'correct') {
                    sec.LearnerScore += 1
                }

                _reportedIDs[currentQuizData.ID] = n;
            }

            NE.LMS.ScoScore.Result += sec.LearnerScore;
            NE.Infrastructure.SetValue('cmi.score.raw', NE.LMS.ScoScore.Result);

        },


        TrackActivity: function (id, description, content) {
            if (!id) {
                throw Error('NE.LMS.Interactions.TrackActivity: \'id\' is not valid');
            }
        }

    };

})();

NE.LMS.Score = function (min_opt, max_opt) {
    var _min = min_opt || 0;
    var _max = max_opt || 0;
    return {
        Min: _min,
        Max: _max
    }
}

NE.LMS.Objectives = (function () {


    var _objectives;

    function _getCmiObjectives() {

        var objCount = NE.Infrastructure.GetValue('cmi.objectives._count');
        _objectives = {};
        for (var i = 0; i < objCount; i++) {

            var objID = NE.Infrastructure.GetValue('cmi.objectives.' + i + '.id');
            _objectives[objID] = {
                id: objID,
                completion_status: NE.Infrastructure.GetValue('cmi.objectives.' + i + '.completion_status'),
                success_status: NE.Infrastructure.GetValue('cmi.objectives.' + i + '.success_status'),
                progress_measure: NE.Infrastructure.GetValue('cmi.objectives.' + i + '.progress_measure')
            }

        }

    }

    return {

        Get: function (id) {
            if (!_objectives) _getCmiObjectives();
            return _objectives[id];
        },

        Set: function (ObjList) {

            for (var i = 0; i < ObjList.length; i++) {
                var obj = ObjList[i];
                _objectives[obj.id] = {
                    id: obj.id,
                    completion_status: obj.completion_status || 'incomplete',
                    success_status: obj.success_status || 'failed,',
                    progress_measure: obj.progress_measure || 0
                };
            }

        },

        Register: function () {
            var counter = 0;
            for (var key in _objectives) {
                var obj = _objectives[key];
                NE.Infrastructure.SetValue('cmi.objectives.' + counter + '.id', obj.id);
                NE.Infrastructure.SetValue('cmi.objectives.' + counter + '.completion_status', obj.completion_status);
                NE.Infrastructure.SetValue('cmi.objectives.' + counter + '.success_status', obj.success_status);
                NE.Infrastructure.SetValue('cmi.objectives.' + counter + '.progress_measure', obj.progress_measure);
                counter++;
            }
        }

    }

})();

NE.LMS.Section = (function (id, state_opt, score_opt, weighting_opt) {

    if (!id) {
        throw Error('NE.LMS.Section: \'id\' is not valid');
    }

    var _state = state_opt || 'unknown';
    var _weighting = weighting_opt || 1;
    var _score = score_opt || null;

    return {
        ID: id,
        State: _state,
        Weighting: _weighting,
        Score: _score,
        LearnerScore: 0
    };

});


NE.LMS.Sections = (function () {

    var _sections = [];
    var _suspendedSections = [];

    (function () {

        var suspendData = NE.Infrastructure.GetValue('cmi.suspend_data');

        if (suspendData) {
            try {
                _suspendedSections = JSON.parse(suspendData);
                //console.log(_sections);
            }
            catch (ex) {
                console.log('Failed to parse cmi.suspend_data: ' + ex.message);
                _suspendedSections = [];
            }
        }


    })();

    return {

        ON_SECTION_STATE_CHANGED: 'NE.LMS.Sections.OnSectionStateChanged',

        RegisterSection: function (section) {
            if (!section) { throw Error('section is null or undefined') }

            for (var i = 0; i < _sections.length; i++) {
                if (_sections[i].ID == section.ID) {
                    return;
                }
            }

            if (section.Score) {
                NE.LMS.ScoScore.Min += section.Score.Min;
                NE.LMS.ScoScore.Max += section.Score.Max;
                NE.Infrastructure.SetValue('cmi.score.max', NE.LMS.ScoScore.Max);
            }

            for (var i = 0; i < _suspendedSections.length; i++) {
                if (_suspendedSections[i].ID == section.ID) {
                    _sections.push(_suspendedSections[i]);
                    return;
                }
            }

            _sections.push(section)

            NE.Infrastructure.SetValue('cmi.suspend_data', JSON.stringify(_sections));

        },

        RegisterSections: function (sectionList) {
            if (!sectionList) { throw Error('sectionList is null or undefined') }
            for (var i = 0; i < sectionList.length; i++) {
                this.RegisterSection(sectionList[i]);
            }

        },
        GetSections: function () {
            return _sections;
        },

        GetSectionByID: function (id) {
            for (var i = 0; i < _sections.length; i++) {
                var sec = _sections[i];
                if (sec.ID == id) {
                    return sec;
                }
            }
            return null;
        },

        GetState: function (id) {
            var sec = this.GetSectionByID(id);
            if (!sec) { throw Error('NE.LMS.Section \'' + id.toString() + '\' is null or undefined') }
            return sec.State;
        },

        SetState: function (id, state) {
            var sec = this.GetSectionByID(id);
            if (!sec) { throw Error('NE.LMS.Section \'' + id.toString() + '\' is null or undefined'); }
            sec.State = state.toString().toLowerCase();
            // console.log('Setting state of \'' + id + '\' to \'' + state + '\'');

            NE.LMS.UpdateSCOCompletion();

            NE.Infrastructure.SetValue('cmi.suspend_data', JSON.stringify(_sections));
            NE.LMS.DispatchEvent(this.ON_SECTION_STATE_CHANGED, [{ 'sender': sec, 'state': state }]);

        },

        AddEvent: function (eventName, listener, scope) {
            NE.LMS.AddEvent(eventName, listener, scope)
        }

    };

})();