/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />
/// <reference path="../../NE.Scroll.js" />

/////////////////////////////////////////////////////////////////////
//
//  TYPE: 
//  NAME: 
//  NAMESPACE: 
//  
//  SUMMARY
//      
//  
//  PUBLIC FIELDS  
//      
//
//  PUBLIC FUNCTIONS
//      
//
//  DEPENDENCIES
//      
//
//////////////////////////////////////////////////////////////////////

// Ensure that the LOUISE namespace is avaiable
if (NE === null || NE === undefined) { var NE = {}; }
if (NE.Plugin === null || NE.Plugin === undefined) { NE.Plugin = {}; }

NE.Plugin.quiz = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
    var _settings = {};
    var _myDOMContent;
    var _numComponents = 0;
    var _componentsLoaded = 0;
    var _quizdata = null;
    var _openFeedback;
    var _currentQuestion = 0;

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {



    })();

    //////////////////////
    //
    //  Private functions 
    //
    /////////////////////

    function _addToDOM(i_content) {
        _params.node.replaceWith(i_content);
        var numButtons = $('.NE-quiz-option-button').length;

        if (numButtons < 3) {
            var colWidth = 'col-sm-' + (numButtons * 4);
        //    var colOffset = 'col-sm-offset-' + numButtons;
            $('.NE-quiz-feedback-holder').addClass(colWidth);//.addClass(colOffset);
        //    $('.NE-quiz-option-button-holder').first().addClass(colOffset);
        }

    }

    function _onComplete() {
        _adjustButtons();
        $('#' + _settings.ID).on('click', '.NE-quiz-option-button', function () {
            _onButtonClick($(this));
        });
        me.OnLoaded();
    }

    function _onCompnentsLoad(e) {

        _componentsLoaded++;

        if (_componentsLoaded == _numComponents) {
            me.OnLoaded({
                chapter: _settings.chapterIndex,
                index: _settings.index,
                gui: _settings.guid,
            });
        }

    }

    function _onButtonClick(i_sender) {
        _toggleButtons(i_sender);
        _displayFeedback(i_sender);

        if (_settings.submitHandler && _quizdata.autoSubmit) {

            eval('(function(){' + _settings.submitHandler + '();})();');

        }

    }

    function _toggleButtons(i_sender) {
        if (_quizdata.questions[_currentQuestion].questionType != 'singleChoice') return;
        $('.NE-quiz-option-button', '#' + _settings.ID).removeClass('active');
        i_sender.addClass('active');
    }

    function _displayFeedback(i_sender) {

        var fbIndex = i_sender.data('fb');
        var fbArea = $('#' + _settings.ID + '-fb-' + fbIndex);

        if (_openFeedback) {
            if (_openFeedback.attr('id') == fbArea.attr('id')) return;
            fbArea.parent().css('height', fbArea.parent().outerHeight() + 'px');
            _openFeedback.fadeOut(300, function () {
                fbArea.removeClass('hidden').fadeOut(0).fadeIn(300, function () {
                    NE.Scroll.ToElementY(fbArea, 'middle');
                })
            });
        }
        else {
            fbArea.slideUp(0).removeClass('hidden').slideDown(300, function () {
                NE.Scroll.ToElementY(fbArea, 'middle');
            });
        }

        _openFeedback = fbArea;

    }

    function _padRow(i_row, i_height, i_rowCount) {

        for (var i = 0; i < i_row.length; i++) {

            var item = i_row[i];
            var diff = i_height - item.outerHeight();

            if (diff > 0) {
                diff = 15 + (diff / 2);
                item.css({
                    'padding-top': diff + 'px',
                    'padding-bottom': diff + 'px'
                });
            }

            if (i_rowCount > 0) item.parent().addClass('mt-xs');

        }
    }

    function _adjustButtons() {

        var cnt = 0;
        var highst = 0;
        var limit = 3;
        var row = [];
        var rowCount = 0;

        $('.NE-quiz-option-button').each(function (i) {

            var h = $(this).outerHeight()
            highst = h > highst ? h : highst;

            row.push($(this));

            if (cnt++ == limit - 1) {

                _padRow(row, highst, rowCount);

                rowCount++;
                highst = null;
                cnt = 0;
                row = [];

            }

        });

        _padRow(row, highst, rowCount);

    }

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    var me = {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        Name: 'quiz',
        Dependencies: [
            'quiz.css'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            _settings = _params.settings;



            if (_settings.datafile) {

                NE.Net.LoadJsonFile(_settings.datafile, function (jsonData) {

                    _quizdata = jsonData;

                    NE.Plugin.ApplyTemplate(me, function (data) {

                        _myDOMContent = $(data.replace(/{quizID}/g, _settings.ID));
                        _addToDOM(_myDOMContent);
                        _onComplete();

                    });

                });
            }
            else {
                _onComplete();
            }



        },

        Render: function (params) {


            var returnVal = '';

            if (_quizdata.title != '' || _quizdata.introContent != '') {
                returnVal += params[0].data.replace(/{title}/g, _quizdata.title).replace(/{introContent}/g, _quizdata.introContent);
            }

            for (var i = 0; i < _quizdata.questions.length; i++) {
                var question = _quizdata.questions[i];

                if (question.title != '' || question.introContent != '') {


                    returnVal += params[1].data.replace(/{title}/g, question.title).replace(/{introContent}/g, question.introContent);

                }

                returnVal += params[2].data;

                for (var j = 0; j < question.options.length; j++) {
                    var option = question.options[j];
                    var optData = params[3].data;
                    var classes = '';
                    if (question.questionType == 'singleChoice') classes += ' toggle'
                    optData = optData.replace(/{content}/g, option.content);
                    optData = optData.replace(/{answerData}/g, option.answerData);
                    optData = optData.replace(/{feedbackIndex}/g, option.feedbackIndex);
                    optData = optData.replace(/{optionButtonClasses}/g, classes);

                    returnVal += optData;
                }

                for (var j = 0; j < question.feedback.length; j++) {
                    var feedback = question.feedback[j];
                    var fbData = params[4].data;
                    fbData = fbData.replace(/{content}/g, feedback.content);
                    fbData = fbData.replace(/{mood}/g, feedback.mood);
                    fbData = fbData.replace(/{id}/g, _settings.ID + '-fb-' + j);
                    returnVal += fbData;
                }

                returnVal += params[5].data;
            }


            return returnVal;
        },


        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

