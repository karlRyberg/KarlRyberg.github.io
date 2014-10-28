
/////////////////////////////////////////////////////////////////////
//
//  TYPE:       Static class
//  NAME:       Events
//  NAMESPACE:  LOUISE.Core
//  
//  SUMMARY
//      This class lets other classes register events and execute them
//  
//  PUBLIC FIELDS  
//      N/A
//
//  EVENTS
//      N/A
//
//  PUBLIC FUNCTIONS
//      Add
//      Remove
//      Execute
//
//  DEPENDENCIES
//      N/A
//
//////////////////////////////////////////////////////////////////////

NE.Events = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _eventList = {};

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    return {
        
        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        // The event-raising class register an event to itself
        // this prevents other classes from raising their events
        Register: function (owner, eventName) {
            if (!_eventList[eventName]) {
                _eventList[eventName] = {
                    ownedBy: owner,
                    callbacks: []
                };
            }
        },

        // Add an event to the events list, a name must be supplied
        // The callback is added to the list of callbacks for the specified name
        // The name is spcified as a constant in the class raising the event
        Add: function (eventName, callback) {
            if (!eventName) throw new Error("Parameter 'eventName' is not valid");
            if (!_eventList[eventName]) throw new Error('The event name "' + eventName + '" is not registered');
            _eventList[eventName].callbacks.push(callback);
        },

        // Remove an event from the eventlist
        // The event name and callback must match a previously added event
        Remove: function (eventName, callback) {
            var callbackCollection = _eventList[eventName].callbacks;
            for (var i = 0; i < callbackCollection.length; i++) {
                if (callbackCollection[i] === callback) {
                    callbackCollection.splice(i, 1);
                    return;
                }
            }
        },

        // Executes all callbacks for a given event name.
        // The event-raising class passes itself to prevent other classes from raising it's events
        Execute: function (owner, eventName, e) {

            if (!_eventList[eventName]) throw new Error('The event name "' + eventName + '" is not registered');
            if (_eventList[eventName].ownedBy !== owner) throw Error("The event caller doesn't match the registered event owner");

            e = [].concat(e); // the apply functions needs an array, make sure it gets one
            var callbackCollection = _eventList[eventName].callbacks;
            for (var i = 0; i < callbackCollection.length; i++) {
                callbackCollection[i].apply(owner, e);
            }
        },

        eof: null};

})();