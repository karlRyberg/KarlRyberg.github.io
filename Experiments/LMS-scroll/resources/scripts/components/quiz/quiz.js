/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />

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

            if (cnt++ == limit-1) {

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

                        _adjustButtons();

                        $('#' + _settings.ID).on('click', '.NE-quiz-option-button', function () {

                        });

                        me.OnLoaded();

                    });

                });
            }
            else {
                me.OnLoaded();
            }



        },

        Render: function (params) {
            var returnVal = '';

            console.log(_quizdata);

            if (_quizdata.title != '' || _quizdata.introContent != '') {
                returnVal += params[0].data.replace(/{title}/g, _quizdata.title).replace(/{introContent}/g, _quizdata.introContent);
            }

            for (var i = 0; i < _quizdata.questions.length; i++) {
                var question = _quizdata.questions[i];

                if (question.title != '' || question.introContent != '') {

                    if (_quizdata.title == '' && _quizdata.introContent == '') {
                        returnVal += params[0].data.replace(/{title}/g, question.title).replace(/{introContent}/g, question.introContent);
                    }
                    else{
                        returnVal += params[1].data.replace(/{title}/g, question.title).replace(/{introContent}/g, question.introContent);
                    }
                }

                returnVal += params[2].data;

                for (var j = 0; j < question.options.length; j++) {
                    var option = question.options[j];
                    returnVal += params[3].data.replace(/{content}/g, option.content).replace(/{answerData}/g, option.answerData);
                }

                returnVal += params[4].data;
            }


            return returnVal;
        },


        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

