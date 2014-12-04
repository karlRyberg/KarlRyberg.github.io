/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />
/// <reference path="revealbutton.EventHandlers.js" />

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

NE.Plugin.revealbutton = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
    var _settings = {};
    var _MyDOMContent;

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

        Name: 'revealbutton',
        Dependencies: [
            'revealbutton.css',
            'revealbutton.EventHandlers.js'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            _settings = _params.settings;

            NE.Plugin.ApplyTemplate(this, function (data) {
                _MyDOMContent = $(data);
                _addToDOM(_MyDOMContent);
                _MyDOMContent.first().on('click', function (e) {
                    NE.Plugin.revealbutton.EventHandlers.OnClick($(this), e);
                });
                me.OnLoaded();
            });

        },

        Render: function (params) {

            var returnVal = params[0].data;
            var openText = _settings.openText || '';
            var keepOpen = _settings.keepOpen || true;

            returnVal = returnVal.replace(/{revealItemID}/g, _settings.revealItemID);
            returnVal = returnVal.replace(/{initText}/g, _settings.initText);
            returnVal = returnVal.replace(/{openText}/g, openText);
            returnVal = returnVal.replace(/{keepOpen}/g, keepOpen);

            return returnVal;
        },

        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

