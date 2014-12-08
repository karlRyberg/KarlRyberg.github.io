/// <reference path="../../NE.Navigation.js" />

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
if (NE.Plugin.revealbutton === null || NE.Plugin.revealbutton === undefined) { NE.Plugin.revealbutton = {}; }

NE.Plugin.revealbutton.EventHandlers = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////



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



    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    return {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////



        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////


        OnClick: function (sender, e) {

            var id = sender.data('reveal');
            var area = $('#' + id);
            var that = sender;

            if (!that.hasClass('open')) {

                that.addClass('active');
                area.removeClass('hidden').slideUp(0).slideDown(500, function () {
                    NE.Scroll.ToElementY(area, 'top');
                    var btnAnimTime = 0;
                    if (sender.data('keepopen') === true) {
                        if (sender.data('opentext')) that.html(sender.data('opentext'));
                        that.removeClass('active').addClass('open');
                        btnAnimTime = 400
                    }
                });

            }
            else {

                that.addClass('active');
                area.slideUp(500, function () {
                    NE.Scroll.ToElementY(that, 'top');
                    that.html(sender.data('inittext'));
                    that.removeClass('active').removeClass('open');
                    area.addClass('hidden');
                });

            }

            e.preventDefault();
            return false;

        },

        eof: null
    };

})();

