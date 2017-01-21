var Alert = (function() {
    "use strict";

    var elem,
        hideHandler,
        that = {};

    that.init = function(options) {
        elem = $(options.selector);
    };

    that.show = function(text, newClass) {
        clearTimeout(hideHandler);

        if(newClass == "alert-success"){
            elem.addClass("alert-success");
            elem.removeClass("alert-danger");
        }else{
            elem.removeClass("alert-success");
            elem.addClass("alert-danger");
        }
        elem.find("span").html(text);
        elem.delay(200).fadeIn().delay(4000).fadeOut();
    };

    return that;
}());