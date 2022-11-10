
var websql = {};

websql.db = null;

/* print websql last parameter */
websql.callSuccess = function(tx, rs) {};     

websql.callError = function(txn, e) {
    utils.logError('Error: ' + e.message);
};

websql.callTxnError = function(txn, e) {
    utils.logError('TxnError: ' + e.message);
};


/* show dynamic initalize picture and progess */
websql.showInitDBProgress = function(msg) {
    var element = document.getElementById("waiting_state");
    if (element) {
        if ( msg != undefined && msg.length ) {
            msg = msg + '<span id="syncing_spinner" class="spinner-image" />';
        }
        element.innerHTML = msg;
    }
};

/* create db and tables and index */
websql.initTables = function(){
    websql.db = openDatabase('historyDB', '1.0', 'Browser history', 2 * 1024 * 1024);

    websql.db.transaction(
        function (tx) {  
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS urls (' +
                    'urlId INTEGER PRIMARY KEY ASC, ' +
                    'url TEXT, ' +
                    'domain TEXT, ' +
                    'title TEXT, ' +
                    'host TEXT,' +
                    'visit_num INTEGER)',
                // add three parameters
                null,
                websql.callSuccess,
                websql.callError
            );
            //create index of url, domain, host
            tx.executeSql("CREATE UNIQUE INDEX IF NOT EXISTS urls_url ON urls(url)", null, websql.callSuccess, websql.callError);
            
            tx.executeSql("CREATE INDEX IF NOT EXISTS urls_domain ON urls(domain)", null, websql.callSuccess, websql.callError);

            tx.executeSql("CREATE INDEX IF NOT EXISTS urls_host ON urls(host)", null, websql.callSuccess, websql.callError);


            // rest visit table
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS timeinfo(" + 
                    "id TEXT, " +
                    "urlId INTEGER, " +
                    "url_time INTEGER, " +
                    "url_date TEXT, " +
                    "year INTEGER, " +
                    "month INTEGER, " +
                    "m_day INTEGER, " +
                    "w_day INTEGER, " + 
                    "hour INTEGER)", 
                null,
                websql.callSuccess,
                websql.callError
            );
            tx.executeSql("CREATE UNIQUE INDEX IF NOT EXISTS timeinfo_urlId_url_time ON timeinfo(urlId, url_time)", [], websql.callSuccess, websql.callError);

            tx.executeSql("CREATE INDEX IF NOT EXISTS timeinfo_url_time ON timeinfo(url_time)", [], websql.callSuccess, websql.callError);

            tx.executeSql("CREATE INDEX IF NOT EXISTS timeinfo_url_date ON timeinfo(url_date)", [], websql.callSuccess, websql.callError);


            //add title column
            tx.executeSql(
                "SELECT title FROM urls LIMIT 1", 
                null, 
                websql.callSuccess,
                function(tx, error) {   
                    tx.executeSql("ALTER TABLE urls ADD COLUMN title TEXT", null, websql.callSuccess, websql.callError);
                }
            );


            //add dicId of search_urls table

        }
    );
};

websql.initDataOfDB = function(initHelper){
    // initTables
    if(!websql.db){
        //websql.showInitDBProgress("Please waiting.........");
        websql.initTables();
    }
    websql.db.transaction(
        function(tx){
            var lastTime = utils.getLastHistoryTime();
            var nowMilliseconds = Date.now();
            // console.log(lastTime);
            if ( lastTime && (lastTime > nowMilliseconds) ) {
                utils.logInfo("Ignoring a last sync time in the future: " + (new Date(syncTime).toString()));
                syncTime = 0;
            }

            if ( lastTime ) {
                utils.logInfo("Using last history sync time: " + lastTime);
                websql.getAndSetHistory(lastTime, nowMilliseconds, initHelper);
            }

            else {
                utils.logInfo("Searching for max url time");
                tx.executeSql(
                    "SELECT IFNULL(MAX(url_time),0) AS max_url_time FROM timeinfo WHERE url_time <= ?", 
                    [nowMilliseconds], 
                    function(tx, rs) {
                        var maxUrlTime = rs.rows.item(0).max_url_time;
                        utils.logInfo("Using max visit time: " + maxUrlTime);
                        websql.getAndSetHistory(maxUrlTime, nowMilliseconds, initHelper);
                    }, 
                    websql.callError
                );
            }
        }
    );
};


websql.getAndSetHistory = function(maxVisitTime, nowMilliseconds, initHelper) {
    /* get all visit info */
    var numRequestsOutstanding = 0;
    var syncStartTime = maxVisitTime + 1;
    var maxVisitTimeSynced = 0;     // Keep track of the highest visit time seen during this sync.
    utils.logInfo("Syncing visits since " + (new Date(syncStartTime).toString()));

    chrome.history.search({
        'text': '',                // Return every history item....
        'maxResults': 1000000000,  // Have to specify something, so why not a billion?
        'startTime': syncStartTime
    },
    function(historyItems) {
        if (historyItems.length) {
            websql.db.transaction(
                function(tx) {
                    insertUrlDataTx(tx, historyItems);
                }
            );
        }
        else {
            utils.logInfo("No history items found to set");
            // initHelper();
        }
        console.log(historyItems);
        initHelper();
    });

    function insertUrlDataTx(tx, historyItems){
        var urls = [];
        var insertedUrlNum = 0;
        var historyNum = historyItems.length;

        //iterate and insert
        for(var i = 0; i < historyNum; ++i){
            var url = historyItems[i].url;
            var title = utils.formatTitle(historyItems[i].title);
            var host = utils.extractHost(url);
            var domain = utils.getDomainPortion(host);
            var visitNum = historyItems[i].visitCount;

            // var judgeLastUrl = (i == historyNum - 1);

            if (title == "") {
                title = null;
            }

            //insertCallBack


            //insert into urls table
            tx.executeSql(
                "INSERT OR IGNORE INTO urls (url, host, domain, title, visit_num) VALUES (?, ?, ?, ?, ?)", 
                [url, (host === undefined ? null : host), (domain === undefined ? null : domain), title, visitNum], 
                //insertCallBack
                websql.callSuccess,
                websql.callError
            );
            
            
            /* function getUrlId(url, isLastUrl, titleFromHistory) {
                return function(tx, rs) {
                    if (rs.rows.length) {
                        var row = rs.rows.item(0);
                        var urlid = row.urlid;
                        var titleFromDb = row.title;
                        urls.push({ urlid: urlid, url: url });
                        if (titleFromDb != titleFromHistory) {
                            utils.logInfo("Updating title for urlid=" + urlid);
                            tx.executeSql("UPDATE urls SET title=? WHERE urlid=?", [titleFromHistory, urlid], websql.onSuccess, websql.onError);
                            tx.executeSql("UPDATE search_urls SET title=? WHERE docid=?", [titleFromHistory, urlid], websql.onSuccess, websql.onError);
                        }
                    }
                    else {
                        utils.logError("Could not find urlid for url=" + url);
                    }
                    if (isLastUrl) {
                        utils.logInfo("URLS: " + numItems + " found. " + urlsInserted + " inserted.");
                        findVisits(urls);
                    }
                };
            }; */

            tx.executeSql(
                "SELECT urlId, title FROM urls WHERE url=?", 
                [url], 
                websql.callSuccess, 
                websql.callError);
        }
    }

};



