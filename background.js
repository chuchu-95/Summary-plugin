chrome.action.onClicked.addListener(function(tab){  
    var newURL = "show.html";
    chrome.tabs.create({ url: newURL });
});