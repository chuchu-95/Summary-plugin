var utils = {};

utils.padZero = function(number, length) {
    var numString = number.toString();
    var zero = '0';
    length = length || 2;

    while(numString.length < length) {
        numString = zero + numString;
    }

    return numString;
};

/* print error logs of specific date */
utils.logError = function(msg) {
    console.log( utils.getLogMessage('ERROR', msg) );
};

utils.logWarning = function(msg) {
    console.log( utils.getLogMessage('WARNING', msg) );
};

utils.logInfo = function(msg) {
    console.log( utils.getLogMessage('INFO', msg) );
};

utils.getLogMessage = function(prefix, msg) {
    var date = new Date();
    var dateString = 
        date.getFullYear() + '-' + 
        utils.padZero(date.getMonth() + 1) + '-' +
        utils.padZero(date.getDate()) + ' ' +
        utils.padZero(date.getHours()) + ':' +
        utils.padZero(date.getMinutes()) + ':' +
        utils.padZero(date.getSeconds()) + '.' +
        utils.padZero(date.getMilliseconds(), 3)
    ;
    return(dateString + ": " + prefix + ": " + msg);
};


/* get and set last history time */
utils.getLastHistoryTime = function() {
    var milliseconds = window.localStorage.getItem('lastHistoryTime');
    if ( milliseconds ) {
        return parseFloat( milliseconds );
    }
    return;
};

utils.setLastHistoryTime = function(milliseconds) {
    if (milliseconds) {
        window.localStorage.setItem('lastHistoryTime', milliseconds);
    }
    else {
        window.localStorage.removeItem('lastHistoryTime');
    }
};


/* deposit string */

// format title
utils.formatTitle = function(title) {
    if (title == null) {
        return null;
    }

   title = title.replace(/[\t\r\n]/g, ' ');
   title = title.replace(/\s\s+/g, ' ');
    
   return title.trim();
};

//format domain
//'http://www.example.com/?x=1') returns 'www.example.com'
utils.extractHost = function(url) {
    var matches = url.match(/^.+?:\/\/(?:[^:@]+:[^@]+@)?([^/?:]+)/);
    return matches ? matches[1] : undefined;
};

//combine domain
    /* Examples:  
        utils.getDomainPortion('www.blog.example.com') returns 'example.com'
        utils.getDomainPortion('www.blog.example.com', 'example.com') returns 'blog.example.com'
        utils.getDomainPortion('www.blog.example.com', 'blog.example.com') returns 'www.blog.example.com'
     */
utils.getDomainPortion = function(host, baseDomain) {
    var domain;
    host = host || '';
    baseDomain = baseDomain || '';
    
    if (baseDomain.length) {
        var regex = new RegExp('[^.]*\\.?' + utils.escapeDots(baseDomain) + '$');
        var matches = host.match(regex);
        domain = matches ? matches[0] : undefined;
    }
    else {
        domain = public_suffix.get_root_domain(host);
    }
    
    return domain;
};