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

    function _renderQuestion(i_question, i_node) {
        var quizContainer = $('#' + _settings.ID);

        $('<h2></h2>').addClass('h2 font-weight-normal').html(i_question.title).appendTo(quizContainer);
        $('<p></p>').addClass('lead').html(i_question.introContent).appendTo(quizContainer);
  
        var optHolder = $('<div></div>').addClass('col-xs-12').appendTo(quizContainer);

        for (var i = 0; i < i_question.options.length; i++) {

            $('<div></div>').addClass('NE-button no-bg hover-blue pull-left mr-sm NE-option-button').html(i_question.options[i].content).appendTo(optHolder);
        }

    }

    function _renderQuestions(i_callback) {
        var quizContainer = $('#' + _settings.ID);

        $('<h1></h1>').addClass('offering-header-text').html(_quizdata.title).appendTo(quizContainer);
        $('<p></p>').addClass('lead').html(_quizdata.introContent).appendTo(quizContainer);

        var qustionsContainer = $('<div></div>').appendTo(quizContainer);
        for (var i = 0; i < _quizdata.questions.length; i++) {
            _renderQuestion(_quizdata.questions[i], qustionsContainer);
        }

        if (i_callback) i_callback();
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

            NE.Plugin.ApplyTemplate(this, function (data) {

                _myDOMContent = $(data);
                _addToDOM(_myDOMContent);

                if (_settings.datafile) {
                    NE.Net.LoadJsonFile(_settings.datafile, function (jsonData) {


                        _quizdata = jsonData;
                        //_renderQuestions(function () {
                        //    _numComponents = $('.NE-plugin-container', _myDOMContent.first()).length;
                        //    NE.Plugin.LoadAll(_myDOMContent.first(), _onCompnentsLoad);
                        //});

                    });
                }
                else {
                    me.OnLoaded();
                }

            });

        },

        Render: function (params) {
            var returnVal = '';
            returnVal += params[0].data.replace(/{quizID}/g, _settings.ID);
            return returnVal;
        },


        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

